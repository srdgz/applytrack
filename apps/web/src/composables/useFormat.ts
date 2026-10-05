import type { CalendarDate } from "@applytrack/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export const useFormat = () => {
  const { locale } = useI18n();

  const relative = computed(() => new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" }));
  const date = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }));

  const daysAgo = (days: number): string => relative.value.format(-days, "day");

  const calendarDate = (value: CalendarDate): string => {
    const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
    return date.value.format(new Date(year, month - 1, day));
  };

  return { daysAgo, calendarDate };
};
