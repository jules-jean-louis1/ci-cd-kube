import type * as grpc from "@grpc/grpc-js";
import type { MessageTypeDefinition } from "@grpc/proto-loader";

import type {
  AvailableSlot as _healthsync_schedules_AvailableSlot,
  AvailableSlot__Output as _healthsync_schedules_AvailableSlot__Output,
} from "./healthsync/schedules/AvailableSlot.js";
import type {
  GetDoctorAvailableSlotsRequest as _healthsync_schedules_GetDoctorAvailableSlotsRequest,
  GetDoctorAvailableSlotsRequest__Output as _healthsync_schedules_GetDoctorAvailableSlotsRequest__Output,
} from "./healthsync/schedules/GetDoctorAvailableSlotsRequest.js";
import type {
  GetDoctorAvailableSlotsResponse as _healthsync_schedules_GetDoctorAvailableSlotsResponse,
  GetDoctorAvailableSlotsResponse__Output as _healthsync_schedules_GetDoctorAvailableSlotsResponse__Output,
} from "./healthsync/schedules/GetDoctorAvailableSlotsResponse.js";
import type {
  GetDoctorScheduleRequest as _healthsync_schedules_GetDoctorScheduleRequest,
  GetDoctorScheduleRequest__Output as _healthsync_schedules_GetDoctorScheduleRequest__Output,
} from "./healthsync/schedules/GetDoctorScheduleRequest.js";
import type {
  GetDoctorScheduleResponse as _healthsync_schedules_GetDoctorScheduleResponse,
  GetDoctorScheduleResponse__Output as _healthsync_schedules_GetDoctorScheduleResponse__Output,
} from "./healthsync/schedules/GetDoctorScheduleResponse.js";
import type {
  ScheduleEntry as _healthsync_schedules_ScheduleEntry,
  ScheduleEntry__Output as _healthsync_schedules_ScheduleEntry__Output,
} from "./healthsync/schedules/ScheduleEntry.js";
import type {
  ScheduleServiceClient as _healthsync_schedules_ScheduleServiceClient,
  ScheduleServiceDefinition as _healthsync_schedules_ScheduleServiceDefinition,
} from "./healthsync/schedules/ScheduleService.js";
/* eslint-disable @typescript-eslint/no-explicit-any */
type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  healthsync: {
    schedules: {
      AvailableSlot: MessageTypeDefinition<
        _healthsync_schedules_AvailableSlot,
        _healthsync_schedules_AvailableSlot__Output
      >;
      GetDoctorAvailableSlotsRequest: MessageTypeDefinition<
        _healthsync_schedules_GetDoctorAvailableSlotsRequest,
        _healthsync_schedules_GetDoctorAvailableSlotsRequest__Output
      >;
      GetDoctorAvailableSlotsResponse: MessageTypeDefinition<
        _healthsync_schedules_GetDoctorAvailableSlotsResponse,
        _healthsync_schedules_GetDoctorAvailableSlotsResponse__Output
      >;
      GetDoctorScheduleRequest: MessageTypeDefinition<
        _healthsync_schedules_GetDoctorScheduleRequest,
        _healthsync_schedules_GetDoctorScheduleRequest__Output
      >;
      GetDoctorScheduleResponse: MessageTypeDefinition<
        _healthsync_schedules_GetDoctorScheduleResponse,
        _healthsync_schedules_GetDoctorScheduleResponse__Output
      >;
      ScheduleEntry: MessageTypeDefinition<
        _healthsync_schedules_ScheduleEntry,
        _healthsync_schedules_ScheduleEntry__Output
      >;
      ScheduleService: SubtypeConstructor<
        typeof grpc.Client,
        _healthsync_schedules_ScheduleServiceClient
      > & { service: _healthsync_schedules_ScheduleServiceDefinition };
    };
  };
}
