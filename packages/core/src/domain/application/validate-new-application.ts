import type { CalendarDate } from "../shared/calendar-date";
import type { Result } from "../shared/result";
import { err, ok } from "../shared/result";
import type { ApplicationDraft } from "./application-draft";
import type { ApplicationDetails } from "./application-details";
import type { FieldIssue } from "./field-issue";
import type { InitialStatus } from "./options";
import { INITIAL_STATUSES } from "./options";
import { option, validateApplicationDetails } from "./validate-application-details";

export interface NewApplication {
  readonly status: InitialStatus;
  readonly details: ApplicationDetails;
}

export const validateNewApplication = (
  draft: ApplicationDraft,
  today: CalendarDate,
): Result<NewApplication, FieldIssue[]> => {
  const issues: FieldIssue[] = [];
  const status = option("status", INITIAL_STATUSES, draft.status, issues);
  const details = validateApplicationDetails(draft, { status, today });

  if (!details.ok) issues.push(...details.error);
  if (status === undefined || !details.ok) return err(issues);

  return ok({ status, details: details.value });
};
