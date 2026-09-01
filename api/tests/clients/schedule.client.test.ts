import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../../src/utils/prisma.js";
import { sign } from "hono/jwt";
import { Hono } from "hono";
import net from "net";

// Fonction utilitaire pour utiliser un port libre automatiquement
const getFreePort = (): Promise<number> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testDoctorId = "550e8400-e29b-41d4-a716-446655440099";
const testDoctorEmail = "doctor.grpc.contract@test.com";
const testDate = "2026-08-01";

let grpcProcess: ChildProcessWithoutNullStreams;
let doctorToken: string;
let GRPC_TEST_PORT: string;
let DoctorScheduleController: any;

const testApp = new Hono();
const mockAuth = () => async (c: any, next: any) => {
  c.set("jwtPayload", { id: testDoctorId, role: "medecin" });
  await next();
};

testApp.get("/doctors/slots/:doctorId", mockAuth(), async (c) => {
  return DoctorScheduleController.getSlotsByDoctorId(c);
});

testApp.get("/doctor/:doctorId/available-slots", mockAuth(), async (c) => {
  return DoctorScheduleController.getAvailableSlots(c);
});

describe("Contract test — client REST vs ScheduleService (gRPC)", () => {
  beforeAll(async () => {
    const port = await getFreePort();
    GRPC_TEST_PORT = port.toString();
    process.env.GRPC_SERVER_HOST = `127.0.0.1:${GRPC_TEST_PORT}`;

    DoctorScheduleController =
      await import("../../src/modules/doctors_schedules/doctor_schedules.controller.js");

    await prisma.doctor_schedules.deleteMany({ where: { doctor_id: testDoctorId } });
    await prisma.users.deleteMany({ where: { email: testDoctorEmail } });

    await prisma.users.create({
      data: {
        id: testDoctorId,
        email: testDoctorEmail,
        password_hash: "dummy_hash",
        firstname: "Grpc",
        lastname: "ContractTest",
        phone: "0600000099",
        date_of_birth: new Date("1980-01-01"),
        role: "medecin",
      },
    });

    await prisma.doctor_schedules.create({
      data: {
        doctor_id: testDoctorId,
        day_of_week: 6,
        start_time: new Date("1970-01-01T09:00:00z"),
        end_time: new Date("1970-01-01T12:00:00z"),
        slot_duration: 30,
      },
    });

    const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
    doctorToken = await sign({ id: testDoctorId, role: "medecin" }, jwtSecret);

    grpcProcess = spawn("npx", ["tsx", "src/server.ts"], {
      cwd: path.resolve(__dirname, "../../../grpc-service"),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        GRPC_PORT: GRPC_TEST_PORT,
      },
      shell: true,
    });

    grpcProcess.stderr.on("data", (data) => {
      console.error(`[gRPC Server Error Log]: ${data.toString()}`);
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("gRPC service did not start in time")),
        30000,
      );

      grpcProcess.stdout.on("data", (data) => {
        const log = data.toString();
        console.log(`[gRPC Server Log]: ${log}`);
        if (log.includes("listening") || log.includes(GRPC_TEST_PORT)) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }, 35000);

  afterAll(async () => {
    if (grpcProcess) {
      grpcProcess.kill("SIGKILL");
    }
    await prisma.doctor_schedules.deleteMany({ where: { doctor_id: testDoctorId } });
    await prisma.users.deleteMany({ where: { email: testDoctorEmail } });
  });

  it("should retrieve available slots via route 'getSlotsByDoctorId'", async () => {
    const res = await testApp.request(`/doctor/${testDoctorId}/available-slots?date=${testDate}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${doctorToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
    expect(body).toHaveProperty("availableSlots");
    expect(body.availableSlots).toBeInstanceOf(Array);
  });

  it("should retrieve available slots via route 'getAvailableSlots'", async () => {
    const res = await testApp.request(`/doctor/${testDoctorId}/available-slots?date=${testDate}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${doctorToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
    expect(body).toHaveProperty("availableSlots");
    expect(body.availableSlots).toBeInstanceOf(Array);
  });

  it("should return 400 if date query parameter is missing on getSlotsByDoctorId", async () => {
    const res = await testApp.request(`/doctors/slots/${testDoctorId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${doctorToken}` },
    });

    expect(res.status).toBe(400);
  });
});
