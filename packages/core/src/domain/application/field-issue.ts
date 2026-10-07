export const FIELD_ERROR_CODES = [
  "REQUIRED_FIELD",
  "FIELD_TOO_LONG",
  "INVALID_OPTION",
  "INVALID_URL",
  "INVALID_SALARY_RANGE",
  "UNSUPPORTED_CURRENCY",
  "INVALID_DATE",
  "FUTURE_DATE",
  "APPLIED_AT_NOT_ALLOWED",
  "TOO_MANY_TAGS",
  "DUPLICATED_TAG",
  "INVALID_EMAIL",
  "INVALID_CODE_FORMAT",
] as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];

export interface FieldIssue {
  readonly field: string;
  readonly code: FieldErrorCode;
  readonly meta?: Readonly<Record<string, string | number>>;
}
