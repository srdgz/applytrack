import type { CalendarDate } from "../shared/calendar-date";
import type { ApplicationSource, Currency, WorkMode } from "./options";

export interface SalaryRange {
  readonly min?: number;
  readonly max?: number;
  readonly currency: Currency;
}

export interface ApplicationDetails {
  readonly company: string;
  readonly position: string;
  readonly source: ApplicationSource;
  readonly workMode: WorkMode;
  readonly jobUrl?: string;
  readonly location?: string;
  readonly salary?: SalaryRange;
  readonly appliedAt?: CalendarDate;
  readonly tags: readonly string[];
  readonly notes?: string;
}

const canonical = (details: ApplicationDetails) => ({
  company: details.company,
  position: details.position,
  source: details.source,
  workMode: details.workMode,
  jobUrl: details.jobUrl ?? null,
  location: details.location ?? null,
  salary: details.salary
    ? {
        min: details.salary.min ?? null,
        max: details.salary.max ?? null,
        currency: details.salary.currency,
      }
    : null,
  appliedAt: details.appliedAt ?? null,
  tags: details.tags,
  notes: details.notes ?? null,
});

export const sameDetails = (a: ApplicationDetails, b: ApplicationDetails): boolean =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
