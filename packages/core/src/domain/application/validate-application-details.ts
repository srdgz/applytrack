import type { CalendarDate } from "../shared/calendar-date";
import { isAfter, parseCalendarDate } from "../shared/calendar-date";
import type { Result } from "../shared/result";
import { err, ok } from "../shared/result";
import { charLength, foldForComparison, optionalText } from "../shared/text";
import type { ApplicationDetailsDraft, SalaryDraft } from "./application-draft";
import type { ApplicationDetails, SalaryRange } from "./application-details";
import type { FieldIssue } from "./field-issue";
import { LIMITS } from "./limits";
import type { ApplicationStatus } from "./options";
import { APPLICATION_SOURCES, CURRENCIES, DEFAULT_CURRENCY, isOneOf, WORK_MODES } from "./options";

export interface ValidationContext {
  readonly status: ApplicationStatus | undefined;
  readonly today: CalendarDate;
}

const URL_PATTERN = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

const tooLong = (field: string, max: number): FieldIssue => ({
  field,
  code: "FIELD_TOO_LONG",
  meta: { max },
});

const requiredText = (field: string, value: string, max: number, issues: FieldIssue[]): string => {
  const trimmed = value.trim();
  if (!trimmed) issues.push({ field, code: "REQUIRED_FIELD" });
  else if (charLength(trimmed) > max) issues.push(tooLong(field, max));
  return trimmed;
};

const limitedText = (
  field: string,
  value: string | undefined,
  max: number,
  issues: FieldIssue[],
): string | undefined => {
  const text = optionalText(value);
  if (text !== undefined && charLength(text) > max) issues.push(tooLong(field, max));
  return text;
};

const jobUrl = (value: string | undefined, issues: FieldIssue[]): string | undefined => {
  const url = limitedText("jobUrl", value, LIMITS.jobUrl, issues);
  if (url !== undefined && !URL_PATTERN.test(url))
    issues.push({ field: "jobUrl", code: "INVALID_URL" });
  return url;
};

export const option = <T extends string>(
  field: string,
  options: readonly T[],
  value: string,
  issues: FieldIssue[],
): T | undefined => {
  if (isOneOf(options, value)) return value;
  issues.push({ field, code: "INVALID_OPTION" });
  return undefined;
};

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

const salary = (value: SalaryDraft | undefined, issues: FieldIssue[]): SalaryRange | undefined => {
  if (value?.min === undefined && value?.max === undefined) return undefined;

  const { min, max } = value;
  const currency = optionalText(value.currency) ?? DEFAULT_CURRENCY;

  if (min !== undefined && !isPositiveInteger(min)) {
    issues.push({ field: "salary.min", code: "INVALID_SALARY_RANGE" });
  }
  if (max !== undefined && !isPositiveInteger(max)) {
    issues.push({ field: "salary.max", code: "INVALID_SALARY_RANGE" });
  }
  if (min !== undefined && max !== undefined && min > max) {
    issues.push({ field: "salary", code: "INVALID_SALARY_RANGE" });
  }
  if (!isOneOf(CURRENCIES, currency)) {
    issues.push({ field: "salary.currency", code: "UNSUPPORTED_CURRENCY" });
    return undefined;
  }

  return {
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    currency,
  };
};

const appliedAt = (
  value: string | undefined,
  context: ValidationContext,
  issues: FieldIssue[],
): CalendarDate | undefined => {
  const text = optionalText(value);

  if (context.status === "wishlist") {
    if (text !== undefined) issues.push({ field: "appliedAt", code: "APPLIED_AT_NOT_ALLOWED" });
    return undefined;
  }

  if (text === undefined) return context.status === undefined ? undefined : context.today;

  const date = parseCalendarDate(text);
  if (date === null) {
    issues.push({ field: "appliedAt", code: "INVALID_DATE" });
    return undefined;
  }
  if (isAfter(date, context.today)) {
    issues.push({ field: "appliedAt", code: "FUTURE_DATE" });
  }
  return date;
};

const tags = (value: readonly string[] | undefined, issues: FieldIssue[]): string[] => {
  const cleaned = (value ?? [])
    .map((tag, index) => ({ tag: tag.trim(), index }))
    .filter(({ tag }) => tag !== "");

  if (cleaned.length > LIMITS.tags) {
    issues.push({ field: "tags", code: "TOO_MANY_TAGS", meta: { max: LIMITS.tags } });
  }

  const seen = new Set<string>();
  for (const { tag, index } of cleaned) {
    const field = `tags.${String(index)}`;
    const key = foldForComparison(tag);

    if (charLength(tag) > LIMITS.tag) issues.push(tooLong(field, LIMITS.tag));
    if (seen.has(key)) issues.push({ field, code: "DUPLICATED_TAG", meta: { tag } });
    seen.add(key);
  }

  return cleaned.map(({ tag }) => tag);
};

export const validateApplicationDetails = (
  draft: ApplicationDetailsDraft,
  context: ValidationContext,
): Result<ApplicationDetails, FieldIssue[]> => {
  const issues: FieldIssue[] = [];

  const company = requiredText("company", draft.company, LIMITS.company, issues);
  const position = requiredText("position", draft.position, LIMITS.position, issues);

  const source = option("source", APPLICATION_SOURCES, draft.source, issues);
  const workMode = option("workMode", WORK_MODES, draft.workMode, issues);

  const url = jobUrl(draft.jobUrl, issues);
  const location = limitedText("location", draft.location, LIMITS.location, issues);
  const salaryRange = salary(draft.salary, issues);
  const date = appliedAt(draft.appliedAt, context, issues);
  const tagList = tags(draft.tags, issues);
  const notes = limitedText("notes", draft.notes, LIMITS.notes, issues);

  if (issues.length > 0 || source === undefined || workMode === undefined) return err(issues);

  return ok({
    company,
    position,
    source,
    workMode,
    ...(url !== undefined && { jobUrl: url }),
    ...(location !== undefined && { location }),
    ...(salaryRange !== undefined && { salary: salaryRange }),
    ...(date !== undefined && { appliedAt: date }),
    tags: tagList,
    ...(notes !== undefined && { notes }),
  });
};
