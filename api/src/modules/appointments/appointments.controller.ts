import { Context } from "hono";
import { AppointmentsSchema, UpdateAppointmentSchema } from "./appointments.dto.js";
import * as appointmentsService from "./appointments.service.js";
import { USER_ROLE } from "../../utils/user.js";

// POST /appointments
export const createAppointment = async (c: Context) => {
  const req = await c.req.json();
  const parsed = AppointmentsSchema.safeParse(req);
  const currentUser = c.get("user");

  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  if (currentUser.role === USER_ROLE.PATIENT && currentUser.userId !== parsed.data.patient_id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    const isDurationValid = await appointmentsService.validateSlotDuration(
      parsed.data.doctor_id,
      parsed.data.start_at,
      parsed.data.end_at,
    );
    if (!isDurationValid)
      return c.json({ error: "Appointment duration exceeds doctor's slot duration" }, 400);

    const isConflicting = await appointmentsService.hasConflict(
      parsed.data.doctor_id,
      parsed.data.start_at,
      parsed.data.end_at,
    );
    if (isConflicting) return c.json({ error: "This slot is already occupied" }, 409);

    const appointment = await appointmentsService.createAppointment(parsed.data);
    return c.json(appointment, 201);
  } catch {
    return c.json({ message: "Error creating appointment" }, 500);
  }
};

// PATCH /appointments/:id
export const updateAppointment = async (c: Context) => {
  const req = await c.req.json();
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Missing appointment id in path" }, 400);

  const parsed = UpdateAppointmentSchema.safeParse(req);
  const currentUser = c.get("user");

  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  try {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) return c.json({ error: "Appointment not found" }, 404);

    if (currentUser.role === USER_ROLE.PATIENT && currentUser.userId !== appointment.patient_id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (parsed.data.start_at || parsed.data.end_at) {
      const start = parsed.data.start_at || appointment.start_at;
      const end = parsed.data.end_at || appointment.end_at;
      const isConflicting = await appointmentsService.hasConflict(
        appointment.doctor_id,
        start,
        end,
        id,
      );
      if (isConflicting) return c.json({ error: "This slot is already occupied" }, 409);
    }

    const updated = await appointmentsService.updateAppointment(id, parsed.data);
    return c.json(updated, 200);
  } catch {
    return c.json({ message: "Error updating appointment" }, 500);
  }
};

// DELETE /appointments/:id
export const deleteAppointment = async (c: Context) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");
  if (!id) return c.json({ error: "Missing appointment id in path" }, 400);

  try {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) return c.json({ error: "Appointment not found" }, 404);

    if (currentUser.role === USER_ROLE.PATIENT && currentUser.userId !== appointment.patient_id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await appointmentsService.deleteAppointment(id);
    return c.json({ message: "Appointment cancelled successfully" }, 200);
  } catch {
    return c.json({ message: "Error cancelling appointment" }, 500);
  }
};

// GET /appointments
export const getAppointmentsByPatient = async (c: Context) => {
  const currentUser = c.get("user");
  const patientId =
    currentUser.role === USER_ROLE.PATIENT ? currentUser.userId : c.req.query("patient_id");

  if (!patientId) return c.json({ error: "Missing patient_id query parameter" }, 400);

  try {
    const appointments = await appointmentsService.getAppointmentsByPatient(patientId);
    return c.json(appointments, 200);
  } catch {
    return c.json({ message: "Error fetching appointments" }, 500);
  }
};

// GET /appointments/:id
export const getAppointmentById = async (c: Context) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");
  if (!id) return c.json({ error: "Missing appointment id in path" }, 400);
  try {
    const appointment = await appointmentsService.getAppointmentById(id);
    if (!appointment) return c.json({ error: "Appointment not found" }, 404);

    if (currentUser.role === USER_ROLE.PATIENT && currentUser.userId !== appointment.patient_id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json(appointment, 200);
  } catch {
    return c.json({ message: "Error fetching appointment" }, 500);
  }
};

// GET /appointments/doctor/:doctorId
export const getAppointmentsByDoctor = async (c: Context) => {
  const doctorId = c.req.param("doctorId");
  const date = c.req.query("date"); // Optionnel: ?date=YYYY-MM-DD
  if (!doctorId) return c.json({ error: "Missing doctorId in path" }, 400);
  try {
    const appointments = await appointmentsService.getAppointmentsByDoctor(doctorId, date);
    return c.json(appointments, 200);
  } catch {
    return c.json({ message: "Error fetching doctor appointments" }, 500);
  }
};

// GET /appointments/history
export const getHistory = async (c: Context) => {
  const currentUser = c.get("user");
  const patientId =
    currentUser.role === USER_ROLE.PATIENT ? currentUser.userId : c.req.query("patient_id");

  if (!patientId) return c.json({ error: "Missing patient_id query parameter" }, 400);

  try {
    const history = await appointmentsService.getHistory(patientId);
    return c.json(history, 200);
  } catch {
    return c.json({ message: "Error fetching history" }, 500);
  }
};
