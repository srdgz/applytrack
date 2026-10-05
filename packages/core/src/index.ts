export { Application } from "./domain/application/application";
export type { ApplicationSnapshot, StatusChangeError } from "./domain/application/application";
export {
  ALLOWED_TRANSITIONS,
  allowedTransitions,
  canTransition,
  isFinalStatus,
} from "./domain/application/transitions";
export type {
  ApplicationDetailsDraft,
  ApplicationDraft,
  SalaryDraft,
} from "./domain/application/application-draft";
export type { ApplicationDetails, SalaryRange } from "./domain/application/application-details";
export { FIELD_ERROR_CODES } from "./domain/application/field-issue";
export type { FieldErrorCode, FieldIssue } from "./domain/application/field-issue";
export { LIMITS } from "./domain/application/limits";
export {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  CURRENCIES,
  DEFAULT_CURRENCY,
  INITIAL_STATUSES,
  WORK_MODES,
} from "./domain/application/options";
export type {
  ApplicationSource,
  ApplicationStatus,
  Currency,
  InitialStatus,
  WorkMode,
} from "./domain/application/options";
export {
  ARCHIVED_FILTERS,
  applyQuery,
  compareForQuery,
  completeQuery,
  DEFAULT_LIMIT,
  DEFAULT_SORT,
  matchesQuery,
  MAX_LIMIT,
  SORT_DIRECTIONS,
  SORT_FIELDS,
} from "./domain/application/query";
export type {
  ApplicationQuery,
  ApplicationSort,
  ArchivedFilter,
  Page,
  SortDirection,
  SortField,
} from "./domain/application/query";
export {
  BOARD_COLUMNS,
  columnForStatus,
  groupForBoard,
  statusesForColumn,
} from "./domain/application/board";
export type { BoardColumn, BoardColumnId } from "./domain/application/board";
export {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  isActiveStatus,
  STALE_AFTER_DAYS,
  toSummary,
} from "./domain/application/summary";
export type { ApplicationSummary } from "./domain/application/summary";
export { uniqueTags } from "./domain/application/tags";
export type { StatusChange } from "./domain/application/status-change";
export { validateApplicationDetails } from "./domain/application/validate-application-details";
export type { ValidationContext } from "./domain/application/validate-application-details";
export {
  calendarDateFromDate,
  daysBetween,
  parseCalendarDate,
} from "./domain/shared/calendar-date";
export type { CalendarDate } from "./domain/shared/calendar-date";
export { toApplicationId, toUserId } from "./domain/shared/ids";
export type { ApplicationId, UserId } from "./domain/shared/ids";
export { combine, err, ok } from "./domain/shared/result";
export type { Err, Ok, Result } from "./domain/shared/result";

export { USE_CASE_ERROR_CODES } from "./application/errors";
export type { ApplicationUseCaseError } from "./application/errors";
export type { ApplicationRepository } from "./application/ports/application-repository";
export type { Clock } from "./application/ports/clock";
export type { DemoData } from "./application/ports/demo-data";
export type { IdGenerator } from "./application/ports/id-generator";
export type { SessionProvider } from "./application/ports/session-provider";
export { ChangeApplicationStatus } from "./application/use-cases/change-application-status";
export type {
  ChangeApplicationStatusDeps,
  ChangeApplicationStatusInput,
} from "./application/use-cases/change-application-status";
export { CreateApplication } from "./application/use-cases/create-application";
export { ExitDemo, IsDemoActive, ResetDemo, StartDemo } from "./application/use-cases/demo";
export { GetApplication } from "./application/use-cases/get-application";
export type { GetApplicationDeps } from "./application/use-cases/get-application";
export type { DemoDeps } from "./application/use-cases/demo";
export type { CreateApplicationDeps } from "./application/use-cases/create-application";
export { ListTags } from "./application/use-cases/list-tags";
export type { ListTagsDeps } from "./application/use-cases/list-tags";
export { SearchApplications } from "./application/use-cases/search-applications";
export type { SearchApplicationsDeps } from "./application/use-cases/search-applications";
export { UpdateApplicationDetails } from "./application/use-cases/update-application-details";
export type {
  UpdateApplicationDetailsDeps,
  UpdateApplicationDetailsInput,
} from "./application/use-cases/update-application-details";
export { ValidateApplicationDraft } from "./application/use-cases/validate-application-draft";
export type {
  ValidateApplicationDraftDeps,
  ValidateApplicationDraftInput,
} from "./application/use-cases/validate-application-draft";
