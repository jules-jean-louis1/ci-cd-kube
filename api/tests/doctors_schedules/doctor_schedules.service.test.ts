import { describe, it, expect } from "vitest";
import { parseTimeToDate } from "../../src/modules/doctors_schedules/doctor_schedules.service.js";

// Test unitaire pur : parseTimeToDate ne touche à aucune base de données,
// donc aucun mock n'est nécessaire ici — juste des assertions directes
// sur l'objet Date retourné.
describe("parseTimeToDate", () => {
  it("convertit une heure du matin correctement", () => {
    const result = parseTimeToDate("09:00");

    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("convertit une heure avec des minutes non nulles", () => {
    const result = parseTimeToDate("14:37");

    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(37);
  });

  it("convertit une heure de fin de journée (23:59)", () => {
    const result = parseTimeToDate("23:59");

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it("garde la date du jour (jour/mois/année) inchangée", () => {
    // La fonction utilise `new Date()` en interne pour la partie date —
    // seule l'heure est reconstruite depuis la string, le jour ne doit pas bouger.
    const now = new Date();
    const result = parseTimeToDate("10:00");

    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getDate()).toBe(now.getDate());
  });
});
