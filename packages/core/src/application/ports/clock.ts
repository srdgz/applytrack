import type { CalendarDate } from "../../domain/shared/calendar-date";

export interface Clock {
  now(): Date;
  today(): CalendarDate;
}
