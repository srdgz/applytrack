import type { ThemePreference } from "@applytrack/core";

export const applyTheme = (theme: ThemePreference): void => {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
};
