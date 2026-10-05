import type { InjectionKey } from "vue";
import { inject } from "vue";

import type { AppI18n } from "./index";

export const APP_I18N: InjectionKey<AppI18n> = Symbol("AppI18n");

export const useAppI18n = (): AppI18n => {
  const i18n = inject(APP_I18N);
  if (!i18n) throw new Error("AppI18n was not provided");
  return i18n;
};
