import type { CalendarDate } from "../shared/calendar-date";
import { addDays, calendarDateFromDate, daysBetween, startOfWeek } from "../shared/calendar-date";
import type { ApplicationSnapshot } from "./application";
import type { ApplicationSource, ApplicationStatus } from "./options";
import { APPLICATION_SOURCES, APPLICATION_STATUSES } from "./options";
import type { ApplicationSummary } from "./summary";
import { isActiveStatus, toSummary } from "./summary";

export const STATS_WEEKS = 8;

const RESPONSE_STATUSES: readonly ApplicationStatus[] = [
  "screening",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
];

export interface WeeklyCount {
  readonly weekStart: CalendarDate;
  readonly count: number;
}

export interface SourceStats {
  readonly source: ApplicationSource;
  readonly sent: number;
  readonly responded: number;
}

export interface DashboardStats {
  readonly total: number;
  readonly active: number;
  readonly closed: number;
  readonly byStatus: Readonly<Record<ApplicationStatus, number>>;
  readonly sent: number;
  readonly responded: number;
  readonly interviewed: number;
  readonly offered: number;
  readonly medianDaysToResponse: number | null;
  readonly weekly: readonly WeeklyCount[];
  readonly bySource: readonly SourceStats[];
  readonly stale: readonly ApplicationSummary[];
}

interface Journey {
  readonly application: ApplicationSnapshot;
  readonly sentAt: string | undefined;
  readonly respondedAt: string | undefined;
  readonly reached: ReadonlySet<ApplicationStatus>;
}

const journeyOf = (application: ApplicationSnapshot): Journey => {
  const sentIndex = application.history.findIndex(({ to }) => to === "applied");
  const afterSent = sentIndex === -1 ? [] : application.history.slice(sentIndex + 1);
  return {
    application,
    sentAt: application.history[sentIndex]?.changedAt,
    respondedAt: afterSent.find(({ to }) => RESPONSE_STATUSES.includes(to))?.changedAt,
    reached: new Set(application.history.map(({ to }) => to)),
  };
};

const dayOf = (iso: string): CalendarDate => calendarDateFromDate(new Date(iso));

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? upper) + upper) / 2;
};

const weeklyCounts = (
  applications: readonly ApplicationSnapshot[],
  today: CalendarDate,
): WeeklyCount[] => {
  const currentWeek = startOfWeek(today);
  return Array.from({ length: STATS_WEEKS }, (_, index) => {
    const weekStart = addDays(currentWeek, -7 * (STATS_WEEKS - 1 - index));
    const weekEnd = addDays(weekStart, 6);
    const count = applications.filter(
      ({ appliedAt }) => appliedAt !== undefined && appliedAt >= weekStart && appliedAt <= weekEnd,
    ).length;
    return { weekStart, count };
  });
};

export const computeDashboardStats = (
  applications: readonly ApplicationSnapshot[],
  today: CalendarDate,
): DashboardStats => {
  const journeys = applications.map(journeyOf);
  const sent = journeys.filter(({ sentAt }) => sentAt !== undefined);
  const responded = sent.filter(({ respondedAt }) => respondedAt !== undefined);

  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [
      status,
      applications.filter((application) => application.status === status).length,
    ]),
  ) as Record<ApplicationStatus, number>;

  const bySource = APPLICATION_SOURCES.map((source) => {
    const fromSource = sent.filter(({ application }) => application.source === source);
    return {
      source,
      sent: fromSource.length,
      responded: fromSource.filter(({ respondedAt }) => respondedAt !== undefined).length,
    };
  })
    .filter(({ sent: count }) => count > 0)
    .sort((a, b) => b.sent - a.sent);

  const active = applications.filter(({ status }) => isActiveStatus(status)).length;

  return {
    total: applications.length,
    active,
    closed: applications.length - active,
    byStatus,
    sent: sent.length,
    responded: responded.length,
    interviewed: sent.filter(({ reached }) => reached.has("interviewing")).length,
    offered: sent.filter(({ reached }) => reached.has("offer")).length,
    medianDaysToResponse: median(
      responded.map(({ sentAt = "", respondedAt = "" }) =>
        daysBetween(dayOf(sentAt), dayOf(respondedAt)),
      ),
    ),
    weekly: weeklyCounts(applications, today),
    bySource,
    stale: applications
      .filter(({ archived }) => !archived)
      .map((application) => toSummary(application, today))
      .filter(({ stale }) => stale)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0)),
  };
};
