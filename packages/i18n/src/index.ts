import en from "./locales/en.json";
import es from "./locales/es.json";

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const FALLBACK_LOCALE: Locale = "en";

export type MessageSchema = typeof es;

export const messages: Readonly<Record<Locale, MessageSchema>> = { es, en };

export const isLocale = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const resolveLocale = (candidates: readonly (string | null | undefined)[]): Locale => {
  for (const candidate of candidates) {
    const language = candidate?.toLowerCase().split("-")[0];
    if (language !== undefined && isLocale(language)) return language;
  }
  return FALLBACK_LOCALE;
};
