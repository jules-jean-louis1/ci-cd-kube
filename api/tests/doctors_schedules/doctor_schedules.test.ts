import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/index.js";
import { sign } from "hono/jwt";
import { prisma } from "../../src/utils/prisma.js";
import { USER_ROLE } from "../../src/utils/user.js";

app.onError((err, c) => {
  console.error("🔥 HONO EXCEPTION DETECTED IN TEST:", err);
  return c.text(`Test Server Error: ${err.message}\nStack: ${err.stack}`, 500);
});

let doctorToken: string;
let patientToken: string;

let doctorId: string;
let patientId: string;
let scheduleId: number;

const timestamp = Date.now();
const doctorEmail = `doc.schedules.${timestamp}@test.com`;
const patientEmail = `patient.schedules.${timestamp}@test.com`;

beforeAll(async () => {
  const secret = process.env.JWT_SECRET || "supersecretjwtkey";

  // 1. Nettoyer les plannings et utilisateurs de test précédents
  await prisma.users.deleteMany({
    where: {
      email: { in: [doctorEmail, patientEmail] },
    },
  });

  // 2. Créer une spécialité propre pour le médecin
  const specialty = await prisma.specialties.create({
    data: { name: `Cardio-${timestamp}` },
  });

  // 3. Créer un médecin valide avec sa spécialité liée
  const doctor = await prisma.users.create({
    data: {
      firstname: "Jean",
      lastname: "Dupont",
      email: doctorEmail,
      phone: "0612345678",
      date_of_birth: new Date("1980-01-01"),
      password_hash: "dummy_hash",
      role: "medecin",
      doctor_specialties: {
        create: {
          specialty_id: specialty.id,
        },
      },
    },
  });

  // 4. Créer un patient valide
  const patient = await prisma.users.create({
    data: {
      firstname: "Marc",
      lastname: "Durand",
      email: patientEmail,
      phone: "0687654321",
      date_of_birth: new Date("1995-05-10"),
      password_hash: "dummy_hash",
      role: "patient",
    },
  });

  doctorId = doctor.id;
  patientId = patient.id;

  // --- SÉCURITÉ : On valide immédiatement que les utilisateurs existent bien en BDD ---
  const checkDoctor = await prisma.users.findUnique({ where: { id: doctorId } });
  const checkPatient = await prisma.users.findUnique({ where: { id: patientId } });

  if (!checkDoctor || !checkPatient) {
    throw new Error("Échec critique : Le médecin ou le patient n'a pas été créé en BDD.");
  }

  // 5. Générer les tokens JWT (Utilisation de USER_ROLE.MEDECIN ou "medecin")
  const exp = Math.floor(Date.now() / 1000) + 3600;

  doctorToken = await sign(
    {
      userId: doctorId,
      role: USER_ROLE?.DOCTOR || "medecin",
      exp,
    },
    secret,
  );

  patientToken = await sign(
    {
      userId: patientId,
      role: USER_ROLE?.PATIENT || "patient",
      exp,
    },
    secret,
  );
});

afterAll(async () => {
  await prisma.doctor_schedules.deleteMany({
    where: { doctor_id: doctorId },
  });
  await prisma.users.deleteMany({
    where: {
      email: { in: [doctorEmail, patientEmail] },
    },
  });
});

describe("Doctor schedules", () => {
  describe("POST /doctor-schedules", () => {
    it("should create a schedule", async () => {
      const res = await app.request("/doctor-schedules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          day_of_week: 1,
          start_time: "09:00",
          end_time: "12:00",
          slot_duration: 20,
        }),
      });

      // Si ça échoue, on affiche TOUT le message d'erreur serveur
      if (res.status !== 201) {
        const errorBody = await res.text();
        console.error("❌ ERREUR SERVEUR DETECTEE (POST) :", errorBody);
      }

      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.schedule.doctor_id).toBe(doctorId);
      expect(body.schedule.day_of_week).toBe(1);

      scheduleId = body.schedule.id;
    });

    it("should reject invalid body", async () => {
      const res = await app.request("/doctor-schedules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          day_of_week: 10,
          start_time: "15:00",
          end_time: "12:00",
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should reject patient", async () => {
      const res = await app.request("/doctor-schedules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${patientToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          day_of_week: 2,
          start_time: "09:00",
          end_time: "12:00",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("should reject without token", async () => {
      const res = await app.request("/doctor-schedules", {
        method: "POST",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /doctor/:doctorId/schedules", () => {
    it("should return doctor schedules", async () => {
      const res = await app.request(`/doctor/${doctorId}/schedules`, {
        headers: {
          Authorization: `Bearer ${patientToken}`,
        },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body.schedules)).toBe(true);
      expect(body.schedules.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown doctor", async () => {
      const res = await app.request("/doctor/00000000-0000-0000-0000-000000000001/schedules", {
        headers: {
          Authorization: `Bearer ${patientToken}`,
        },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.schedules).toEqual([]);
    });

    it("should reject without token", async () => {
      const res = await app.request(`/doctor/${doctorId}/schedules`);

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /doctor-schedules/:id", () => {
    it("should update schedule", async () => {
      const targetId = scheduleId || 1;
      const res = await app.request(`/doctor-schedules/${targetId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          day_of_week: 1,
          start_time: "10:00",
          end_time: "13:00",
          slot_duration: 15,
        }),
      });

      if (res.status !== 200) {
        const errorBody = await res.text();
        console.error("❌ ERREUR SERVEUR DETECTEE (PUT) :", errorBody);
      }

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.schedule.slot_duration).toBe(15);
    });

    it("should reject invalid id", async () => {
      const res = await app.request("/doctor-schedules/test", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
      });

      expect(res.status).toBe(400);
    });

    it("should reject invalid body", async () => {
      const targetId = scheduleId || 1;
      const res = await app.request(`/doctor-schedules/${targetId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          day_of_week: 1,
          start_time: "15:00",
          end_time: "10:00",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /doctor-schedules/:id", () => {
    it("should delete schedule", async () => {
      const targetId = scheduleId || 1;
      const res = await app.request(`/doctor-schedules/${targetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.message).toBe("Schedule deleted successfully");
    });

    it("should return 404 for missing schedule", async () => {
      const targetId = scheduleId || 1;
      const res = await app.request(`/doctor-schedules/${targetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it("should reject invalid id", async () => {
      const res = await app.request("/doctor-schedules/abc", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
        },
      });

      expect(res.status).toBe(400);
    });

    it("should reject patient", async () => {
      const res = await app.request(`/doctor-schedules/99999`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${patientToken}`,
        },
      });

      expect(res.status).toBe(403);
    });
  });
});
