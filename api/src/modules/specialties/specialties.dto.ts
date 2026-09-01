import z from "zod";

export const SpecialtySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255),
});

export type SpecialtyInput = z.infer<typeof SpecialtySchema>;
