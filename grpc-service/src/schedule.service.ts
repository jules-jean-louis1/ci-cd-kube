import { pool } from "./db.js";

export interface ScheduleEntry {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

/**
 * Récupère le planning récurrent hebdomadaire d'un médecin.
 * Lecture directe en base (table `doctor_schedules`, propriété du module
 * `doctors_schedules` côté API REST) — ce service gRPC ne fait que
 * l'exposer aux autres services internes (ex. futur module Rendez-vous).
 */
export const getDoctorSchedule = async (doctorId: string): Promise<ScheduleEntry[]> => {
  const result = await pool.query(
    `SELECT id, day_of_week, start_time, end_time, slot_duration
     FROM doctor_schedules
     WHERE doctor_id = $1
     ORDER BY day_of_week ASC`,
    [doctorId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    slot_duration_minutes: row.slot_duration ?? 30,
  }));
};
