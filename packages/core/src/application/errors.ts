import type { FieldIssue } from "../domain/application/field-issue";
import type { ApplicationStatus } from "../domain/application/options";
import type { Preferences } from "../domain/preferences/preferences";
import type { AuthFailure } from "./ports/auth-gateway";

export const USE_CASE_ERROR_CODES = [
  "VALIDATION_FAILED",
  "APPLICATION_NOT_FOUND",
  "UNAUTHENTICATED",
  "INVALID_STATUS_TRANSITION",
  "RATE_LIMITED",
  "INVALID_CODE",
  "AUTH_UNAVAILABLE",
  "SYNC_FAILED",
] as const;

export type ApplicationUseCaseError =
  | { readonly code: "VALIDATION_FAILED"; readonly issues: readonly FieldIssue[] }
  | { readonly code: "APPLICATION_NOT_FOUND" }
  | { readonly code: "UNAUTHENTICATED" }
  | {
      readonly code: "INVALID_STATUS_TRANSITION";
      readonly from: ApplicationStatus;
      readonly to: ApplicationStatus;
    };

export const validationFailed = (issues: readonly FieldIssue[]): ApplicationUseCaseError => ({
  code: "VALIDATION_FAILED",
  issues,
});

export const applicationNotFound: ApplicationUseCaseError = { code: "APPLICATION_NOT_FOUND" };

export const unauthenticated: ApplicationUseCaseError = { code: "UNAUTHENTICATED" };

export const invalidTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
): ApplicationUseCaseError => ({ code: "INVALID_STATUS_TRANSITION", from, to });

export type AuthUseCaseError =
  | { readonly code: "VALIDATION_FAILED"; readonly issues: readonly FieldIssue[] }
  | { readonly code: AuthFailure };

export interface PreferencesSyncError {
  readonly code: "SYNC_FAILED";
  readonly preferences: Preferences;
}
