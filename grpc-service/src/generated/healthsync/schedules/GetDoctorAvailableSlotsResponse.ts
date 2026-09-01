// Original file: proto/schedule.proto

import type {
  AvailableSlot as _healthsync_schedules_AvailableSlot,
  AvailableSlot__Output as _healthsync_schedules_AvailableSlot__Output,
} from "../../healthsync/schedules/AvailableSlot.js";

export interface GetDoctorAvailableSlotsResponse {
  doctorId?: string;
  date?: string;
  availableSlots?: _healthsync_schedules_AvailableSlot[];
}

export interface GetDoctorAvailableSlotsResponse__Output {
  doctorId: string;
  date: string;
  availableSlots: _healthsync_schedules_AvailableSlot__Output[];
}
