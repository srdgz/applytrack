import type { AuthUseCaseError, FieldIssue } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import * as Linking from "expo-linking";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Pressable, View } from "react-native";

import { useSession } from "../shell/session";
import { AppLogo } from "../brand/AppLogo";
import { useToast } from "../notifications/ToastProvider";
import { useIsDark } from "../theme/theme";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { TextField } from "../ui/TextField";
import { usesPrivateIpHost } from "./redirect-url";
import { Text } from "../ui/Text";

const RESEND_SECONDS = 60;

const redirectUrl = () => Linking.createURL("auth/callback");

export const SignInScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const dark = useIsDark();
  const { useCases } = useSession();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<"email" | "check">("email");
  const [email, setEmail] = useState(params.email ?? "");
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  if (useCases.account) return <Redirect href="/board" />;

  const startTimer = () => {
    if (timer.current) clearInterval(timer.current);
    setRemaining(RESEND_SECONDS);
    timer.current = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          AccessibilityInfo.announceForAccessibility(t("auth.resendReady"));
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const showError = (error: AuthUseCaseError) => {
    if (error.code === "VALIDATION_FAILED") {
      setIssues(error.issues);
      return;
    }
    const message = t(`errors.${error.code}`);
    setFailure(message);
    toast.error(t("notify.failedTitle"), { description: message });
  };

  const sendLink = async (): Promise<boolean> => {
    setIssues([]);
    setFailure(null);
    setBusy(true);
    try {
      const result = await useCases.requestSignIn.execute({
        email,
        redirectTo: redirectUrl(),
      });
      if (!result.ok) {
        showError(result.error);
        return false;
      }
      startTimer();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (await sendLink()) setStep("check");
  };

  const resend = async () => {
    if (await sendLink()) toast.success(t("auth.resentTitle"));
  };

  const useOtherEmail = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRemaining(0);
    setFailure(null);
    setStep("email");
  };

  const muted = COLORS[dark ? "dark" : "light"]["ink-muted"];

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
        className="min-h-11 flex-row items-center gap-2 self-start"
      >
        <Icon name="chevronLeft" color={muted} size={18} />
        <Text className="text-sm text-ink-muted">{t("nav.back")}</Text>
      </Pressable>

      <View className="gap-4 rounded-lg border border-border bg-surface p-5">
        <View className="flex-row items-center gap-2" accessibilityElementsHidden>
          <AppLogo size={32} />
          <Text className="font-bold text-ink">{t("app.name")}</Text>
        </View>

        {step === "email" ? (
          <>
            <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
              {t("auth.title")}
            </Text>
            <Text className="text-base text-ink-muted">{t("auth.description")}</Text>
            {__DEV__ && usesPrivateIpHost(redirectUrl()) && (
              <Text className="rounded-md bg-warning-soft p-3 text-sm text-warning">
                {t("mobile.tunnelHint")}
              </Text>
            )}
            <TextField
              label={t("auth.emailLabel")}
              value={email}
              onChangeText={setEmail}
              issues={issues}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void submit()}
            />
            <Button
              label={busy ? t("auth.sending") : t("auth.sendLink")}
              busy={busy}
              onPress={() => void submit()}
            />
          </>
        ) : (
          <>
            <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
              {t("auth.checkTitle")}
            </Text>
            <Text className="text-base text-ink-muted">
              {t("mobile.checkDescription", { email: email.trim().toLowerCase() })}
            </Text>
            <Text className="text-sm text-ink-muted">{t("auth.spamHint")}</Text>
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <Button
                variant="link"
                label={
                  remaining > 0 ? t("auth.resendIn", { seconds: remaining }) : t("auth.resend")
                }
                disabled={remaining > 0}
                busy={busy}
                onPress={() => void resend()}
              />
              <Button variant="link" label={t("auth.otherEmail")} onPress={useOtherEmail} />
            </View>
          </>
        )}

        {failure && (
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {failure}
          </Text>
        )}
      </View>
    </Screen>
  );
};
