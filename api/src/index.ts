import { Hono } from "hono";
import { serve } from "@hono/node-server";
import * as AuthController from "./modules/auth/auth.controller.js";
import * as DoctorController from "./modules/doctors/doctors.controller.js";
import * as PatientsController from "./modules/patients/patients.controller.js";
import * as SpecialtyController from "./modules/specialties/specialties.controller.js";
import * as DoctorScheduleController from "./modules/doctors_schedules/doctor_schedules.controller.js";
import * as AppointmentController from "./modules/appointments/appointments.controller.js";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { USER_ROLE } from "./utils/user.js";
import { auth } from "./middleware/auth.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";
import { createMiddleware } from "hono/factory";
import { swaggerUI } from "@hono/swagger-ui";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const app = new Hono();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerYaml = readFileSync(path.resolve(__dirname, "../swagger.yaml"), "utf-8");
app.use(logger());
// Headers de sécurité HTTP (OWASP A05). X-Content-Type-Options, X-Frame-Options et
// Strict-Transport-Security sont déjà activés par défaut par ce middleware.
// La CSP autorise cdn.jsdelivr.net, utilisé par la Swagger UI (/docs) pour ses assets.
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' nécessaire : la Swagger UI (@hono/swagger-ui) injecte son
      // script d'initialisation en inline, pas de nonce/hash disponible côté lib.
      // Accepté car /docs ne sert que de la documentation publique, aucune donnée sensible.
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
    },
  }),
);
app.get("/", (c) => c.text("OK"));

// Documentation API (Swagger/OpenAPI) — publique, pas d'authentification requise.
app.get("/swagger.yaml", (c) => c.text(swaggerYaml, 200, { "Content-Type": "application/yaml" }));
app.get("/docs", swaggerUI({ url: "/swagger.yaml" }));

// Auth
// Rate limiting (OWASP A04) : fenêtre glissante de 5 requêtes / 15 min par IP sur
// les endpoints sensibles, pour limiter le brute force sur les mots de passe et la
// création massive de comptes. Désactivé en environnement de test : la suite
// d'intégration enchaîne de nombreux register/login depuis la même origine, et le
// middleware est couvert par son propre fichier de test dédié.
const authRateLimit =
  process.env.NODE_ENV === "test"
    ? createMiddleware(async (_c, next) => next())
    : rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 });

app.post("/auth/register", authRateLimit, async (c) => {
  return AuthController.register(c);
});

app.post("/auth/login", authRateLimit, async (c) => {
  return AuthController.login(c);
});

app.get("/auth/logout", async (c) => {
  return AuthController.logout(c);
});

app.get("/auth/refresh", async (c) => {
  return AuthController.refreshToken(c);
});

// Protect routes

// Patient
// Réservé aux comptes admin et medecin — un patient ne peut pas gérer
// d'autres comptes patients via ces routes.

app.get("/patients", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return PatientsController.searchPatients(c);
});

app.get("/patients/:id", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return PatientsController.getPatient(c);
});

app.patch("/patients/:id", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return PatientsController.updatePatient(c);
});

app.delete("/patients/:id", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return PatientsController.deletePatient(c);
});

// Doctor
// Réservé aux comptes admin et medecin — un medecin ne peut pas gérer
// d'autres comptes medecins via ces routes.

app.post("/doctor", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return DoctorController.createDoctor(c);
});

app.get("/doctors", auth(), async (c) => {
  return DoctorController.getDoctors(c);
});

app.get("/doctor/:id", auth(), async (c) => {
  return DoctorController.getDoctorById(c);
});

app.put("/doctor/:id", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return DoctorController.updateDoctor(c);
});

app.delete("/doctor/:id", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), async (c) => {
  return DoctorController.deleteDoctor(c);
});

app.get("/doctor/:doctorId/available-slots", auth(), async (c) => {
  return DoctorScheduleController.getAvailableSlots(c);
});

app.get("/doctors/slots/:doctorId", auth(), async (c) => {
  return DoctorScheduleController.getSlotsByDoctorId(c);
});

// Specialties
app.get("/specialties", auth(), async (c) => {
  return SpecialtyController.getSpecialties(c);
});

app.get("/specialty/:id", auth(), async (c) => {
  return SpecialtyController.getSpecialtyById(c);
});

app.post("/specialty", auth([USER_ROLE.ADMIN]), async (c) => {
  return SpecialtyController.createSpecialty(c);
});

app.put("/specialty/:id", auth([USER_ROLE.ADMIN]), async (c) => {
  return SpecialtyController.updateSpecialty(c);
});

app.delete("/specialty/:id", auth([USER_ROLE.ADMIN]), async (c) => {
  return SpecialtyController.deleteSpecialty(c);
});

// Doctor Schedules
app.get("/doctor/:doctorId/schedules", auth(), async (c) => {
  return DoctorScheduleController.getSchedulesByDoctor(c);
});

app.post("/doctor-schedules", auth([USER_ROLE.ADMIN, USER_ROLE.DOCTOR]), async (c) => {
  return DoctorScheduleController.createSchedule(c);
});

app.put("/doctor-schedules/:id", auth([USER_ROLE.ADMIN, USER_ROLE.DOCTOR]), async (c) => {
  return DoctorScheduleController.updateSchedule(c);
});

app.delete("/doctor-schedules/:id", auth([USER_ROLE.ADMIN, USER_ROLE.DOCTOR]), async (c) => {
  return DoctorScheduleController.deleteSchedule(c);
});

// Appointments
app.get("/appointments/history", auth(), (c) => AppointmentController.getHistory(c));
app.get("/appointments/doctor/:doctorId", auth([USER_ROLE.DOCTOR, USER_ROLE.ADMIN]), (c) =>
  AppointmentController.getAppointmentsByDoctor(c),
);

app.post("/appointments", auth(), (c) => AppointmentController.createAppointment(c));
app.patch("/appointments/:id", auth(), (c) => AppointmentController.updateAppointment(c));
app.get("/appointments", auth(), (c) => AppointmentController.getAppointmentsByPatient(c));
app.get("/appointments/:id", auth(), (c) => AppointmentController.getAppointmentById(c));
app.delete("/appointments/:id", auth(), (c) => AppointmentController.deleteAppointment(c));

export default app;

if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port: 3000 });
}
