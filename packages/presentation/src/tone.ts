import type { ApplicationStatus, BoardColumnId } from "@applytrack/core";

export const STATUS_TONES = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "closed",
] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

const TONE_BY_STATUS: Readonly<Record<ApplicationStatus, StatusTone>> = {
  wishlist: "wishlist",
  applied: "applied",
  screening: "screening",
  interviewing: "interviewing",
  offer: "offer",
  accepted: "offer",
  rejected: "rejected",
  withdrawn: "closed",
  no_response: "closed",
};

export const statusTone = (status: ApplicationStatus): StatusTone => TONE_BY_STATUS[status];

export const columnTone = (column: BoardColumnId): StatusTone =>
  column === "closed" ? "closed" : statusTone(column);

const letters = (word: string): readonly string[] => word.match(/[\p{L}\p{N}]/gu) ?? [];

export const companyInitials = (company: string): string => {
  const words = company
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
  const [first, second] = words;
  if (!first) return "?";
  const initials = second ? [letters(first)[0], letters(second)[0]] : letters(first).slice(0, 2);
  return initials.join("").toLocaleUpperCase();
};
