import type { ApplicationStatus } from "./options";

export const ALLOWED_TRANSITIONS: Readonly<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  wishlist: ["applied", "withdrawn"],
  applied: ["screening", "interviewing", "rejected", "withdrawn", "no_response"],
  screening: ["interviewing", "offer", "rejected", "withdrawn", "no_response"],
  interviewing: ["offer", "rejected", "withdrawn", "no_response"],
  offer: ["accepted", "rejected", "withdrawn"],
  no_response: ["screening", "interviewing", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export const allowedTransitions = (from: ApplicationStatus): readonly ApplicationStatus[] =>
  ALLOWED_TRANSITIONS[from];

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

export const isFinalStatus = (status: ApplicationStatus): boolean =>
  ALLOWED_TRANSITIONS[status].length === 0;
