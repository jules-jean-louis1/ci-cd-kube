import z from "zod";

export const DoctorSchema = z.object({
  email: z.string().email(),
  firstname: z.string().min(2).max(100),
  lastname: z.string().min(2).max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(10).max(15),
  password: z.string().min(12),
});

export type DoctorInput = z.infer<typeof DoctorSchema>;
export type UpdateDoctorInput = z.infer<ReturnType<typeof DoctorSchema.partial>>;
