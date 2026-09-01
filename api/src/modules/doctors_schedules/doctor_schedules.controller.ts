import { Context } from "hono";
import { DoctorScheduleSchema } from "./doctor_schedules.dto.js";
import * as scheduleService from "./doctor_schedules.service.js";
import { Prisma } from "@prisma/client";
import { grpcScheduleClient } from "../../clients/schedule.client.js";

export const getSchedulesByDoctor = async (c: Context) => {
  const doctorId = c.req.param("doctorId");
  if (!doctorId) return c.json({ error: "Doctor not found" }, 404);
  try {
    const schedules = await scheduleService.getSchedulesByDoctorId(doctorId);
    return c.json({ schedules }, 200);
  } catch {
    return c.json({ error: "Failed to retrieve doctor schedules" }, 500);
  }
};

export const createSchedule = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = DoctorScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const schedule = await scheduleService.createSchedule(parsed.data);
    return c.json({ schedule }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return c.json({ error: "Doctor not found (Foreign key constraint failed)" }, 400);
    }
    return c.json({ error: "Failed to create doctor schedule" }, 500);
  }
};

export const updateSchedule = async (c: Context) => {
  const id = parseInt(c.req.param("id")!);
  if (isNaN(id)) {
    return c.json({ error: "Invalid schedule ID" }, 400);
  }
  try {
    const body = await c.req.json();
    const parsed = DoctorScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const schedule = await scheduleService.createSchedule({ ...parsed.data, id });
    return c.json({ schedule }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Schedule not found" }, 404);
    }
    console.error("Error updating schedule:", error);
    return c.json({ error: "Failed to update doctor schedule" }, 500);
  }
};

export const deleteSchedule = async (c: Context) => {
  const id = parseInt(c.req.param("id")!);

  if (isNaN(id)) {
    return c.json({ error: "Invalid schedule ID" }, 400);
  }

  try {
    const schedule = await scheduleService.deleteSchedule(id);
    return c.json({ message: "Schedule deleted successfully", schedule }, 200);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Schedule not found" }, 404);
    }
    return c.json({ error: "Failed to delete schedule" }, 500);
  }
};

export const getSlotsByDoctorId = async (c: Context) => {
  const doctorId = c.req.param("doctorId");
  const date = c.req.query("date");

  if (!doctorId || !date) {
    return c.json({ error: "doctorId and date query parameters are required" }, 400);
  }

  try {
    const response = await new Promise((resolve, reject) => {
      grpcScheduleClient.getDoctorSchedule({ doctorId, date }, (err: any, res: any) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    // On renvoie la réponse JSON une fois la Promise résolue
    return c.json(response, 200);
  } catch (error) {
    console.error("Error fetching doctor schedule:", error);
    return c.json({ error: "Failed to retrieve doctor schedule" }, 500);
  }
};

export const getAvailableSlots = async (c: Context) => {
  const doctorId = c.req.param("doctorId");
  const date = c.req.query("date");

  if (!date) {
    return c.json({ error: "Query parameter 'date' is required" }, 400);
  }

  try {
    const gRPCResponse = await new Promise((resolve, reject) => {
      grpcScheduleClient.getDoctorAvailableSlots({ doctorId, date }, (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      });
    });

    return c.json(gRPCResponse, 200);
  } catch (error: any) {
    console.error("gRPC Client Error:", error);
    return c.json(
      {
        error: "Failed to fetch available slots from internal service",
        details: error.details || error.message,
      },
      500,
    );
  }
};
