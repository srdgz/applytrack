export { Application } from "./domain/application/application";
export type { ApplicationSnapshot } from "./domain/application/application";
export type {
  ApplicationDetailsDraft,
  ApplicationDraft,
  SalaryDraft,
} from "./domain/application/application-draft";
export type { ApplicationDetails, SalaryRange } from "./domain/application/application-details";
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
export type { StatusChange } from "./domain/application/status-change";
export { validateApplicationDetails } from "./domain/application/validate-application-details";
export type { ValidationContext } from "./domain/application/validate-application-details";
export { calendarDateFromDate, parseCalendarDate } from "./domain/shared/calendar-date";
export type { CalendarDate } from "./domain/shared/calendar-date";
export { toApplicationId, toUserId } from "./domain/shared/ids";
export type { ApplicationId, UserId } from "./domain/shared/ids";
export { combine, err, ok } from "./domain/shared/result";
export type { Err, Ok, Result } from "./domain/shared/result";

export type { ApplicationUseCaseError } from "./application/errors";
export type { ApplicationRepository } from "./application/ports/application-repository";
export type { Clock } from "./application/ports/clock";
export type { DemoData } from "./application/ports/demo-data";
export type { IdGenerator } from "./application/ports/id-generator";
export type { SessionProvider } from "./application/ports/session-provider";
export { CreateApplication } from "./application/use-cases/create-application";
export { ExitDemo, ResetDemo, StartDemo } from "./application/use-cases/demo";
export type { DemoDeps } from "./application/use-cases/demo";
export type { CreateApplicationDeps } from "./application/use-cases/create-application";
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
