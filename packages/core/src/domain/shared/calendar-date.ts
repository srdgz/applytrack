import type { Brand } from "./brand";

export type CalendarDate = Brand<string, "CalendarDate">;

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

export const parseCalendarDate = (value: string): CalendarDate | null => {
  const match = FORMAT.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  return value as CalendarDate;
};

export const calendarDateFromDate = (date: Date): CalendarDate => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as CalendarDate;
};

export const isAfter = (a: CalendarDate, b: CalendarDate): boolean => a > b;

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtcMidnight = (date: CalendarDate): number => {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

export const daysBetween = (from: CalendarDate, to: CalendarDate): number =>
  Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);

const fromUtcMidnight = (time: number): CalendarDate => {
  const date = new Date(time);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as CalendarDate;
};

export const addDays = (date: CalendarDate, days: number): CalendarDate =>
  fromUtcMidnight(toUtcMidnight(date) + days * DAY_MS);

export const startOfWeek = (date: CalendarDate): CalendarDate => {
  const weekday = new Date(toUtcMidnight(date)).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
};
