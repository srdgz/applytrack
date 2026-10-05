import type { CalendarDate, Clock } from "../src";
import { calendarDateFromDate } from "../src";

export class FixedClock implements Clock {
  private current: Date;

  constructor(isoDateTime = "2026-10-05T10:00:00.000Z") {
    this.current = new Date(isoDateTime);
  }

  now(): Date {
    return new Date(this.current);
  }

  today(): CalendarDate {
    return calendarDateFromDate(this.current);
  }

  set(isoDateTime: string): void {
    this.current = new Date(isoDateTime);
  }
}
