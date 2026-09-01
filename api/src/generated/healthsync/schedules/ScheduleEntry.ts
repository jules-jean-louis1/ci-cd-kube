// Original file: proto/schedule.proto

export interface ScheduleEntry {
  id?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
}

export interface ScheduleEntry__Output {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}
