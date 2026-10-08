import type { Preferences } from "@applytrack/core";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "../notifications/ToastProvider";
import { applyTheme } from "../theme/theme";
import { useUseCases } from "./session";

interface PreferencesApi {
  readonly preferences: Preferences;
  readonly update: (changes: Partial<Preferences>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesApi | null>(null);

export const PreferencesProvider = ({
  initial,
  children,
}: {
  readonly initial: Preferences;
  readonly children: ReactNode;
}) => {
  const [preferences, setPreferences] = useState(initial);
  const { updatePreferences } = useUseCases();
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const update = useCallback(
    async (changes: Partial<Preferences>) => {
      const next = { ...preferences, ...changes };
      setPreferences(next);
      applyTheme(next.theme);
      await i18n.changeLanguage(next.locale);
      const result = await updatePreferences.execute({ current: preferences, changes });
      if (!result.ok) {
        toast.warning(t("settings.syncFailedTitle"), { description: t("errors.SYNC_FAILED") });
      }
    },
    [preferences, updatePreferences, i18n, t, toast],
  );

  const value = useMemo(() => ({ preferences, update }), [preferences, update]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = (): PreferencesApi => {
  const api = useContext(PreferencesContext);
  if (!api) throw new Error("PreferencesProvider is missing");
  return api;
};
