import type { CalendarDate } from "../shared/calendar-date";
import { calendarDateFromDate, daysBetween } from "../shared/calendar-date";
import type { ApplicationSnapshot } from "./application";
import type { ApplicationStatus } from "./options";

export const STALE_AFTER_DAYS = 14;

export const ACTIVE_STATUSES = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
] as const satisfies readonly ApplicationStatus[];

export const CLOSED_STATUSES = [
  "accepted",
  "rejected",
  "withdrawn",
  "no_response",
] as const satisfies readonly ApplicationStatus[];

export const isActiveStatus = (status: ApplicationStatus): boolean =>
  (ACTIVE_STATUSES as readonly ApplicationStatus[]).includes(status);

export interface ApplicationSummary extends ApplicationSnapshot {
  readonly daysSinceUpdate: number;
  readonly stale: boolean;
}

export const toSummary = (
  application: ApplicationSnapshot,
  today: CalendarDate,
): ApplicationSummary => {
  const updatedOn = calendarDateFromDate(new Date(application.updatedAt));
  const daysSinceUpdate = Math.max(0, daysBetween(updatedOn, today));
  return {
    ...application,
    daysSinceUpdate,
    stale: isActiveStatus(application.status) && daysSinceUpdate > STALE_AFTER_DAYS,
  };
};
