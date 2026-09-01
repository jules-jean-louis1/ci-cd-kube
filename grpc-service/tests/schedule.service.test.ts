import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { pool } from "../src/db.js";
import { getDoctorSchedule } from "../src/schedule.service.js";

const testDoctorId = "550e8400-e29b-41d4-a716-446655440098";
const testDoctorEmail = "doctor.schedule.service.unit@test.com";

describe("getDoctorSchedule", () => {
  beforeAll(async () => {
    await pool.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM users WHERE email = $1`, [testDoctorEmail]);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, firstname, lastname, phone, date_of_birth, role)
       VALUES ($1, $2, 'dummy_hash', 'Grpc', 'UnitTest', '0600000098', '1980-01-01', 'medecin')`,
      [testDoctorId, testDoctorEmail],
    );

    await pool.query(
      `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration)
       VALUES ($1, 2, '09:00:00', '12:00:00', 30)`,
      [testDoctorId],
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [testDoctorId]);
    await pool.query(`DELETE FROM users WHERE email = $1`, [testDoctorEmail]);
    await pool.end();
  });

  it("should return the recurring schedule for a doctor", async () => {
    const schedules = await getDoctorSchedule(testDoctorId);

    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({
      day_of_week: 2,
      slot_duration_minutes: 30,
    });
    expect(schedules[0].start_time).toContain("09:00");
    expect(schedules[0].end_time).toContain("12:00");
  });

  it("should return an empty array for a doctor with no schedule", async () => {
    const schedules = await getDoctorSchedule("00000000-0000-0000-0000-000000000000");
    expect(schedules).toEqual([]);
  });
});
