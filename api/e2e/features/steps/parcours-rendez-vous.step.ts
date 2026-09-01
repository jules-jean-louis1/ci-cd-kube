import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import argon2 from "argon2";
import { prisma } from "../../../src/utils/prisma.js";
import { getBaseUrl } from "../support/hooks.js";

/**
 * Identifiant unique par exécution. La colonne users.email porte une contrainte
 * d'unicité : sans ce suffixe, le test ne serait jouable qu'une seule fois et
 * échouerait ensuite sur un conflit d'email.
 */
const execution = Date.now();
const MOT_DE_PASSE = "MotDePasseE2E123456!";

const emailAdmin = `e2e-admin-${execution}@healthsync.test`;
const emailPatient = `e2e-patient-${execution}@healthsync.test`;
const emailMedecin = `e2e-medecin-${execution}@healthsync.test`;

// État partagé entre les étapes du parcours.
let jetonAdmin = "";
let jetonPatient = "";
let idPatient = "";
let idMedecin = "";
let idRendezVous = "";
let dureeCreneau = 30;

let reponse: Response;
let corps: unknown = null;

/** Créneau visé : dans 7 jours à 10h00 UTC, pour rester dans le futur. */
const debutRdv = (() => {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setUTCHours(10, 0, 0, 0);
  return date;
})();

/**
 * Extrait l'identifiant utilisateur de la charge utile du JWT.
 * On ne vérifie pas la signature ici : le serveur l'a déjà fait en émettant
 * le jeton, et le test a seulement besoin de l'identifiant pour construire
 * la requête de réservation.
 */
const lireIdUtilisateur = (jeton: string): string => {
  const chargeUtile = jeton.split(".")[1];
  const json = Buffer.from(chargeUtile, "base64url").toString("utf8");
  return (JSON.parse(json) as { userId: string }).userId;
};

/**
 * Appelle l'API par HTTP réel et mémorise la réponse.
 * Les étapes ne connaissent que des URL : à aucun moment l'application Hono
 * n'est appelée en mémoire.
 */
const appeler = async (
  chemin: string,
  options: { methode?: string; jeton?: string; corps?: unknown } = {},
): Promise<void> => {
  const enTetes: Record<string, string> = { "Content-Type": "application/json" };
  if (options.jeton) enTetes.Authorization = `Bearer ${options.jeton}`;

  reponse = await fetch(`${getBaseUrl()}${chemin}`, {
    method: options.methode ?? "GET",
    headers: enTetes,
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  });
  corps = await reponse.json().catch(() => null);
};

// --- Contexte ---------------------------------------------------------------

Given("un compte administrateur existant en base", { timeout: 30_000 }, async () => {
  // Aucun endpoint ne permet de créer un administrateur : POST /auth/register
  // force le rôle "patient" côté serveur. Ce compte est donc une donnée de
  // départ, insérée directement en base. Tout le reste du parcours passe
  // exclusivement par l'API HTTP.
  await prisma.users.create({
    data: {
      email: emailAdmin,
      firstname: "Admin",
      lastname: "E2E",
      phone: "0600000000",
      date_of_birth: new Date("1980-01-01"),
      password_hash: await argon2.hash(MOT_DE_PASSE),
      role: "admin",
    },
  });

  await appeler("/auth/login", {
    methode: "POST",
    corps: { email: emailAdmin, password: MOT_DE_PASSE },
  });
  assert.strictEqual(reponse.status, 200, "L'administrateur doit pouvoir se connecter");
  jetonAdmin = (corps as { token: string }).token;
  assert.ok(jetonAdmin, "Jeton de l'administrateur manquant");
});

// --- 1. Inscription du patient ---------------------------------------------

When("un visiteur s'inscrit avec une adresse email inédite", { timeout: 30_000 }, async () => {
  await appeler("/auth/register", {
    methode: "POST",
    corps: {
      email: emailPatient,
      password: MOT_DE_PASSE,
      firstname: "Camille",
      lastname: "Patient",
      phone: "0611111111",
      date_of_birth: "1992-04-17",
    },
  });
});

