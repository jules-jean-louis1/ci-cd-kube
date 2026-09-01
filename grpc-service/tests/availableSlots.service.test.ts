import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { pool } from "../src/db.js";
import { getAvailableSlots } from "../src/availableSlots.service.js";

const testDoctorId = "550e8400-e29b-41d4-a716-446655440097";
const testDoctorEmail = "doctor.availableslots.service.unit@test.com";
const testPatientId = "550e8400-e29b-41d4-a716-446655440096";
const testPatientEmail = "patient.availableslots.service.unit@test.com";

// 2026-08-04 est un mardi (day_of_week = 2 pour Date.getDay(), dimanche = 0) —
// doit correspondre au day_of_week du planning inséré ci-dessous.
const testDate = "2026-08-04";
const bookedSlotStart = new Date(`${testDate}T10:00:00+02:00`);

describe("getAvailableSlots", () => {
  beforeAll(async () => {
    await pool.query(`DELETE FROM appointments WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM users WHERE email = $1 OR email = $2`, [
      testDoctorEmail,
      testPatientEmail,
    ]);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, firstname, lastname, phone, date_of_birth, role)
       VALUES ($1, $2, 'dummy_hash', 'Grpc', 'AvailableSlotsUnitTest', '0600000097', '1980-01-01', 'medecin')`,
      [testDoctorId, testDoctorEmail],
    );
    await pool.query(
      `INSERT INTO users (id, email, password_hash, firstname, lastname, phone, date_of_birth, role)
       VALUES ($1, $2, 'dummy_hash', 'Zoe', 'Patient', '0600000096', '1990-01-01', 'patient')`,
      [testPatientId, testPatientEmail],
    );

    // Planning du mardi (day_of_week = 2) : 9h-12h, créneaux de 30 minutes.
    await pool.query(
      `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration)
       VALUES ($1, 2, '09:00:00', '12:00:00', 30)`,
      [testDoctorId],
    );

    // Un rendez-vous déjà pris sur le créneau de 10h, qui doit disparaître des disponibilités.
    await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, start_at, end_at, status)
       VALUES ($1, $2, $3, $4, 'scheduled')`,
      [
        testDoctorId,
        testPatientId,
        bookedSlotStart,
        new Date(bookedSlotStart.getTime() + 30 * 60 * 1000),
      ],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM appointments WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM users WHERE email = $1 OR email = $2`, [
      testDoctorEmail,
      testPatientEmail,
    ]);
    await pool.end();
  });

  it("exclut le créneau déjà réservé des disponibilités renvoyées", async () => {
    const slots = await getAvailableSlots(testDoctorId, testDate);

    // 9h-12h par pas de 30 min = 7 créneaux bruts (bornes incluses), moins celui de 10h déjà pris.
    expect(slots).toHaveLength(6);
    const bookedStillPresent = slots.some(
      (slot: { start_time: Date }) =>
        new Date(slot.start_time).getTime() === bookedSlotStart.getTime(),
    );
    expect(bookedStillPresent).toBe(false);
  });

  it("retourne un tableau vide si le médecin n'a aucun planning ce jour-là", async () => {
    const slots = await getAvailableSlots("00000000-0000-0000-0000-000000000000", testDate);
    expect(slots).toEqual([]);
  });
});
