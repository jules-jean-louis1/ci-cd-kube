import { appointments } from "@prisma/client";
import { AppointmentsInput, UpdateAppointmentInput } from "./appointments.dto.js";
import { prisma } from "../../utils/prisma.js";

// 1. Validation de la durée
export const validateSlotDuration = async (
  doctor_id: string,
  start: Date,
  end: Date,
): Promise<boolean> => {
  const dayOfWeek = start.getUTCDay();
  const schedule = await prisma.doctor_schedules.findFirst({
    where: { doctor_id, day_of_week: dayOfWeek },
  });

  if (!schedule || !schedule.slot_duration) return true;

  const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return durationInMinutes <= schedule.slot_duration;
};

export const hasConflict = async (
  doctor_id: string,
  start: Date,
  end: Date,
  excludeAppointmentId?: string,
): Promise<boolean> => {
  const conflict = await prisma.appointments.findFirst({
    where: {
      doctor_id,
      status: "scheduled",
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      OR: [{ start_at: { lt: end }, end_at: { gt: start } }],
    },
  });
  return !!conflict;
};

export const createAppointment = async (data: AppointmentsInput): Promise<appointments> => {
  return prisma.appointments.create({
    data: {
      doctor_id: data.doctor_id,
      patient_id: data.patient_id,
      start_at: data.start_at,
      end_at: data.end_at,
      status: "scheduled",
    },
  });
};

export const getAppointmentById = async (id: string) => {
  return prisma.appointments.findUnique({ where: { id } });
};

// GET /appointments
export const getAppointmentsByPatient = async (patient_id: string) => {
  return prisma.appointments.findMany({
    where: { patient_id },
    orderBy: { start_at: "asc" },
  });
};

// GET /appointments/doctor/:doctorId
export const getAppointmentsByDoctor = async (doctor_id: string, dateStr?: string) => {
  if (!dateStr) {
    return prisma.appointments.findMany({
      where: { doctor_id, status: "scheduled" },
      orderBy: { start_at: "asc" },
    });
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  return prisma.appointments.findMany({
    where: {
      doctor_id,
      status: "scheduled",
      start_at: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { start_at: "asc" },
  });
};

// PATCH /appointments/:id
export const updateAppointment = async (
  id: string,
  data: UpdateAppointmentInput,
): Promise<appointments> => {
  return prisma.appointments.update({
    where: { id },
    data: data,
  });
};

// DELETE /appointments/:id
export const deleteAppointment = async (id: string): Promise<appointments> => {
  return prisma.appointments.update({
    where: { id },
    data: { status: "cancelled" },
  });
};

// GET /appointments/history
export const getHistory = async (patient_id: string) => {
  return prisma.appointments.findMany({
    where: { patient_id },
    orderBy: { start_at: "desc" },
  });
};
