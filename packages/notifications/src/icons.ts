import type { ToastKind } from "./kinds";

export const TOAST_ICONS = {
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  alert: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 16v-4", "M12 8h.01"],
  loader: ["M21 12a9 9 0 1 1-6.219-8.56"],
  rocket: [
    "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
    "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
    "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",
    "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
  ],
  sparkles: [
    "M9.94 14.06 7 17l2.94 2.94L12.88 17zM17 7l-2.94 2.94L17 12.88 19.94 9.94z",
    "M12 2v4M12 18v4M2 12h4M18 12h4",
  ],
  archive: ["M21 8v13H3V8", "M1 3h22v5H1z", "M10 12h4"],
  trash: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  ],
  refresh: ["M21 12a9 9 0 1 1-3-6.7L21 8", "M21 3v5h-5"],
} as const satisfies Record<string, readonly string[]>;

export type ToastIconName = keyof typeof TOAST_ICONS;

export const DEFAULT_TOAST_ICONS: Readonly<Record<ToastKind, ToastIconName>> = {
  success: "check",
  error: "x",
  warning: "alert",
  info: "info",
  action: "info",
  icon: "info",
  loading: "loader",
};

export const TOAST_COLORS: Readonly<Record<ToastKind, string>> = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
  action: "#3b82f6",
  icon: "#3b82f6",
  loading: "#737373",
};

export const TOAST_SURFACE = "#1a1a1a";

export const iconFor = (toast: { readonly kind: ToastKind; readonly icon?: ToastIconName }) =>
  toast.icon ?? DEFAULT_TOAST_ICONS[toast.kind];
