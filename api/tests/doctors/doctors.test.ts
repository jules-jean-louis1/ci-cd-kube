import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/index.js";
import { prisma } from "../../src/utils/prisma.js";
import { sign } from "hono/jwt";
import { USER_ROLE } from "../../src/utils/user.js";

describe("Doctor CRUD Endpoints", () => {
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;

  let createdDoctorId: string;
  const targetDoctorId = "550e8400-e29b-41d4-a716-446655440000";
  const testDoctorEmail = "target.doctor@test.com";

  beforeAll(async () => {
    const secret = process.env.JWT_SECRET || "supersecretjwtkey";
    const exp = Math.floor(Date.now() / 1000) + 3600;

    // 1. Nettoyage de sécurité
    await prisma.users.deleteMany({
      where: {
        OR: [
          { id: targetDoctorId },
          { email: testDoctorEmail },
          { email: "new.doctor@example.com" },
        ],
      },
    });

    await prisma.users.create({
      data: {
        id: targetDoctorId,
        firstname: "Jean",
        lastname: "Dupont",
        email: testDoctorEmail,
        phone: "0612345678",
        date_of_birth: new Date("1980-01-01"),
        password_hash: "dummy_hash",
        role: USER_ROLE.DOCTOR as any,
      },
    });

    // 3. Génération des tokens JWT
    adminToken = await sign({ userId: "admin-id", role: USER_ROLE.ADMIN, exp }, secret);
    doctorToken = await sign({ userId: targetDoctorId, role: USER_ROLE.DOCTOR, exp }, secret);
    patientToken = await sign({ userId: "patient-id", role: USER_ROLE.PATIENT, exp }, secret);
  });

  afterAll(async () => {
    // Nettoyage après tous les tests
    await prisma.users.deleteMany({
      where: {
        OR: [{ id: targetDoctorId }, { email: "new.doctor@example.com" }],
      },
    });
  });

  // --- POST /doctor (CREATE) ---
  describe("POST /doctor", () => {
    it("should allow an admin to create a new doctor", async () => {
      const res = await app.request("/doctor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "new.doctor@example.com",
          firstname: "Gregory",
          lastname: "House",
          date_of_birth: "1970-05-15",
          phone: "0611223344",
          password: "SecurePassword123!",
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.doctor).toHaveProperty("id");
      expect(body.doctor.email).toBe("new.doctor@example.com");

      createdDoctorId = body.doctor.id; // Stocké pour le test de suppression à la fin
    });

    it("should reject creation if body data is invalid (Zod fail)", async () => {
      const res = await app.request("/doctor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "not-an-email", // Invalide
          firstname: "G", // Trop court
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  // --- GET /doctors (READ ALL) ---
  describe("GET /doctors", () => {
    it("should allow any authenticated user to fetch the doctors list", async () => {
      const res = await app.request("/doctors", {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("doctors");
      expect(body).toHaveProperty("count");
      expect(Array.isArray(body.doctors)).toBe(true);
    });
  });

  // --- GET /doctor/:id (READ ONE) ---
  describe("GET /doctor/:id", () => {
    it("should return the profile without sensitive data for a patient (secure mode)", async () => {
      const res = await app.request(`/doctor/${targetDoctorId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.doctor).toBeDefined();
      expect(body.doctor.date_of_birth).toBeUndefined(); // Masqué pour les patients
      expect(body.doctor.password_hash).toBeUndefined(); // Toujours masqué
    });

    it("should return full details if requested by the doctor themselves", async () => {
      const res = await app.request(`/doctor/${targetDoctorId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.doctor.date_of_birth).toBeDefined(); // Visible pour le médecin lui-même
    });

    it("should return 404 if the doctor does not exist", async () => {
      const res = await app.request("/doctor/00000000-0000-0000-0000-000000000000", {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  // --- PUT /doctor/:id (UPDATE) ---
  describe("PUT /doctor/:id", () => {
    it("should allow a doctor to update their own profile partially", async () => {
      const res = await app.request(`/doctor/${targetDoctorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${doctorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: "Jean-Christophe", // Modification du prénom
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.doctor.firstname).toBe("Jean-Christophe");
    });

    it("should forbid a doctor to update another doctor's profile", async () => {
      const res = await app.request(`/doctor/${createdDoctorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${doctorToken}`, // C'est l'ID de targetDoctorId
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname: "Hacker" }),
      });

      expect(res.status).toBe(403);
    });

    it("should return 404 via Prisma catch block if the doctor does not exist", async () => {
      const res = await app.request("/doctor/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname: "Ghost" }),
      });

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE /doctor/:id (DELETE) ---
  describe("DELETE /doctor/:id", () => {
    it("should forbid a patient from deleting a doctor", async () => {
      const res = await app.request(`/doctor/${createdDoctorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(403);
    });

    it("should allow an admin to delete a doctor", async () => {
      const res = await app.request(`/doctor/${createdDoctorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toContain("successfully");
    });

    it("should return 404 if trying to delete an already deleted doctor", async () => {
      const res = await app.request(`/doctor/${createdDoctorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });
});
