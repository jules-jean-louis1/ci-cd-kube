import { Prisma, users } from "@prisma/client";
import { SearchPatientsQuery, UpdatePatientInput } from "./patients.dto.js";
import { prisma } from "../../utils/prisma.js";

/**
 * Récupère un patient par id. Le filtre role: "patient" est volontaire :
 * si l'id correspond à un admin ou un medecin, on ne le trouve pas ici —
 * ce module ne doit jamais exposer d'infos sur des comptes non-patients.
 */
export const findPatientById = async (id: string): Promise<users | null> => {
  return await prisma.users.findFirst({ where: { id, role: "patient" } });
};

/**
 * Recherche des patients par nom (prénom OU nom de famille) et/ou email,
 * en "contient" insensible à la casse. Si les deux filtres sont fournis,
 * ils se combinent en ET (affine la recherche). Toujours limité aux
 * comptes role: "patient", plafonné à 50 résultats.
 */
export const searchPatients = async (filters: SearchPatientsQuery): Promise<users[]> => {
  const conditions: Prisma.usersWhereInput[] = [];

  if (filters.name) {
    conditions.push({
      OR: [
        { firstname: { contains: filters.name, mode: "insensitive" } },
        { lastname: { contains: filters.name, mode: "insensitive" } },
      ],
    });
  }

  if (filters.email) {
    conditions.push({ email: { contains: filters.email, mode: "insensitive" } });
  }

  return await prisma.users.findMany({
    where: { role: "patient", AND: conditions },
    take: 50,
    orderBy: { lastname: "asc" },
  });
};

/**
 * Modifie partiellement les infos d'un patient. Retourne null si l'id
 * n'existe pas ou ne correspond pas à un patient (le contrôleur traduit
 * ça en 404, sans distinguer les deux cas côté client).
 */
export const updatePatient = async (
  id: string,
  data: UpdatePatientInput,
): Promise<users | null> => {
  const existing = await prisma.users.findFirst({ where: { id, role: "patient" } });
  if (!existing) return null;

  return await prisma.users.update({
    where: { id },
    data,
  });
};

/**
 * Supprime un patient. Retourne null si l'id n'existe pas / n'est pas un patient.
 * Si le patient a des rendez-vous liés, Prisma lèvera une erreur de contrainte
 * de clé étrangère (code P2003) — volontairement NON catchée ici, c'est au
 * contrôleur de la traduire en réponse HTTP appropriée.
 * TODO RGPD : ceci est une suppression dure, pas un vrai traitement du droit
 * à l'oubli (anonymisation/purge) — sujet à traiter séparément.
 */
export const deletePatient = async (id: string): Promise<users | null> => {
  const existing = await prisma.users.findFirst({ where: { id, role: "patient" } });
  if (!existing) return null;

  return await prisma.users.delete({ where: { id } });
};
