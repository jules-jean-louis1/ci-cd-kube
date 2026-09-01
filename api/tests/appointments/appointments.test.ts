import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/index.js";
import { prisma } from "../../src/utils/prisma.js";
import argon2 from "argon2";

app.onError((err, c) => {
  console.error("HONO EXCEPTION DETECTED IN TEST:", err);
  return c.text(`Test Server Error: ${err.message}\nStack: ${err.stack}`, 500);
});

describe("Appointments CRUD Endpoints", () => {
  const patientData1 = {
    firstname: "Alice",
    lastname: "Smith",
    email: "alice.smith@example.com",
    phone: "0601020304",
    date_of_birth: "1990-01-01T10:00:00Z",
    password: "PatientPassword123456!",
  };
  const patientData2 = {
    firstname: "Alice",
    lastname: "Conflict",
    email: "alice.conflict@example.com",
    phone: "0601020304",
    date_of_birth: "1990-01-01T10:00:00Z",
    password: "PatientPassword123456!",
  };

  const doctorData = {
    firstname: "Bob",
    lastname: "Johnson",
    email: "bob.johnson@example.com",
    phone: "0601020305",
    date_of_birth: "1985-05-15T10:00:00Z",
    password: "DoctorPassword123456!",
  };

  const adminData = {
    firstname: "Admin",
    lastname: "User",
    email: "admin.user@example.com",
    phone: "0601020306",
    date_of_birth: "1980-01-01T10:00:00Z",
    password: "AdminPassword123456!",
  };

  const specialtyData = {
    name: "Cardiology",
  };

  const scheduleData = {
    doctor_id: "",
    day_of_week: 1, // Lundi
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
  };

  // 25 Décembre 2023 = UN LUNDI (day_of_week: 1)
  const appointmentData = {
    start_at: "2023-12-25T10:00:00Z",
    end_at: "2023-12-25T10:30:00Z",
  };

  // CORRECTION : On utilise aussi un LUNDI pour que le planning soit trouvé et validé !
  const appointmentWrongHoursData = {
    start_at: "2023-12-25T11:00:00Z",
    end_at: "2023-12-25T13:30:00Z", // 2h30 au lieu de 30min
  };

  const confilctAppointment = {
    start_at: new Date(Date.now() + 3600000).toISOString(),
    end_at: new Date(Date.now() + 7200000).toISOString(),
  };

  let patientId1: string;
  let patientId2: string;
  let doctorId: string;
  let specialtyId: number;
  let appointmentId: string;
  let patientToken1: string;
  let patientToken2: string;
  let doctorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.appointments.deleteMany({});
    await prisma.doctor_schedules.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.specialties.deleteMany({});
    await prisma.doctor_specialties.deleteMany({});
    await prisma.refresh_tokens.deleteMany({});

    // Patient1
    const patient1 = await prisma.users.create({
      data: {
        email: patientData1.email,
        firstname: patientData1.firstname,
        lastname: patientData1.lastname,
        phone: patientData1.phone,
        password_hash: await argon2.hash(patientData1.password),
        date_of_birth: patientData1.date_of_birth,
        role: "patient",
      },
    });
    patientId1 = patient1.id;

    // Patient2
    const patient2 = await prisma.users.create({
      data: {
        email: patientData2.email,
        firstname: patientData2.firstname,
        lastname: patientData2.lastname,
        phone: patientData2.phone,
        password_hash: await argon2.hash(patientData2.password),
        date_of_birth: patientData2.date_of_birth,
        role: "patient",
      },
    });
    patientId2 = patient2.id;

    const doctor = await prisma.users.create({
      data: {
        email: doctorData.email,
        firstname: doctorData.firstname,
        lastname: doctorData.lastname,
        phone: doctorData.phone,
        password_hash: await argon2.hash(doctorData.password),
        date_of_birth: doctorData.date_of_birth,
        role: "medecin",
      },
    });
    doctorId = doctor.id;

    await prisma.users.create({
      data: {
        email: adminData.email,
        firstname: adminData.firstname,
        lastname: adminData.lastname,
        phone: adminData.phone,
        password_hash: await argon2.hash(adminData.password),
        date_of_birth: adminData.date_of_birth,
        role: "admin",
      },
    });

    const specialty = await prisma.specialties.create({
      data: specialtyData,
    });
    specialtyId = specialty.id;

    await prisma.doctor_specialties.create({
      data: {
        doctor_id: doctorId,
        specialty_id: specialtyId,
      },
    });

    await prisma.doctor_schedules.create({
      data: {
        doctor_id: doctorId,
        day_of_week: scheduleData.day_of_week,
        start_time: new Date(`1970-01-01T${scheduleData.start_time}:00Z`),
        end_time: new Date(`1970-01-01T${scheduleData.end_time}:00Z`),
        slot_duration: scheduleData.slot_duration,
      },
    });

    // Connexions
    const adminLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminData.email, password: adminData.password }),
    });
    adminToken = (await adminLogin.json()).token;

    const doctorLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: doctorData.email, password: doctorData.password }),
    });
    doctorToken = (await doctorLogin.json()).token;

    const patientLogin1 = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: patientData1.email, password: patientData1.password }),
    });
    patientToken1 = (await patientLogin1.json()).token;

    const patientLogin2 = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: patientData2.email, password: patientData2.password }),
    });
    patientToken2 = (await patientLogin2.json()).token;
  });

  afterAll(async () => {
    await prisma.appointments.deleteMany({});
    await prisma.doctor_schedules.deleteMany({});
    await prisma.doctor_specialties.deleteMany({});
    await prisma.refresh_tokens.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.specialties.deleteMany({});
  });

  describe("POST /appointments", () => {
    it("should allow a patient to book a slot for themselves", async () => {
      const res = await app.request("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken1}` },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId1,
          start_at: appointmentData.start_at,
          end_at: appointmentData.end_at,
        }),
      });
      expect(res.status).toBe(201);

      const body = await res.json();
      appointmentId = body.id;
    });

    it("should forbid a patient from booking a slot for another patient", async () => {
      const res = await app.request("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken1}` },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId2,
          start_at: appointmentData.start_at,
          end_at: appointmentData.end_at,
        }),
      });
      expect(res.status).toBe(403);
    });

    it("should return 400 Bad Request if the appointment duration exceeds the doctor's slot duration", async () => {
      const res = await app.request("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken1}` },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId1,
          start_at: appointmentWrongHoursData.start_at,
          end_at: appointmentWrongHoursData.end_at,
        }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 409 Conflict if trying to book an already occupied slot", async () => {
      const res = await app.request("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken2}` },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId2,
          start_at: appointmentData.start_at,
          end_at: appointmentData.end_at,
        }),
      });
      expect(res.status).toBe(409);
    });
  });

  describe("PATCH /appointments", () => {
    it("should allow a doctor to modify the status of an appointment (e.g., completed)", async () => {
      const res = await app.request(`/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${doctorToken}` },
        body: JSON.stringify({
          status: "completed",
        }),
      });
      console.log(
        "PATCH /appointments response status:",
        res.body ? res.status : "No response body",
      );
      expect(res.status).toBe(200);
    });

    it("should allow an admin to modify the status and schedule of an appointment", async () => {
      const res = await app.request(`/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          status: "scheduled",
          start_at: confilctAppointment.start_at,
          end_at: confilctAppointment.end_at,
        }),
      });
      expect(res.status).toBe(200);
    });

    it("should forbid a patient from modifying another patient's appointment status or schedule", async () => {
      const res = await app.request(`/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${patientToken2}` },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /appointments/:id", () => {
    it("should allow a patient to cancel their own appointment", async () => {
      const res = await app.request(`/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(200);
    });

    it("should forbid a patient from cancelling another patient's appointment", async () => {
      const newApp = await prisma.appointments.create({
        data: {
          doctor_id: doctorId,
          patient_id: patientId2,
          start_at: new Date("2023-12-30T14:00:00Z"),
          end_at: new Date("2023-12-30T14:30:00Z"),
          status: "scheduled",
        },
      });

      const res = await app.request(`/appointments/${newApp.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /appointments/history", () => {
    it("should allow a patient to see their own history", async () => {
      const res = await app.request(`/appointments/history?patient_id=${patientId1}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    // CORRECTION : Ton contrôleur intercepte la triche des patients en forçant leur propre ID (statut 200).
    // On vérifie donc que l'API renvoie bien un succès, mais qu'elle ne renvoie QUE l'historique du Patient 1 (et pas du Patient 2).
    it("should fallback to current patient history and not expose another patient's history", async () => {
      const res = await app.request(`/appointments/history?patient_id=${patientId2}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();

      // On s'assure qu'aucun élément de la liste n'appartient au patientId2
      const hasForeignData = body.some((apt: any) => apt.patient_id === patientId2);
      expect(hasForeignData).toBe(false);
    });

    it("should allow a doctor or admin to check any history", async () => {
      const res = await app.request(`/appointments/history?patient_id=${patientId1}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("GET /appointments/doctor/:doctorId", () => {
    it("should return appointments for a specific doctor and day (doctor/admin only)", async () => {
      const res = await app.request(`/appointments/doctor/${doctorId}?date=2023-12-25`, {
        method: "GET",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it("should forbid a patient from listing a doctor's appointments", async () => {
      const res = await app.request(`/appointments/doctor/${doctorId}?date=2023-12-25`, {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /appointments", () => {
    it("should allow a patient to get their own list of appointments", async () => {
      const res = await app.request("/appointments", {
        method: "GET",
        headers: { Authorization: `Bearer ${patientToken1}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });
});
