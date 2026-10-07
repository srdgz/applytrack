import { createWebHistory } from "vue-router";

import { createApplyTrackApp } from "./app";
import { createBrowserContainer } from "./di/browser";
import { detectLocale } from "./i18n";
import { applyTheme } from "./preferences/theme";
import "./style.css";

const bootstrap = async () => {
  const useCases = await createBrowserContainer();
  const preferences = await useCases.getPreferences.execute({
    fallback: { locale: detectLocale(), theme: "system" },
  });
  applyTheme(preferences.theme);

  const { app } = createApplyTrackApp({
    useCases,
    history: createWebHistory(),
    preferences,
  });
  app.mount("#app");
};

void bootstrap();
