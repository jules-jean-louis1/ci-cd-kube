import { specialties } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";

export const getSpecialties = async (): Promise<specialties[] | null> => {
  return await prisma.specialties.findMany();
};

export const getSpecialtyById = async (id: number): Promise<specialties | null> => {
  return await prisma.specialties.findUnique({
    where: {
      id: id,
    },
  });
};

export const createSpecialty = async (name: string): Promise<specialties> => {
  return await prisma.specialties.create({
    data: {
      name: name,
    },
  });
};

export const updateSpecialty = async (id: number, name: string): Promise<specialties> => {
  return await prisma.specialties.update({
    where: {
      id: id,
    },
    data: {
      name: name,
    },
  });
};

export const deleteSpecialty = async (id: number): Promise<specialties> => {
  return await prisma.specialties.delete({
    where: {
      id: id,
    },
  });
};
