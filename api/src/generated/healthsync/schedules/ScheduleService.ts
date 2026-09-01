// Original file: proto/schedule.proto

import type * as grpc from "@grpc/grpc-js";
import type { MethodDefinition } from "@grpc/proto-loader";
import type {
  GetDoctorAvailableSlotsRequest as _healthsync_schedules_GetDoctorAvailableSlotsRequest,
  GetDoctorAvailableSlotsRequest__Output as _healthsync_schedules_GetDoctorAvailableSlotsRequest__Output,
} from "../../healthsync/schedules/GetDoctorAvailableSlotsRequest.js";
import type {
  GetDoctorAvailableSlotsResponse as _healthsync_schedules_GetDoctorAvailableSlotsResponse,
  GetDoctorAvailableSlotsResponse__Output as _healthsync_schedules_GetDoctorAvailableSlotsResponse__Output,
} from "../../healthsync/schedules/GetDoctorAvailableSlotsResponse.js";
import type {
  GetDoctorScheduleRequest as _healthsync_schedules_GetDoctorScheduleRequest,
  GetDoctorScheduleRequest__Output as _healthsync_schedules_GetDoctorScheduleRequest__Output,
} from "../../healthsync/schedules/GetDoctorScheduleRequest.js";
import type {
  GetDoctorScheduleResponse as _healthsync_schedules_GetDoctorScheduleResponse,
  GetDoctorScheduleResponse__Output as _healthsync_schedules_GetDoctorScheduleResponse__Output,
} from "../../healthsync/schedules/GetDoctorScheduleResponse.js";

export interface ScheduleServiceClient extends grpc.Client {
  GetDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorAvailableSlots(
    argument: _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorAvailableSlotsResponse__Output>,
  ): grpc.ClientUnaryCall;

  GetDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
  getDoctorSchedule(
    argument: _healthsync_schedules_GetDoctorScheduleRequest,
    callback: grpc.requestCallback<_healthsync_schedules_GetDoctorScheduleResponse__Output>,
  ): grpc.ClientUnaryCall;
}

export interface ScheduleServiceHandlers extends grpc.UntypedServiceImplementation {
  GetDoctorAvailableSlots: grpc.handleUnaryCall<
    _healthsync_schedules_GetDoctorAvailableSlotsRequest__Output,
    _healthsync_schedules_GetDoctorAvailableSlotsResponse
  >;

  GetDoctorSchedule: grpc.handleUnaryCall<
    _healthsync_schedules_GetDoctorScheduleRequest__Output,
    _healthsync_schedules_GetDoctorScheduleResponse
  >;
}

export interface ScheduleServiceDefinition extends grpc.ServiceDefinition {
  GetDoctorAvailableSlots: MethodDefinition<
    _healthsync_schedules_GetDoctorAvailableSlotsRequest,
    _healthsync_schedules_GetDoctorAvailableSlotsResponse,
    _healthsync_schedules_GetDoctorAvailableSlotsRequest__Output,
    _healthsync_schedules_GetDoctorAvailableSlotsResponse__Output
  >;
  GetDoctorSchedule: MethodDefinition<
    _healthsync_schedules_GetDoctorScheduleRequest,
    _healthsync_schedules_GetDoctorScheduleResponse,
    _healthsync_schedules_GetDoctorScheduleRequest__Output,
    _healthsync_schedules_GetDoctorScheduleResponse__Output
  >;
}
