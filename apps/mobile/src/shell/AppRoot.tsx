import type { i18n as I18n } from "i18next";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

import type { Boot, Booted, SessionMode } from "../di/booted";
import { createI18n, systemLocale } from "../i18n";
import type { ToastLabels } from "../notifications/ToastProvider";
import { ToastProvider, useToast } from "../notifications/ToastProvider";
import { applyTheme, ThemeRoot } from "../theme/theme";
import { FiltersProvider } from "./filters";
import { PreferencesProvider } from "./preferences";
import type { Notice } from "./session";
import { SessionProvider } from "./session";

const ToastHost = ({ children }: { readonly children: ReactNode }) => {
  const { t } = useTranslation();
  const labels = useMemo<ToastLabels>(
    () => ({
      close: t("toast.close"),
      region: t("toast.region"),
      kinds: {
        success: t("toast.success"),
        info: t("toast.info"),
        warning: t("toast.warning"),
        error: t("toast.error"),
        action: t("toast.action"),
        icon: t("toast.icon"),
        loading: t("toast.loading"),
      },
    }),
    [t],
  );
  return <ToastProvider labels={labels}>{children}</ToastProvider>;
};

const PendingNotice = ({ notice }: { readonly notice: Notice | null }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (!notice || shown.current) return;
    shown.current = true;
    if (notice.kind === "signedIn") toast.success(t("auth.signedInTitle", { email: notice.email }));
    else toast.info(t("auth.signedOutTitle"));
  }, [notice, t, toast]);

  return null;
};

interface Ready {
  readonly booted: Booted;
  readonly i18n: I18n;
}

export const AppRoot = ({
  boot,
  onReady,
  children,
}: {
  readonly boot: Boot;
  readonly onReady?: () => void;
  readonly children: ReactNode;
}) => {
  const [ready, setReady] = useState<Ready | null>(null);
  const [mode, setMode] = useState<SessionMode>("guest");
  const [generation, setGeneration] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const run = { cancelled: false };
    void (async () => {
      const booted = await boot({ locale: systemLocale(), theme: "system" });
      applyTheme(booted.preferences.theme);
      const i18n = await createI18n(booted.preferences.locale);
      if (run.cancelled) return;
      setMode(booted.mode);
      setReady({ booted, i18n });
    })();
    return () => {
      run.cancelled = true;
    };
  }, [boot, generation]);

  useEffect(() => {
    if (ready) onReady?.();
  }, [ready, onReady]);

  const restart = useCallback((next?: Notice) => {
    setNotice(next ?? null);
    setReady(null);
    setGeneration((current) => current + 1);
  }, []);

  if (!ready) return null;

  const session = { useCases: ready.booted.useCases, mode, setMode, restart };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <I18nextProvider i18n={ready.i18n}>
        <ThemeRoot>
          <SessionProvider value={session}>
            <ToastHost>
              <PendingNotice key={generation} notice={notice} />
              <PreferencesProvider initial={ready.booted.preferences}>
                <FiltersProvider>{children}</FiltersProvider>
              </PreferencesProvider>
            </ToastHost>
          </SessionProvider>
        </ThemeRoot>
      </I18nextProvider>
    </SafeAreaProvider>
  );
};
