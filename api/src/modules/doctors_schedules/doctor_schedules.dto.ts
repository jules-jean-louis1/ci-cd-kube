import z from "zod";

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export const DoctorScheduleSchema = z
  .object({
    doctor_id: z.string().uuid("Invalid doctor ID (must be a valid UUID)"),
    day_of_week: z
      .number()
      .min(0, "Day must be between 0 (Sunday) and 6 (Saturday)")
      .max(6, "Day must be between 0 (Sunday) and 6 (Saturday)"),
    start_time: z.string().regex(timeRegex, "Start time must be in HH:MM or HH:MM:SS format"),
    end_time: z.string().regex(timeRegex, "End time must be in HH:MM or HH:MM:SS format"),
    slot_duration: z
      .number()
      .min(5, "Slot duration must be at least 5 minutes")
      .optional()
      .default(30),
  })
  .refine(
    (data) => {
      return data.start_time < data.end_time;
    },
    {
      message: "Start time must be before end time",
      path: ["start_time"],
    },
  );

export type DoctorScheduleInput = z.infer<typeof DoctorScheduleSchema>;
