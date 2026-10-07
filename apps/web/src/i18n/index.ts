import type { Locale, MessageSchema } from "@applytrack/i18n";
import { FALLBACK_LOCALE, isLocale, messages, resolveLocale } from "@applytrack/i18n";
import { IntlMessageFormat } from "intl-messageformat";
import type { MessageCompiler, MessageContext } from "vue-i18n";
import { createI18n } from "vue-i18n";

const messageCompiler: MessageCompiler = (message, { locale, key, onError }) => {
  if (typeof message !== "string") {
    onError?.(new Error(`Unsupported message format for "${key}"`) as never);
    return () => key;
  }
  const formatter = new IntlMessageFormat(message, locale);
  return (context: MessageContext) => String(formatter.format(context.values));
};

export const detectLocale = (): Locale => resolveLocale(window.navigator.languages);

export const createAppI18n = (locale: Locale = detectLocale()) =>
  createI18n<[MessageSchema], Locale, false>({
    legacy: false,
    locale,
    fallbackLocale: FALLBACK_LOCALE,
    messages,
    messageCompiler,
  });

export type AppI18n = ReturnType<typeof createAppI18n>;

export const applyLocale = (i18n: AppI18n, locale: string): void => {
  if (!isLocale(locale)) return;
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
};
