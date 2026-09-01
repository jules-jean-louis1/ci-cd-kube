import { users } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import { USER_ROLE } from "../../utils/user.js";
import { DoctorInput, UpdateDoctorInput } from "./doctors.dto.js";
import * as argon2 from "argon2";

export const getDoctors = async () => {
  const [doctors, counts] = await prisma.$transaction([
    prisma.users.findMany({
      where: { role: USER_ROLE.DOCTOR as any },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        created_at: true,
      },
    }),
    prisma.users.count({ where: { role: USER_ROLE.DOCTOR as any } }),
  ]);
  return [doctors, counts];
};

export const getDoctorById = async (doctorId: string, secure: boolean) => {
  return await prisma.users.findFirst({
    where: { role: USER_ROLE.DOCTOR as any, id: doctorId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      date_of_birth: !secure,
      created_at: true,
      doctor_specialties: true,
      doctor_schedules: true,
    },
  });
};

export const getDoctorBySpecialty = async (specialtyId: number): Promise<any[] | null> => {
  return await prisma.users.findMany({
    where: {
      role: USER_ROLE.DOCTOR as any,
      doctor_specialties: {
        some: {
          specialty_id: specialtyId,
        },
      },
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      created_at: true,
      doctor_specialties: true,
      doctor_schedules: true,
    },
  });
};

export const createDoctor = async (data: DoctorInput): Promise<users> => {
  const hashed = await argon2.hash(data.password);
  return await prisma.users.create({
    data: {
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      date_of_birth: new Date(data.date_of_birth),
      phone: data.phone,
      password_hash: hashed,
      role: USER_ROLE.DOCTOR as any,
    },
  });
};

export const updateDoctor = async (doctorId: string, data: UpdateDoctorInput): Promise<users> => {
  const hashed = data.password ? await argon2.hash(data.password) : undefined;
  return await prisma.users.update({
    where: { id: doctorId },
    data: {
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      phone: data.phone,
      password_hash: hashed,
    },
  });
};

export const deleteDoctor = async (doctorId: string): Promise<users> => {
  return await prisma.users.delete({
    where: { id: doctorId },
  });
};
