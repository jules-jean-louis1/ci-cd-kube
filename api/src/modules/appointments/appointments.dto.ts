import z from "zod";

export const AppointmentsSchema = z
  .object({
    doctor_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    start_at: z.coerce.date(),
    end_at: z.coerce.date(),
  })
  .refine((data) => data.end_at > data.start_at, {
    message: "La date de fin doit être supérieure à la date de début",
    path: ["end_at"],
  });

export const UpdateAppointmentSchema = z
  .object({
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return data.end_at > data.start_at;
      }
      return true;
    },
    {
      message: "La date de fin doit être supérieure à la date de début",
      path: ["end_at"],
    },
  );

export type AppointmentsInput = z.infer<typeof AppointmentsSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
