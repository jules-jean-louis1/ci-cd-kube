import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/index.js";
import { sign } from "hono/jwt";
import { USER_ROLE } from "../../src/utils/user.js";
import { prisma } from "../../src/utils/prisma.js";

app.onError((err, c) => {
  console.error("HONO EXCEPTION DETECTED IN TEST:", err);
  return c.text(`Test Server Error: ${err.message}\nStack: ${err.stack}`, 500);
});

describe("Specialties CRUD Endpoints", () => {
  let adminToken: string;
  let patientToken: string;

  let createdSpecialtyId: number;
  let staticTestSpecialtyId: number;

  beforeAll(async () => {
    const secret = process.env.JWT_SECRET || "supersecretjwtkey";
    const exp = Math.floor(Date.now() / 1000) + 3600;

    adminToken = await sign({ userId: "admin-id", role: USER_ROLE.ADMIN, exp }, secret);
    patientToken = await sign({ userId: "patient-id", role: USER_ROLE.PATIENT, exp }, secret);

    // Création d'une spécialité de secours en BDD dédiée aux tests unitaires de modification/lecture
    const fallbackSpecialty = await prisma.specialties.create({
      data: {
        name: `Test-Fixture-${Date.now()}`,
      },
    });
    staticTestSpecialtyId = fallbackSpecialty.id;
  });

  afterAll(async () => {
    // Nettoyage de la spécialité de test si elle n'a pas été supprimée
    try {
      await prisma.specialties.deleteMany({
        where: {
          id: staticTestSpecialtyId,
        },
      });
    } catch {
      // Ignorer si déjà supprimée par le test DELETE
    }
  });

  // --- POST /specialty ---
  describe("POST /specialty", () => {
    it("should allow an admin to create a new specialty", async () => {
      const uniqueName = `Ophtalmologie-${Date.now()}`;

      const res = await app.request("/specialty", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: uniqueName }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.specialty).toHaveProperty("id");

      createdSpecialtyId = body.specialty.id;
    });

    it("should forbid a non-admin user from creating a specialty", async () => {
      const res = await app.request("/specialty", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${patientToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Dentiste" }),
      });

      expect(res.status).toBe(403);
    });

    it("should return 400 if the payload format is invalid (Zod fail)", async () => {
      const res = await app.request("/specialty", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "" }),
      });

      expect(res.status).toBe(400);
    });
  });

  // --- GET /specialties ---
  describe("GET /specialties", () => {
    it("should allow any authenticated user to fetch all specialties", async () => {
      const res = await app.request("/specialties", {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("specialties");
    });
  });

  // --- GET /specialty/:id ---
  describe("GET /specialty/:id", () => {
    it("should return a specific specialty by its ID", async () => {
      // Utilisation ciblée de la fixture stable créée dans le beforeAll
      const targetId = staticTestSpecialtyId;
      const res = await app.request(`/specialty/${targetId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.specialty.id).toBe(targetId);
    });

    it("should return 404 if the specialty does not exist", async () => {
      const res = await app.request("/specialty/99999", {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  // --- PUT /specialty/:id ---
  describe("PUT /specialty/:id", () => {
    it("should allow an admin to update a specialty name", async () => {
      const localSpecialty = await prisma.specialties.create({
        data: { name: `To-Update-${Date.now()}` },
      });

      const uniqueUpdateName = `Neurologie-${Date.now()}`;

      const res = await app.request(`/specialty/${localSpecialty.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: uniqueUpdateName }),
      });
      console.log(
        "PUT /specialty/:id response status:",
        res.body ? res.status : "No response body",
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.specialty.name).toBe(uniqueUpdateName);

      await prisma.specialties.delete({ where: { id: localSpecialty.id } }).catch(() => {});
    });
  });

  // --- DELETE /specialty/:id ---
  describe("DELETE /specialty/:id", () => {
    it("should forbid a standard user from deleting a specialty", async () => {
      const targetId = staticTestSpecialtyId;
      const res = await app.request(`/specialty/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientToken}` },
      });

      expect(res.status).toBe(403);
    });

    it("should allow an admin to delete a specialty", async () => {
      // On supprime d'abord celle créée dynamiquement dans le test POST
      const targetId = createdSpecialtyId || staticTestSpecialtyId;
      const res = await app.request(`/specialty/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
    });
  });
});
