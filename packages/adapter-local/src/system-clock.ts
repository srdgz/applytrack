import type { CalendarDate, Clock } from "@applytrack/core";
import { calendarDateFromDate } from "@applytrack/core";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  today(): CalendarDate {
    return calendarDateFromDate(new Date());
  }
}
