export const PREFERENCE_LOCALES = ["es", "en"] as const;
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export type PreferenceLocale = (typeof PREFERENCE_LOCALES)[number];
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export interface Preferences {
  readonly locale: PreferenceLocale;
  readonly theme: ThemePreference;
}

const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

export const parsePreferences = (raw: unknown): Preferences | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const { locale, theme } = raw as Record<string, unknown>;
  if (!isOneOf(PREFERENCE_LOCALES, locale) || !isOneOf(THEME_PREFERENCES, theme)) return null;
  return { locale, theme };
};

export const samePreferences = (a: Preferences, b: Preferences): boolean =>
  a.locale === b.locale && a.theme === b.theme;
