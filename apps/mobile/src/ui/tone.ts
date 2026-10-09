import type { StatusTone } from "@applytrack/presentation";

export interface ToneClasses {
  readonly text: string;
  readonly bg: string;
  readonly soft: string;
  readonly border: string;
  readonly borderTop: string;
}

export const TONE_CLASSES: Readonly<Record<StatusTone, ToneClasses>> = {
  wishlist: {
    text: "text-status-wishlist",
    bg: "bg-status-wishlist",
    soft: "bg-status-wishlist-soft",
    border: "border-status-wishlist",
    borderTop: "border-t-status-wishlist",
  },
  applied: {
    text: "text-status-applied",
    bg: "bg-status-applied",
    soft: "bg-status-applied-soft",
    border: "border-status-applied",
    borderTop: "border-t-status-applied",
  },
  screening: {
    text: "text-status-screening",
    bg: "bg-status-screening",
    soft: "bg-status-screening-soft",
    border: "border-status-screening",
    borderTop: "border-t-status-screening",
  },
  interviewing: {
    text: "text-status-interviewing",
    bg: "bg-status-interviewing",
    soft: "bg-status-interviewing-soft",
    border: "border-status-interviewing",
    borderTop: "border-t-status-interviewing",
  },
  offer: {
    text: "text-status-offer",
    bg: "bg-status-offer",
    soft: "bg-status-offer-soft",
    border: "border-status-offer",
    borderTop: "border-t-status-offer",
  },
  rejected: {
    text: "text-status-rejected",
    bg: "bg-status-rejected",
    soft: "bg-status-rejected-soft",
    border: "border-status-rejected",
    borderTop: "border-t-status-rejected",
  },
  closed: {
    text: "text-status-closed",
    bg: "bg-status-closed",
    soft: "bg-status-closed-soft",
    border: "border-status-closed",
    borderTop: "border-t-status-closed",
  },
};

export const CARD_SHADOW =
  "0 1px 3px 0 rgba(17, 24, 40, 0.08), 0 1px 2px -1px rgba(17, 24, 40, 0.06)";

export const ACCENT_SHADOW = "0 6px 16px -4px rgba(79, 57, 246, 0.45)";
