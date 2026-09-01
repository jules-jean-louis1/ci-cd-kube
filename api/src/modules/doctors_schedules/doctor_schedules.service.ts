import { doctor_schedules } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";

export const parseTimeToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getSchedulesByDoctorId = async (doctorId: string): Promise<doctor_schedules[]> => {
  return await prisma.doctor_schedules.findMany({
    where: { doctor_id: doctorId },
    orderBy: { day_of_week: "asc" },
  });
};

export const createSchedule = async (data: {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration?: number;
  id?: number;
}) => {
  // On prépare les données au format attendu par Prisma
  const prismaData = {
    doctor_id: data.doctor_id,
    day_of_week: data.day_of_week,
    start_time: parseTimeToDate(data.start_time),
    end_time: parseTimeToDate(data.end_time),
    slot_duration: data.slot_duration,
  };

  // S'il y a un ID, on tente un upsert sur cet ID unique
  if (data.id) {
    return await prisma.doctor_schedules.upsert({
      where: { id: Number(data.id) },
      update: prismaData,
      create: prismaData,
    });
  }

  // Sinon, on fait une création pure et simple !
  return await prisma.doctor_schedules.create({
    data: prismaData,
  });
};

export const deleteSchedule = async (id: number): Promise<doctor_schedules> => {
  return await prisma.doctor_schedules.delete({
    where: { id },
  });
};
