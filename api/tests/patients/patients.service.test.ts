import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { searchPatients } from "../../src/modules/patients/patients.service.js";
import { prisma } from "../../src/utils/prisma.js";

// Tests unitaires : Prisma mocké. C'est la seule vraie logique de ce service —
// le reste (findPatientById, updatePatient, deletePatient) est du CRUD Prisma
// direct sans branchement, déjà couvert par les tests d'intégration.
vi.mock("../../src/utils/prisma.js", () => ({
  prisma: {
    users: { findMany: vi.fn() },
  },
}));

describe("searchPatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne filtre que sur le rôle patient si aucun critère n'est fourni", async () => {
    (prisma.users.findMany as Mock).mockResolvedValueOnce([]);

    await searchPatients({});

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "patient", AND: [] },
      }),
    );
  });

  it("filtre par nom (prénom OU nom de famille), insensible à la casse", async () => {
    (prisma.users.findMany as Mock).mockResolvedValueOnce([]);

    await searchPatients({ name: "zoe" });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: "patient",
          AND: [
            {
              OR: [
                { firstname: { contains: "zoe", mode: "insensitive" } },
                { lastname: { contains: "zoe", mode: "insensitive" } },
              ],
            },
          ],
        },
      }),
    );
  });

  it("filtre par email, insensible à la casse", async () => {
    (prisma.users.findMany as Mock).mockResolvedValueOnce([]);

    await searchPatients({ email: "zoe@test.com" });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: "patient",
          AND: [{ email: { contains: "zoe@test.com", mode: "insensitive" } }],
        },
      }),
    );
  });

  it("combine nom et email en ET quand les deux sont fournis", async () => {
    (prisma.users.findMany as Mock).mockResolvedValueOnce([]);

    await searchPatients({ name: "zoe", email: "zoe@test.com" });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: "patient",
          AND: [
            {
              OR: [
                { firstname: { contains: "zoe", mode: "insensitive" } },
                { lastname: { contains: "zoe", mode: "insensitive" } },
              ],
            },
            { email: { contains: "zoe@test.com", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("plafonne toujours à 50 résultats et trie par nom de famille", async () => {
    (prisma.users.findMany as Mock).mockResolvedValueOnce([]);

    await searchPatients({ name: "zoe" });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50, orderBy: { lastname: "asc" } }),
    );
  });

  it("retourne directement le résultat renvoyé par Prisma", async () => {
    const fakeUsers = [{ id: "1", firstname: "Zoe" }];
    (prisma.users.findMany as Mock).mockResolvedValueOnce(fakeUsers);

    const result = await searchPatients({ name: "zoe" });

    expect(result).toBe(fakeUsers);
  });
});
