import { pool } from "./db.js";

export const getAvailableSlots = async (doctor_id: string, date: string) => {
  const day = new Date(date).getDay();

  const schedule = await pool.query(
    `SELECT start_time, end_time, slot_duration FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2`,
    [doctor_id, day],
  );

  if (schedule.rows.length === 0) return [];

  const { start_time, end_time, slot_duration } = schedule.rows[0];
  const durationInterval = `${slot_duration} minutes`;

  const startTimeISO = `${date}T${start_time}+02:00`;
  const endTimeISO = `${date}T${end_time}+02:00`;

  const query = `
    SELECT 
        avaible_slots AS start_time,
        (avaible_slots + $2::interval) AS end_time
    FROM generate_series($3::timestamptz, $4::timestamptz, $2::interval) AS avaible_slots
    LEFT JOIN appointments a ON (
        a.doctor_id = $1
        AND a.start_at < (avaible_slots + $2::interval) 
        AND a.end_at > avaible_slots
    )
    WHERE a.id IS NULL
    ORDER BY avaible_slots ASC;
  `;

  const reservedSlots = await pool.query(query, [
    doctor_id,
    durationInterval,
    startTimeISO,
    endTimeISO,
  ]);

  return reservedSlots.rows;
};
