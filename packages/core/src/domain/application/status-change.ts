import type { ApplicationStatus } from "./options";

export interface StatusChange {
  readonly from: ApplicationStatus | null;
  readonly to: ApplicationStatus;
  readonly changedAt: string;
  readonly note?: string;
}
