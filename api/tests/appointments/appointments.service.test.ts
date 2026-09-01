import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  validateSlotDuration,
  hasConflict,
} from "../../src/modules/appointments/appointments.service.js";
import { prisma } from "../../src/utils/prisma.js";

// Tests unitaires : Prisma est entièrement mocké, aucune connexion réelle à la base.
// Contrairement aux tests d'intégration (appointments.test.ts), on n'a pas besoin
// d'aligner day_of_week ou de vrais UUID sur des données réelles : on contrôle
// directement ce que Prisma est censé renvoyer, et on vérifie que le service
// réagit correctement à chaque cas.
vi.mock("../../src/utils/prisma.js", () => ({
  prisma: {
    doctor_schedules: { findFirst: vi.fn() },
    appointments: { findFirst: vi.fn() },
  },
}));

const doctorId = "550e8400-e29b-41d4-a716-446655440001";
const start = new Date("2026-08-01T09:00:00.000Z");
const end = new Date("2026-08-01T09:30:00.000Z"); // RDV de 30 minutes

describe("appointments.service (unitaire, Prisma mocké)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateSlotDuration", () => {
    it("retourne true si le médecin n'a aucun planning ce jour-là", async () => {
      // Pas de schedule trouvé => impossible de valider une durée, on autorise par défaut
      // (comportement actuel du service, cf. `if (!schedule || !schedule.slot_duration) return true;`).
      (prisma.doctor_schedules.findFirst as Mock).mockResolvedValueOnce(null);

      const result = await validateSlotDuration(doctorId, start, end);

      expect(result).toBe(true);
    });

    it("retourne true si la durée du RDV est inférieure ou égale au slot_duration du planning", async () => {
      // Planning à créneaux de 30 min, RDV de 30 min pile => valide.
      (prisma.doctor_schedules.findFirst as Mock).mockResolvedValueOnce({ slot_duration: 30 });

      const result = await validateSlotDuration(doctorId, start, end);

      expect(result).toBe(true);
    });

    it("retourne false si la durée du RDV dépasse le slot_duration du planning", async () => {
      // Planning à créneaux de 15 min, RDV de 30 min => trop long, refusé.
      (prisma.doctor_schedules.findFirst as Mock).mockResolvedValueOnce({ slot_duration: 15 });

      const result = await validateSlotDuration(doctorId, start, end);

      expect(result).toBe(false);
    });
  });

  describe("hasConflict", () => {
    it("retourne false si aucun rendez-vous existant ne chevauche le créneau", async () => {
      (prisma.appointments.findFirst as Mock).mockResolvedValueOnce(null);

      const result = await hasConflict(doctorId, start, end);

      expect(result).toBe(false);
    });

    it("retourne true si un rendez-vous existant chevauche le créneau", async () => {
      (prisma.appointments.findFirst as Mock).mockResolvedValueOnce({ id: "existing-id" });

      const result = await hasConflict(doctorId, start, end);

      expect(result).toBe(true);
    });

    it("exclut bien le rendez-vous en cours de modification via excludeAppointmentId", async () => {
      (prisma.appointments.findFirst as Mock).mockResolvedValueOnce(null);
      const excludeId = "self-id-to-exclude";

      await hasConflict(doctorId, start, end, excludeId);

      // On vérifie que le filtre `id: { not: excludeId }` est bien construit dans la requête —
      // sinon ce test ne vaudrait pas plus que le précédent (qui ne checke que le retour).
      expect(prisma.appointments.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: excludeId },
          }),
        }),
      );
    });
  });
});
