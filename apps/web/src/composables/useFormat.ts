import type { CalendarDate, SalaryRange } from "@applytrack/core";
import { calendarDateFromDate, daysBetween } from "@applytrack/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export const useFormat = () => {
  const { locale } = useI18n();

  const relative = computed(() => new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" }));
  const date = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }));
  const dateTime = computed(
    () => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }),
  );

  const daysAgo = (days: number): string => relative.value.format(-days, "day");

  const calendarDate = (value: CalendarDate): string => {
    const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
    return date.value.format(new Date(year, month - 1, day));
  };

  const instant = (iso: string): string => dateTime.value.format(new Date(iso));

  const since = (iso: string, today: CalendarDate): string =>
    daysAgo(Math.max(0, daysBetween(calendarDateFromDate(new Date(iso)), today)));

  const salary = (range: SalaryRange): string => {
    const format = new Intl.NumberFormat(locale.value, {
      style: "currency",
      currency: range.currency,
      maximumFractionDigits: 0,
    });
    return [range.min, range.max]
      .filter((amount): amount is number => amount !== undefined)
      .map((amount) => format.format(amount))
      .join(" – ");
  };

  return { daysAgo, calendarDate, instant, since, salary };
};
