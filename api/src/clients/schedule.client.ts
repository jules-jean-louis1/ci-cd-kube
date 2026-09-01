import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs"; // Import requis pour vérifier l'existence du fichier

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dockerProtoPath = path.resolve(__dirname, "../../proto/schedule.proto");
const localProtoPath = path.resolve(__dirname, "../../../grpc-service/proto/schedule.proto");

let PROTO_PATH = process.env.PROTO_PATH ? path.resolve(process.env.PROTO_PATH) : dockerProtoPath;

if (!process.env.PROTO_PATH && !fs.existsSync(PROTO_PATH)) {
  PROTO_PATH = localProtoPath;
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const ScheduleServiceClient = protoDescriptor.healthsync.schedules.ScheduleService;

const GRPC_HOST = process.env.GRPC_SERVER_HOST || "grpc-service:50051";

export const grpcScheduleClient = new ScheduleServiceClient(
  GRPC_HOST,
  grpc.credentials.createInsecure(),
);
