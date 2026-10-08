export const COLOR_NAMES = [
  "canvas",
  "surface",
  "surface-muted",
  "border",
  "ink",
  "ink-muted",
  "accent",
  "accent-ink",
  "accent-soft",
  "warning",
  "warning-soft",
  "danger",
  "danger-ink",
  "success",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];
export type ColorScheme = "light" | "dark";

export const COLORS: Readonly<Record<ColorScheme, Readonly<Record<ColorName, string>>>> = {
  light: {
    canvas: "#f9fafb",
    surface: "#ffffff",
    "surface-muted": "#f3f4f6",
    border: "#dbdee3",
    ink: "#111828",
    "ink-muted": "#4a5565",
    accent: "#4f39f6",
    "accent-ink": "#ffffff",
    "accent-soft": "#e8eeff",
    warning: "#963b00",
    "warning-soft": "#fef2c6",
    danger: "#c1000c",
    "danger-ink": "#ffffff",
    success: "#008235",
  },
  dark: {
    canvas: "#030712",
    surface: "#0e172b",
    "surface-muted": "#182438",
    border: "#2c3b51",
    ink: "#f1f5f9",
    "ink-muted": "#a0afc4",
    accent: "#8b99ff",
    "accent-ink": "#030712",
    "accent-soft": "#201e50",
    warning: "#ffc21b",
    "warning-soft": "#461901",
    danger: "#ff666a",
    "danger-ink": "#030712",
    success: "#00df73",
  },
};

export const BRAND = {
  primary: "#4f46e5",
  night: "#0b1020",
  success: "#34d399",
} as const;

export const cssVariables = (scheme: ColorScheme): Record<string, string> =>
  Object.fromEntries(
    COLOR_NAMES.map((name) => {
      const hex = COLORS[scheme][name];
      const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
      return [`--color-${name}`, channels.join(" ")];
    }),
  );
