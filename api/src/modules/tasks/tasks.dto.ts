import z from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être renseigné pour la modification",
  });

export const TaskIdParamSchema = z.object({ id: z.string() });

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskIdParam = z.infer<typeof TaskIdParamSchema>;
