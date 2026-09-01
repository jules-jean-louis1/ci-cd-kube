import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH_SCHEDULE = path.resolve(__dirname, "../proto/schedule.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH_SCHEDULE, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Chargement dynamique du .proto : le typage exact du package généré
// n'est pas connu à la compilation, d'où le `any` ici (limité à ce point
// d'entrée précis).
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const schedulePackage = protoDescriptor.healthsync.schedules;

import { GetDoctorScheduleRequest } from "./generated/healthsync/schedules/GetDoctorScheduleRequest.js";
import { GetDoctorScheduleResponse } from "./generated/healthsync/schedules/GetDoctorScheduleResponse.js";
import { getDoctorSchedule } from "./schedule.service.js";
import { getAvailableSlots } from "./availableSlots.service.js";
import { GetDoctorAvailableSlotsRequest } from "./generated/healthsync/schedules/GetDoctorAvailableSlotsRequest.js";
import { GetDoctorAvailableSlotsResponse } from "./generated/healthsync/schedules/GetDoctorAvailableSlotsResponse.js";

const serverHandlers = {
  getDoctorAvailableSlots: async (
    call: { request: GetDoctorAvailableSlotsRequest },
    callback: (err: any, response: GetDoctorAvailableSlotsResponse) => void,
  ) => {
    const { doctorId, date } = call.request;

    if (!doctorId || !date) {
      return callback(
        {
          code: grpc.status.INVALID_ARGUMENT,
          message: "doctor_id (or doctorId) and date are required",
        },
        null as any,
      );
    }

    try {
      const slots = await getAvailableSlots(doctorId!, date!);

      callback(null, {
        doctorId,
        date,
        availableSlots: slots.map((s: any) => {
          const formatTime = (dateObj: Date) => {
            return dateObj.toISOString();
          };

          return {
            startTime: formatTime(new Date(s.start_time)),
            endTime: formatTime(new Date(s.end_time)),
          };
        }),
      });
    } catch (error) {
      callback(error, null as any);
    }
  },

  getDoctorSchedule: async (
    call: { request: GetDoctorScheduleRequest },
    callback: (err: any, response: GetDoctorScheduleResponse) => void,
  ) => {
    const { doctorId } = call.request as any;
    if (!doctorId) return callback({ message: "Missing doctorId" }, null as any);

    try {
      const schedules = await getDoctorSchedule(doctorId);
      callback(null, { schedules });
    } catch (error) {
      console.error("GetDoctorSchedule error:", error);
      callback(error, null as any);
    }
  },
};
const server = new grpc.Server();
server.addService(schedulePackage.ScheduleService.service, serverHandlers);

const PORT = process.env.GRPC_PORT || "50051";

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error("Failed to bind gRPC server:", err);
    process.exit(1);
  }
  console.log(`gRPC ScheduleService listening on port ${port}`);
});
