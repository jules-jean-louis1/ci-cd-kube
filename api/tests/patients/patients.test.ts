import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/index.js";
import { prisma } from "../../src/utils/prisma.js";
import argon2 from "argon2";

describe("Patients CRUD (admin)", () => {
  const adminUser = {
    email: "admin.patients@test.com",
    password: "AdminPassword123456!",
  };
  const medecinUser = {
    email: "medecin.patients@test.com",
    password: "MedecinPassword123456!",
  };
  const patientCredentials = {
    email: "patient.crud@test.com",
    password: "PatientPassword123456!",
    firstname: "Alice",
    lastname: "Martin",
    phone: "0611223344",
    date_of_birth: "1992-03-10",
  };
  const deletablePatientEmail = "deletable.patient@test.com";
  const patientWithAppointmentEmail = "patient.with.appointment@test.com";
  const otherPatientEmail = "other.patient@test.com";
  const searchPatientEmail = "zoe.search@test.com";

  const allTestEmails = [
    adminUser.email,
    medecinUser.email,
    patientCredentials.email,
    deletablePatientEmail,
    patientWithAppointmentEmail,
    otherPatientEmail,
    searchPatientEmail,
  ];

  let adminToken: string;
  let medecinToken: string;
  let patientToken: string;
  let targetPatientId: string;
  let deletablePatientId: string;
  let patientWithAppointmentId: string;
  let medecinId: string;

  beforeAll(async () => {
    // Nettoyage préventif
    await prisma.appointments.deleteMany({});
    await prisma.refresh_tokens.deleteMany({});
    await prisma.users.deleteMany({ where: { email: { in: allTestEmails } } });

    // Comptes admin/medecin créés directement en base : pas d'endpoint public
    // pour ça (volontaire, cf. US-01 — pas d'auto-inscription en admin/medecin).
    await prisma.users.create({
      data: {
        email: adminUser.email,
        password_hash: await argon2.hash(adminUser.password),
        firstname: "Admin",
        lastname: "Test",
        phone: "0600000000",
        date_of_birth: new Date("1980-01-01"),
        role: "admin",
      },
    });

    const medecin = await prisma.users.create({
      data: {
        email: medecinUser.email,
        password_hash: await argon2.hash(medecinUser.password),
        firstname: "Medecin",
        lastname: "Test",
        phone: "0600000001",
        date_of_birth: new Date("1975-01-01"),
        role: "medecin",
      },
    });
    medecinId = medecin.id;

    // Patients créés via l'endpoint public, comme de vrais utilisateurs
    for (const email of [
      patientCredentials.email,
      deletablePatientEmail,
      patientWithAppointmentEmail,
      otherPatientEmail,
    ]) {
      await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patientCredentials, email }),
      });
    }

    // Patient dédié à la recherche (US-03) — prénom/nom distincts des autres
    await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...patientCredentials,
        email: searchPatientEmail,
        firstname: "Zoe",
        lastname: "Rechercheatest",
      }),
    });

    targetPatientId = (
      await prisma.users.findUniqueOrThrow({ where: { email: patientCredentials.email } })
    ).id;
    deletablePatientId = (
      await prisma.users.findUniqueOrThrow({ where: { email: deletablePatientEmail } })
    ).id;
    patientWithAppointmentId = (
      await prisma.users.findUniqueOrThrow({ where: { email: patientWithAppointmentEmail } })
    ).id;

    // Rendez-vous liant patientWithAppointmentId, pour le test 409 à la suppression
    await prisma.appointments.create({
      data: {
        patient_id: patientWithAppointmentId,
        doctor_id: medecinId,
        start_at: new Date("2026-08-01T10:00:00Z"),
        end_at: new Date("2026-08-01T10:30:00Z"),
      },
    });

    // Récupération des tokens par login
    const adminLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminUser),
    });
    adminToken = (await adminLogin.json()).token;

    const medecinLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(medecinUser),
    });
    medecinToken = (await medecinLogin.json()).token;

    const patientLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: patientCredentials.email,
        password: patientCredentials.password,
      }),
    });
    patientToken = (await patientLogin.json()).token;
  });

  afterAll(async () => {
    await prisma.appointments.deleteMany({ where: { patient_id: patientWithAppointmentId } });
    await prisma.refresh_tokens.deleteMany({});
    await prisma.users.deleteMany({ where: { email: { in: allTestEmails } } });
  });

  describe("GET /patients (recherche)", () => {
    it("should return 401 without a token", async () => {
      const res = await app.request("/patients?name=Zoe");
      expect(res.status).toBe(401);
    });

    it("should return 403 for a patient token", async () => {
      const res = await app.request("/patients?name=Zoe", {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should return 400 when neither name nor email is provided", async () => {
      const res = await app.request("/patients", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(400);
    });

    it("should find the patient by partial firstname (case-insensitive)", async () => {
      const res = await app.request("/patients?name=zoe", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.some((p: any) => p.email === searchPatientEmail)).toBe(true);
      expect(body.every((p: any) => !("password_hash" in p))).toBe(true);
    });

    it("should find the patient by partial lastname", async () => {
      const res = await app.request("/patients?name=recherche", {
        headers: { Authorization: `Bearer ${medecinToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.some((p: any) => p.email === searchPatientEmail)).toBe(true);
    });

    it("should find the patient by partial email", async () => {
      const res = await app.request("/patients?email=zoe.search", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.some((p: any) => p.email === searchPatientEmail)).toBe(true);
    });

    it("should return an empty array when nothing matches", async () => {
      const res = await app.request("/patients?name=nomqui nexistepas", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe("GET /patients/:id", () => {
    it("should return 401 without a token", async () => {
      const res = await app.request(`/patients/${targetPatientId}`);
      expect(res.status).toBe(401);
    });

    it("should return 403 for a patient token", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should return the patient for an admin token, without password_hash", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.email).toBe(patientCredentials.email);
      expect(body).not.toHaveProperty("password_hash");
    });

    it("should return the patient for a medecin token", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        headers: { Authorization: `Bearer ${medecinToken}` },
      });
      expect(res.status).toBe(200);
    });

    it("should return 404 for a non-existent id", async () => {
      const res = await app.request("/patients/00000000-0000-0000-0000-000000000000", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it("should return 404 when the id belongs to a non-patient account", async () => {
      const res = await app.request(
        `/patients/${(await prisma.users.findUniqueOrThrow({ where: { email: adminUser.email } })).id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      expect(res.status).toBe(404);
    });

    it("should return 400 for a malformed id", async () => {
      const res = await app.request("/patients/not-a-uuid", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /patients/:id", () => {
    it("should update the patient's firstname and phone", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ firstname: "Alicia", phone: "0699999999" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.firstname).toBe("Alicia");
      expect(body.phone).toBe("0699999999");
    });

    it("should return 400 for an empty body", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for an invalid email format", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ email: "not-an-email" }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 409 when the new email is already used by another account", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ email: otherPatientEmail }),
      });
      expect(res.status).toBe(409);
    });

    it("should return 404 for a non-existent id", async () => {
      const res = await app.request("/patients/00000000-0000-0000-0000-000000000000", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ firstname: "Ghost" }),
      });
      expect(res.status).toBe(404);
    });

    it("should return 403 for a patient token", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken}` },
        body: JSON.stringify({ firstname: "Hacker" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /patients/:id", () => {
    it("should return 409 when the patient has existing appointments", async () => {
      const res = await app.request(`/patients/${patientWithAppointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(409);
    });

    it("should delete a patient without appointments", async () => {
      const res = await app.request(`/patients/${deletablePatientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("success", "Patient deleted");
    });

    it("should return 404 when deleting an already-deleted patient", async () => {
      const res = await app.request(`/patients/${deletablePatientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it("should return 403 for a patient token", async () => {
      const res = await app.request(`/patients/${targetPatientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      expect(res.status).toBe(403);
    });
  });
});
