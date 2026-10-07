import type { Preferences } from "@applytrack/core";
import type { InjectionKey, Ref } from "vue";
import { inject } from "vue";
import { useI18n } from "vue-i18n";

import { useUseCases } from "../di/use-cases";
import { applyLocale } from "../i18n";
import { useAppI18n } from "../i18n/use-app-i18n";
import { applyTheme } from "../preferences/theme";
import { useToast } from "./useToast";

export const PREFERENCES: InjectionKey<Ref<Preferences>> = Symbol("Preferences");

export const usePreferences = () => {
  const preferences = inject(PREFERENCES);
  if (!preferences) throw new Error("Preferences were not provided");
  const { updatePreferences } = useUseCases();
  const i18n = useAppI18n();
  const { t } = useI18n();
  const toast = useToast();

  const apply = (next: Preferences) => {
    preferences.value = next;
    applyLocale(i18n, next.locale);
    applyTheme(next.theme);
  };

  const update = async (changes: Partial<Preferences>): Promise<void> => {
    const current = preferences.value;
    apply({ ...current, ...changes });
    const result = await updatePreferences.execute({ current, changes });
    if (!result.ok) {
      toast.warning(t("settings.syncFailedTitle"), { description: t("errors.SYNC_FAILED") });
    }
  };

  return { preferences, update };
};
