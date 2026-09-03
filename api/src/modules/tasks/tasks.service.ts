import { prisma } from "../../utils/prisma.js";
import { CreateTaskInput, UpdateTaskInput } from "./tasks.dto.js";

export const createTask = async (userId: string, data: CreateTaskInput) => {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      completed: false,
      userId: Number(userId),
    },
  });
};

export const getTasksByUser = async (userId: string) => {
  return prisma.task.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllTasks = async () => {
  return prisma.task.findMany({ orderBy: { createdAt: "desc" } });
};

export const findTaskById = async (id: string) => {
  return prisma.task.findUnique({ where: { id: Number(id) } });
};

export const updateTask = async (id: string, data: UpdateTaskInput) => {
  return prisma.task.update({ where: { id: Number(id) }, data });
};

export const deleteTask = async (id: string) => {
  return prisma.task.delete({ where: { id: Number(id) } });
};
