import type { ApplicationStatus, FieldIssue } from "@applytrack/core";
import { allowedTransitions, LIMITS } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

import { useToast } from "../notifications/ToastProvider";
import { describeApplicationError } from "../shell/application-errors";
import { useUseCases } from "../shell/session";
import { useIsDark } from "../theme/theme";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { CardSkeleton } from "../ui/ResultState";
import { Screen } from "../ui/Screen";
import { useApplication } from "./useApplication";

export const StatusScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const dark = useIsDark();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { changeApplicationStatus } = useUseCases();
  const { state } = useApplication(id);
  const [to, setTo] = useState<ApplicationStatus | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const colors = COLORS[dark ? "dark" : "light"];

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/applications/${id}`);
  };

  if (state.kind !== "ready") {
    return (
      <Screen>
        {state.kind === "loading" ? (
          <CardSkeleton />
        ) : (
          <>
            <Text accessibilityRole="alert" className="text-base text-ink">
              {t(state.kind === "notFound" ? "form.notFound" : "detail.actionError")}
            </Text>
            <Button variant="secondary" label={t("detail.cancel")} onPress={close} />
          </>
        )}
      </Screen>
    );
  }

  const application = state.application;
  const options = allowedTransitions(application.status);

  const save = async () => {
    if (!to) return;
    setSaving(true);
    setFailure(null);
    setIssues([]);
    try {
      const result = await changeApplicationStatus.execute({
        id: application.id,
        to,
        note: note.trim() === "" ? undefined : note,
      });
      if (!result.ok) {
        if (result.error.code === "VALIDATION_FAILED") setIssues(result.error.issues);
        setFailure(describeApplicationError(t, result.error));
        return;
      }
      toast.success(t("notify.statusTitle"), {
        description: t("notify.statusDescription", {
          company: result.value.company,
          status: t(`status.${to}`),
        }),
      });
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
          {t("mobile.statusScreenTitle", { company: application.company })}
        </Text>
        <Text className="text-sm text-ink-muted">
          {t("mobile.currentStatus", { status: t(`status.${application.status}`) })}
        </Text>
      </View>

      {options.length === 0 ? (
        <Text className="text-base text-ink-muted">{t("detail.finalStatus")}</Text>
      ) : (
        <View className="gap-2">
          <Text className="text-base font-semibold text-ink">{t("detail.newStatus")}</Text>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {options.map((status) => (
              <Chip
                key={status}
                role="radio"
                label={t(`status.${status}`)}
                selected={to === status}
                onPress={() => {
                  setTo(status);
                }}
              />
            ))}
          </View>
        </View>
      )}

      <View className="gap-1">
        <Text className="text-sm font-medium text-ink">{t("detail.note")}</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel={t("detail.note")}
          multiline
          maxLength={LIMITS.statusNote}
          placeholderTextColor={colors["ink-muted"]}
          className={`min-h-24 rounded-md border bg-surface px-3 py-2 text-base text-ink ${
            issues.length > 0 ? "border-danger" : "border-border"
          }`}
          style={{ textAlignVertical: "top" }}
        />
        <Text className="self-end text-xs text-ink-muted">
          {t("detail.noteCount", { count: note.length, max: LIMITS.statusNote })}
        </Text>
      </View>

      {failure && (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {failure}
        </Text>
      )}

      <View className="gap-3">
        <Button
          label={saving ? t("form.saving") : t("detail.saveChange")}
          disabled={to === null}
          busy={saving}
          onPress={() => void save()}
        />
        <Button variant="secondary" label={t("detail.cancel")} onPress={close} />
      </View>
    </Screen>
  );
};
