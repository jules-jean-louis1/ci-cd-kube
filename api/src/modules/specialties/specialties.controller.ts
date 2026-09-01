import { Context } from "hono";
import { SpecialtySchema } from "./specialties.dto.js";
import * as specialtyService from "./specialties.service.js";
import { Prisma } from "@prisma/client";

export const getSpecialties = async (c: Context) => {
  try {
    const specialties = await specialtyService.getSpecialties();
    return c.json({ specialties: specialties }, 200);
  } catch {
    return c.json({ error: "Retrieving data failed" }, 500);
  }
};

export const getSpecialtyById = async (c: Context) => {
  const specialtyId = parseInt(c.req.param("id")!);
  try {
    const specialty = await specialtyService.getSpecialtyById(specialtyId);
    if (!specialty) {
      return c.json({ error: "Specialty not found" }, 404);
    }
    return c.json({ specialty: specialty }, 200);
  } catch {
    return c.json({ error: "Retrieving data failed" }, 500);
  }
};

export const createSpecialty = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = SpecialtySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const specialty = await specialtyService.createSpecialty(parsed.data.name);
    return c.json({ specialty: specialty }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json({ error: "A specialty with this name already exists" }, 409);
    }
    return c.json({ error: "Creating specialty failed" }, 500);
  }
};

export const updateSpecialty = async (c: Context) => {
  const specialtyId = parseInt(c.req.param("id")!);

  if (isNaN(specialtyId)) {
    return c.json({ error: "Invalid specialty ID" }, 400);
  }

  try {
    const body = await c.req.json();
    const parsed = SpecialtySchema.partial().safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    if (parsed.data.name === undefined) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const specialty = await specialtyService.updateSpecialty(specialtyId, parsed.data.name);

    return c.json({ specialty: specialty }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return c.json({ error: "Specialty not found" }, 404);
      }
      if (error.code === "P2002") {
        return c.json({ error: "A specialty with this name already exists" }, 409);
      }
    }
    return c.json({ error: "Updating specialty failed" }, 500);
  }
};

export const deleteSpecialty = async (c: Context) => {
  const specialtyId = parseInt(c.req.param("id")!);
  if (isNaN(specialtyId)) {
    return c.json({ error: "Invalid specialty ID" }, 400);
  }
  try {
    const specialty = await specialtyService.deleteSpecialty(specialtyId);
    return c.json({ specialty: specialty }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Specialty not found" }, 404);
    }
    return c.json({ error: "Deleting specialty failed" }, 500);
  }
};
