export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "no_response",
] as const;

export const INITIAL_STATUSES = ["wishlist", "applied"] as const;

export const APPLICATION_SOURCES = [
  "linkedin",
  "infojobs",
  "tecnoempleo",
  "company_site",
  "referral",
  "recruiter",
  "other",
] as const;

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export const CURRENCIES = ["EUR", "GBP", "USD"] as const;

export const DEFAULT_CURRENCY = "EUR";

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type InitialStatus = (typeof INITIAL_STATUSES)[number];
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type Currency = (typeof CURRENCIES)[number];

export const isOneOf = <T extends string>(options: readonly T[], value: string): value is T =>
  (options as readonly string[]).includes(value);
