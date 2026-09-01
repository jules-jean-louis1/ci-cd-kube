// Original file: proto/schedule.proto

import type {
  ScheduleEntry as _healthsync_schedules_ScheduleEntry,
  ScheduleEntry__Output as _healthsync_schedules_ScheduleEntry__Output,
} from "../../healthsync/schedules/ScheduleEntry.js";

export interface GetDoctorScheduleResponse {
  schedules?: _healthsync_schedules_ScheduleEntry[];
}

export interface GetDoctorScheduleResponse__Output {
  schedules: _healthsync_schedules_ScheduleEntry__Output[];
}
