import { Context } from "hono";
import * as doctorService from "./doctors.service.js";
import { DoctorSchema } from "./doctors.dto.js";
import { canDeleteDoctor, canUpdateDoctor, USER_ROLE } from "../../utils/user.js";
import { Prisma, users } from "@prisma/client";

/**
 * Retire le hash du mot de passe avant de renvoyer un médecin au client —
 * il ne doit jamais transiter dans une réponse HTTP.
 */
const toDoctorResponse = (doctor: users) => {
  const { password_hash: _password_hash, ...safeDoctor } = doctor;
  return safeDoctor;
};

export const getDoctors = async (c: Context) => {
  try {
    const [doctors, count] = await doctorService.getDoctors();
    return c.json({ doctors: doctors, count: count });
  } catch {
    return c.json({ error: "Retriving data failed" }, 500);
  }
};

export const getDoctorById = async (c: Context) => {
  const doctorId = c.req.param("id");
  const user = c.get("user");
  const secure = user?.role !== USER_ROLE.DOCTOR && user?.userId !== doctorId;

  try {
    const doctor = await doctorService.getDoctorById(doctorId!, secure);
    if (!doctor) {
      return c.json({ error: "Doctor not found" }, 404);
    }
    return c.json({ doctor: doctor }, 200);
  } catch {
    return c.json({ error: "Retriving data failed" }, 500);
  }
};

export const createDoctor = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = DoctorSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const doctor = await doctorService.createDoctor(parsed.data);
    return c.json({ doctor: toDoctorResponse(doctor) }, 201);
  } catch {
    return c.json({ error: "Creating doctor failed" }, 500);
  }
};

export const updateDoctor = async (c: Context) => {
  const doctorId = c.req.param("id");
  const canUpdate = canUpdateDoctor(c.get("user")?.role, doctorId!, c.get("user")?.userId);
  if (!canUpdate) {
    return c.json({ error: "You are not authorized to update this doctor" }, 403);
  }
  try {
    const body = await c.req.json();
    const parsed = DoctorSchema.partial().safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const doctor = await doctorService.updateDoctor(doctorId!, parsed.data);
    if (!doctor) {
      return c.json({ error: "Doctor not found" }, 404);
    }
    return c.json({ doctor: toDoctorResponse(doctor) }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Doctor not found" }, 404);
    }
    return c.json({ error: "Updating doctor failed" }, 500);
  }
};

export const deleteDoctor = async (c: Context) => {
  const doctorId = c.req.param("id");
  const canDelete = canDeleteDoctor(c.get("user")?.role, doctorId!, c.get("user")?.userId);
  if (!canDelete) {
    return c.json({ error: "You are not authorized to delete this doctor" }, 403);
  }
  try {
    const deletedDoctor = await doctorService.deleteDoctor(doctorId!);
    if (!deletedDoctor) {
      return c.json({ error: "Doctor not found" }, 404);
    }
    return c.json({ message: "Doctor deleted successfully" }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Doctor not found" }, 404);
    }
    return c.json({ error: "Deleting doctor failed" }, 500);
  }
};