Then("la réponse a le code {int}", (codeAttendu: number) => {
  assert.strictEqual(reponse.status, codeAttendu, `Corps reçu : ${JSON.stringify(corps)}`);
});

Then("le patient obtient un jeton d'authentification", { timeout: 30_000 }, async () => {
  await appeler("/auth/login", {
    methode: "POST",
    corps: { email: emailPatient, password: MOT_DE_PASSE },
  });
  assert.strictEqual(reponse.status, 200, `Corps reçu : ${JSON.stringify(corps)}`);
  jetonPatient = (corps as { token: string }).token;
  assert.ok(jetonPatient, "Jeton du patient manquant");
  idPatient = lireIdUtilisateur(jetonPatient);
});

// --- 2. Création du médecin ------------------------------------------------

When("l'administrateur crée un médecin", { timeout: 30_000 }, async () => {
  await appeler("/doctor", {
    methode: "POST",
    jeton: jetonAdmin,
    corps: {
      email: emailMedecin,
      password: MOT_DE_PASSE,
      firstname: "Bruno",
      lastname: "Medecin",
      phone: "0622222222",
      date_of_birth: "1978-09-30",
    },
  });
  if (reponse.status === 201) {
    idMedecin = (corps as { doctor: { id: string } }).doctor.id;
  }
});

// --- 3. Prise de rendez-vous ----------------------------------------------

When("le patient réserve un créneau de {int} minutes chez ce médecin", async (duree: number) => {
  dureeCreneau = duree;
  const fin = new Date(debutRdv.getTime() + duree * 60 * 1000);
  await appeler("/appointments", {
    methode: "POST",
    jeton: jetonPatient,
    corps: {
      doctor_id: idMedecin,
      patient_id: idPatient,
      start_at: debutRdv.toISOString(),
      end_at: fin.toISOString(),
    },
  });
  if (reponse.status === 201) {
    idRendezVous = (corps as { id: string }).id;
  }
});

Then("le rendez-vous créé a le statut {string}", (statutAttendu: string) => {
  assert.strictEqual((corps as { status: string }).status, statutAttendu);
  assert.ok(idRendezVous, "Identifiant du rendez-vous non récupéré");
});

// --- 4. Conflit de créneau ------------------------------------------------

When("le patient tente de réserver à nouveau le même créneau", async () => {
  const fin = new Date(debutRdv.getTime() + dureeCreneau * 60 * 1000);
  await appeler("/appointments", {
    methode: "POST",
    jeton: jetonPatient,
    corps: {
      doctor_id: idMedecin,
      patient_id: idPatient,
      start_at: debutRdv.toISOString(),
      end_at: fin.toISOString(),
    },
  });
});

Then("le message d'erreur signale que le créneau est déjà occupé", () => {
  const message = (corps as { error?: string }).error ?? "";
  assert.match(message, /already occupied/i, `Message reçu : ${message}`);
});

// --- 5. Annulation --------------------------------------------------------

When("le patient annule son rendez-vous", async () => {
  await appeler(`/appointments/${idRendezVous}`, {
    methode: "DELETE",
    jeton: jetonPatient,
  });
});

// --- 6. Historique --------------------------------------------------------

When("le patient consulte son historique de rendez-vous", async () => {
  await appeler("/appointments/history", { jeton: jetonPatient });
});

Then("l'historique contient le rendez-vous avec le statut {string}", (statutAttendu: string) => {
  const historique = corps as Array<{ id: string; status: string }>;
  assert.ok(Array.isArray(historique), "L'historique doit être un tableau");

  const rendezVous = historique.find((element) => element.id === idRendezVous);
  assert.ok(rendezVous, "Le rendez-vous annulé est absent de l'historique");
  assert.strictEqual(rendezVous.status, statutAttendu);
});
