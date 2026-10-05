import type { FieldIssue } from "../domain/application/field-issue";

export const USE_CASE_ERROR_CODES = [
  "VALIDATION_FAILED",
  "APPLICATION_NOT_FOUND",
  "UNAUTHENTICATED",
] as const;

export type ApplicationUseCaseError =
  | { readonly code: "VALIDATION_FAILED"; readonly issues: readonly FieldIssue[] }
  | { readonly code: "APPLICATION_NOT_FOUND" }
  | { readonly code: "UNAUTHENTICATED" };

export const validationFailed = (issues: readonly FieldIssue[]): ApplicationUseCaseError => ({
  code: "VALIDATION_FAILED",
  issues,
});

export const applicationNotFound: ApplicationUseCaseError = { code: "APPLICATION_NOT_FOUND" };

export const unauthenticated: ApplicationUseCaseError = { code: "UNAUTHENTICATED" };
