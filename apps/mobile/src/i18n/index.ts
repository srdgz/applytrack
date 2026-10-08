import type { Locale } from "@applytrack/i18n";
import { FALLBACK_LOCALE, messages, resolveLocale } from "@applytrack/i18n";
import { getLocales } from "expo-localization";
import type { i18n as I18n } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next";

export const systemLocale = (): Locale =>
  resolveLocale(getLocales().map(({ languageTag }) => languageTag));

export const createI18n = async (locale: Locale): Promise<I18n> => {
  const instance = createInstance();
  await instance
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: FALLBACK_LOCALE,
      resources: {
        es: { translation: messages.es },
        en: { translation: messages.en },
      },
      interpolation: { escapeValue: false },
      returnNull: false,
      initAsync: false,
    });
  return instance;
};
