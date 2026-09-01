import { Context } from "hono";
import { Prisma, users } from "@prisma/client";
import {
  PatientIdParamSchema,
  SearchPatientsQuerySchema,
  UpdatePatientSchema,
} from "./patients.dto.js";
import * as patientsService from "./patients.service.js";

/**
 * Retire le hash du mot de passe avant de renvoyer un patient au client —
 * il ne doit jamais transiter dans une réponse HTTP.
 */
const toPatientResponse = (patient: users) => {
  const { password_hash: _password_hash, ...safePatient } = patient;
  return safePatient;
};

export const searchPatients = async (c: Context) => {
  const parsedQuery = SearchPatientsQuerySchema.safeParse({
    name: c.req.query("name"),
    email: c.req.query("email"),
  });
  if (!parsedQuery.success) {
    return c.json({ error: parsedQuery.error.format() }, 400);
  }

  const patients = await patientsService.searchPatients(parsedQuery.data);
  return c.json(patients.map(toPatientResponse));
};

export const getPatient = async (c: Context) => {
  const parsedId = PatientIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsedId.success) {
    return c.json({ error: parsedId.error.format() }, 400);
  }

  const patient = await patientsService.findPatientById(parsedId.data.id);
  if (!patient) {
    return c.json({ error: "Patient not found" }, 404);
  }

  return c.json(toPatientResponse(patient));
};

export const updatePatient = async (c: Context) => {
  const parsedId = PatientIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsedId.success) {
    return c.json({ error: parsedId.error.format() }, 400);
  }

  const body = await c.req.json();
  const parsedBody = UpdatePatientSchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json({ error: parsedBody.error.format() }, 400);
  }

  try {
    const updated = await patientsService.updatePatient(parsedId.data.id, parsedBody.data);
    if (!updated) {
      return c.json({ error: "Patient not found" }, 404);
    }

    return c.json(toPatientResponse(updated));
  } catch (error) {
    // Conflit d'unicité si l'email modifié appartient déjà à un autre compte
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json({ error: "Email already in use" }, 409);
    }
    console.error("Update patient error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const deletePatient = async (c: Context) => {
  const parsedId = PatientIdParamSchema.safeParse({ id: c.req.param("id") });
  if (!parsedId.success) {
    return c.json({ error: parsedId.error.format() }, 400);
  }

  try {
    const deleted = await patientsService.deletePatient(parsedId.data.id);
    if (!deleted) {
      return c.json({ error: "Patient not found" }, 404);
    }

    return c.json({ success: "Patient deleted" });
  } catch (error) {
    // Le patient a des rendez-vous liés (onDelete: NoAction sur appointments.patient_id)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return c.json({ error: "Cannot delete patient with existing appointments" }, 409);
    }
    console.error("Delete patient error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
