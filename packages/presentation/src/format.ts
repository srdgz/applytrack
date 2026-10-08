import type { CalendarDate, SalaryRange } from "@applytrack/core";
import { calendarDateFromDate, daysBetween } from "@applytrack/core";

const toLocalDate = (value: CalendarDate): Date => {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const createFormatter = (locale: string) => {
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const daysAgo = (days: number): string => relative.format(-days, "day");

  return {
    daysAgo,
    calendarDate: (value: CalendarDate): string => date.format(toLocalDate(value)),
    shortCalendarDate: (value: CalendarDate): string => shortDate.format(toLocalDate(value)),
    ratio: (count: number, total: number): string => percent.format(count / total),
    instant: (iso: string): string => dateTime.format(new Date(iso)),
    since: (iso: string, today: CalendarDate): string =>
      daysAgo(Math.max(0, daysBetween(calendarDateFromDate(new Date(iso)), today))),
    salary: (range: SalaryRange): string => {
      const money = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: range.currency,
        maximumFractionDigits: 0,
      });
      return [range.min, range.max]
        .filter((amount): amount is number => amount !== undefined)
        .map((amount) => money.format(amount))
        .join(" – ");
    },
  };
};

export type Formatter = ReturnType<typeof createFormatter>;
