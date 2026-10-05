import type { Locale } from "@applytrack/i18n";
import { createApp } from "vue";
import type { RouterHistory } from "vue-router";

import App from "./App.vue";
import type { UseCases } from "./di/use-cases";
import { USE_CASES } from "./di/use-cases";
import { createAppI18n } from "./i18n";
import { APP_I18N } from "./i18n/use-app-i18n";
import { createAppRouter } from "./router";

export interface AppOptions {
  readonly useCases: UseCases;
  readonly history: RouterHistory;
  readonly locale?: Locale;
}

export const createApplyTrackApp = ({ useCases, history, locale }: AppOptions) => {
  const i18n = createAppI18n(locale);
  const router = createAppRouter(useCases, history);
  const app = createApp(App);

  app.provide(USE_CASES, useCases);
  app.provide(APP_I18N, i18n);
  app.use(i18n);
  app.use(router);

  return { app, router, i18n };
};
