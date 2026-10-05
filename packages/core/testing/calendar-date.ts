import type { CalendarDate } from "../src";
import { parseCalendarDate } from "../src";

export const calendarDate = (value: string): CalendarDate => {
  const date = parseCalendarDate(value);
  if (date === null) throw new Error(`Invalid calendar date: ${value}`);
  return date;
};
