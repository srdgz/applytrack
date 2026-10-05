import type {
  ApplicationDetailsDraft,
  ApplicationDraft,
} from "../../domain/application/application-draft";
import type { FieldIssue } from "../../domain/application/field-issue";
import type { ApplicationStatus } from "../../domain/application/options";
import { validateApplicationDetails } from "../../domain/application/validate-application-details";
import { validateNewApplication } from "../../domain/application/validate-new-application";
import type { Clock } from "../ports/clock";

export type ValidateApplicationDraftInput =
  | { readonly draft: ApplicationDraft }
  | { readonly draft: ApplicationDetailsDraft; readonly currentStatus: ApplicationStatus };

export interface ValidateApplicationDraftDeps {
  readonly clock: Clock;
}

export class ValidateApplicationDraft {
  constructor(private readonly deps: ValidateApplicationDraftDeps) {}

  execute(input: ValidateApplicationDraftInput): readonly FieldIssue[] {
    const today = this.deps.clock.today();
    const result =
      "currentStatus" in input
        ? validateApplicationDetails(input.draft, { status: input.currentStatus, today })
        : validateNewApplication(input.draft, today);

    return result.ok ? [] : result.error;
  }
}
