import { Context } from "hono";
import { CreateTaskSchema, UpdateTaskSchema, TaskIdParamSchema } from "./tasks.dto.js";
import * as tasksService from "./tasks.service.js";
import { getUserIdFromContext, USER_ROLE } from "../../utils/user.js";

export const createTask = async (c: Context) => {
  const body = await c.req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const userId = getUserIdFromContext(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    const created = await tasksService.createTask(userId, parsed.data);
    return c.json(created, 201);
  } catch (error) {
    console.error("Create task error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const getTasks = async (c: Context) => {
  const user = c.get("user") as unknown as { userId?: string; role?: string } | undefined;
  try {
    if (user && user.role === USER_ROLE.ADMIN) {
      const all = await tasksService.getAllTasks();
      return c.json(all);
    }

    const userId = getUserIdFromContext(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const tasks = await tasksService.getTasksByUser(userId);
    return c.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const getTask = async (c: Context) => {
  const parsed = TaskIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const task = await tasksService.findTaskById(parsed.data.id);
  if (!task) return c.json({ error: "Task not found" }, 404);

  const userId = getUserIdFromContext(c);
  const user = c.get("user") as unknown as { userId?: string; role?: string } | undefined;
  if ((user?.role ?? "") !== USER_ROLE.ADMIN && String(task.userId) !== String(userId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(task);
};

export const updateTask = async (c: Context) => {
  const parsedId = TaskIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsedId.success) return c.json({ error: parsedId.error.format() }, 400);

  const body = await c.req.json();
  const parsedBody = UpdateTaskSchema.safeParse(body);
  if (!parsedBody.success) return c.json({ error: parsedBody.error.format() }, 400);

  const task = await tasksService.findTaskById(parsedId.data.id);
  if (!task) return c.json({ error: "Task not found" }, 404);

  const userId = getUserIdFromContext(c);
  const user = c.get("user") as unknown as { userId?: string; role?: string } | undefined;
  if ((user?.role ?? "") !== USER_ROLE.ADMIN && String(task.userId) !== String(userId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    const updated = await tasksService.updateTask(parsedId.data.id, parsedBody.data);
    return c.json(updated);
  } catch (error) {
    console.error("Update task error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const deleteTask = async (c: Context) => {
  const parsedId = TaskIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsedId.success) return c.json({ error: parsedId.error.format() }, 400);

  const task = await tasksService.findTaskById(parsedId.data.id);
  if (!task) return c.json({ error: "Task not found" }, 404);

  const userId = getUserIdFromContext(c);
  const user = c.get("user") as unknown as { userId?: string; role?: string } | undefined;
  if ((user?.role ?? "") !== USER_ROLE.ADMIN && String(task.userId) !== String(userId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    await tasksService.deleteTask(parsedId.data.id);
    return c.json({ success: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
