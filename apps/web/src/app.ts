import type { Preferences } from "@applytrack/core";
import type { Locale } from "@applytrack/i18n";
import type { ToastQueue } from "@applytrack/notifications";
import { createToastQueue } from "@applytrack/notifications";
import { createApp, ref } from "vue";
import type { RouterHistory } from "vue-router";

import App from "./App.vue";
import type { HardNavigate } from "./composables/useHardNavigation";
import { browserNavigate, HARD_NAVIGATE } from "./composables/useHardNavigation";
import { PREFERENCES } from "./composables/usePreferences";
import { TOASTS } from "./composables/useToast";
import type { UseCases } from "./di/use-cases";
import { USE_CASES } from "./di/use-cases";
import { createAppI18n, detectLocale } from "./i18n";
import { APP_I18N } from "./i18n/use-app-i18n";
import { createAppRouter } from "./router";

export interface AppOptions {
  readonly useCases: UseCases;
  readonly history: RouterHistory;
  readonly locale?: Locale;
  readonly preferences?: Preferences;
  readonly toasts?: ToastQueue;
  readonly navigate?: HardNavigate;
}

export const createApplyTrackApp = ({
  useCases,
  history,
  locale,
  preferences,
  toasts = createToastQueue(),
  navigate = browserNavigate,
}: AppOptions) => {
  const initial: Preferences = preferences ?? {
    locale: locale ?? detectLocale(),
    theme: "system",
  };
  const i18n = createAppI18n(initial.locale);
  const router = createAppRouter(useCases, history);
  const app = createApp(App);

  app.provide(USE_CASES, useCases);
  app.provide(APP_I18N, i18n);
  app.provide(TOASTS, toasts);
  app.provide(PREFERENCES, ref(initial));
  app.provide(HARD_NAVIGATE, navigate);
  app.use(i18n);
  app.use(router);

  return { app, router, i18n, toasts };
};
