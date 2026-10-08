import { createFormatter } from "@applytrack/presentation";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export const useFormat = () => {
  const { locale } = useI18n();
  const formatter = computed(() => createFormatter(locale.value));

  return {
    daysAgo: (days: number) => formatter.value.daysAgo(days),
    calendarDate: (...args: Parameters<ReturnType<typeof createFormatter>["calendarDate"]>) =>
      formatter.value.calendarDate(...args),
    shortCalendarDate: (
      ...args: Parameters<ReturnType<typeof createFormatter>["shortCalendarDate"]>
    ) => formatter.value.shortCalendarDate(...args),
    ratio: (count: number, total: number) => formatter.value.ratio(count, total),
    instant: (iso: string) => formatter.value.instant(iso),
    since: (...args: Parameters<ReturnType<typeof createFormatter>["since"]>) =>
      formatter.value.since(...args),
    salary: (...args: Parameters<ReturnType<typeof createFormatter>["salary"]>) =>
      formatter.value.salary(...args),
  };
};
