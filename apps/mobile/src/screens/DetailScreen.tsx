import { isFinalStatus, toSummary } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import { createFormatter } from "@applytrack/presentation";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { View as ViewType } from "react-native";
import {
  AccessibilityInfo,
  Alert,
  findNodeHandle,
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { describeApplicationError } from "../shell/application-errors";
import { useUseCases } from "../shell/session";
import { useToast } from "../notifications/ToastProvider";
import { useIsDark } from "../theme/theme";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { CardSkeleton, ResultState } from "../ui/ResultState";
import { Screen } from "../ui/Screen";
import { useApplication } from "./useApplication";

const WIDE = 768;

const Section = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <View className="gap-3 rounded-lg border border-border bg-surface p-4">
    <Text accessibilityRole="header" className="text-base font-semibold text-ink">
      {title}
    </Text>
    {children}
  </View>
);

const Field = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <View className="gap-0.5">
    <Text className="text-xs text-ink-muted">{label}</Text>
    {typeof children === "string" ? (
      <Text className="text-base text-ink">{children}</Text>
    ) : (
      children
    )}
  </View>
);

export const DetailScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const dark = useIsDark();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { archiveApplication, unarchiveApplication, deleteApplication, today } = useUseCases();
  const { state, reload, replace } = useApplication(id);
  const [failure, setFailure] = useState<string | null>(null);
  const unarchiveRef = useRef<ViewType>(null);
  const format = useMemo(() => createFormatter(i18n.language), [i18n.language]);
  const colors = COLORS[dark ? "dark" : "light"];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/board");
  };

  const back = (
    <Pressable
      accessibilityRole="button"
      onPress={goBack}
      className="min-h-11 flex-row items-center gap-2 self-start"
    >
      <Icon name="chevronLeft" size={18} color={colors["ink-muted"]} />
      <Text className="text-sm text-ink-muted">{t("nav.back")}</Text>
    </Pressable>
  );

  if (state.kind !== "ready") {
    return (
      <Screen>
        {back}
        {state.kind === "loading" && <CardSkeleton />}
        {state.kind === "error" && <ResultState kind="error" onAction={() => void reload()} />}
        {state.kind === "notFound" && (
          <View className="gap-4 rounded-lg border border-border bg-surface p-5">
            <Text accessibilityRole="header" className="text-xl font-bold text-ink">
              {t("form.notFound")}
            </Text>
            <Button
              label={t("form.backToBoard")}
              onPress={() => {
                router.replace("/board");
              }}
            />
          </View>
        )}
      </Screen>
    );
  }

  const application = state.application;
  const summary = toSummary(application, today());
  const final = isFinalStatus(application.status);
  const status = t(`status.${application.status}`);

  const archive = async () => {
    const result = await archiveApplication.execute({ id: application.id });
    if (!result.ok) {
      setFailure(describeApplicationError(t, result.error));
      return;
    }
    replace(result.value);
    toast.success(t("notify.archivedTitle"), { description: t("notify.archivedDescription") });
    setTimeout(() => {
      const node = findNodeHandle(unarchiveRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 300);
  };

  const unarchive = async () => {
    const result = await unarchiveApplication.execute({ id: application.id });
    if (!result.ok) {
      setFailure(describeApplicationError(t, result.error));
      return;
    }
    replace(result.value);
    toast.success(t("notify.unarchivedTitle"));
  };

  const remove = () => {
    Alert.alert(
      t("detail.deleteTitle", { company: application.company }),
      t("detail.deleteWarning"),
      [
        { text: t("detail.deleteCancel"), style: "cancel" },
        {
          text: t("detail.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              const result = await deleteApplication.execute({ id: application.id });
              if (!result.ok) {
                setFailure(describeApplicationError(t, result.error));
                return;
              }
              toast.success(t("notify.deletedTitle"), {
                description: t("notify.deletedDescription", { company: application.company }),
              });
              router.dismissTo("/board");
            })();
          },
        },
      ],
    );
  };

  const history = [...application.history].reverse();

  const header = (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {application.company}
      </Text>
      <Text className="text-base text-ink-muted">{application.position}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-ink">
          {status}
        </Text>
        {summary.stale && (
          <View className="flex-row items-center gap-1 rounded-full bg-warning-soft px-3 py-1">
            <Icon name="clock" size={14} color={colors.warning} />
            <Text className="text-sm font-medium text-warning">{t("card.stale")}</Text>
          </View>
        )}
      </View>

      {application.archived && (
        <View className="gap-2 rounded-md bg-warning-soft p-3">
          <Text className="text-sm text-warning">{t("detail.archivedNotice")}</Text>
          <View ref={unarchiveRef} className="self-start">
            <Button
              variant="secondary"
              label={t("detail.unarchive")}
              onPress={() => void unarchive()}
            />
          </View>
        </View>
      )}

      {final ? (
        <Text className="text-sm text-ink-muted">{t("detail.finalStatus")}</Text>
      ) : (
        <Button
          label={t("detail.changeStatus")}
          onPress={() => {
            router.push(`/applications/${application.id}/status`);
          }}
        />
      )}
      <Button
        variant="secondary"
        label={t("detail.edit")}
        onPress={() => {
          router.push(`/applications/${application.id}/edit`);
        }}
      />
      <View className="flex-row flex-wrap gap-4">
        {!application.archived && (
          <Button variant="link" label={t("detail.archive")} onPress={() => void archive()} />
        )}
        <Pressable accessibilityRole="button" onPress={remove} className="min-h-11 justify-center">
          <Text className="text-sm font-medium text-danger">{t("detail.delete")}</Text>
        </Pressable>
      </View>
      {failure && (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {failure}
        </Text>
      )}
    </View>
  );

  const data = (
    <Section title={t("detail.data")}>
      <Field label={t("form.fields.workMode")}>{t(`workMode.${application.workMode}`)}</Field>
      <Field label={t("form.fields.source")}>{t(`source.${application.source}`)}</Field>
      {application.location && (
        <Field label={t("form.fields.location")}>{application.location}</Field>
      )}
      {application.jobUrl && (
        <Field label={t("form.fields.jobUrl")}>
          <Pressable
            accessibilityRole="link"
            accessibilityHint={t("mobile.opensOutside")}
            onPress={() => {
              if (application.jobUrl) void Linking.openURL(application.jobUrl);
            }}
            className="min-h-11 justify-center self-start"
          >
            <Text className="text-base font-medium text-accent underline">
              {t("detail.openJobUrl")}
            </Text>
          </Pressable>
        </Field>
      )}
      {application.salary && (application.salary.min ?? application.salary.max) !== undefined && (
        <Field label={t("mobile.salary")}>{format.salary(application.salary)}</Field>
      )}
      {application.appliedAt && (
        <Field label={t("form.fields.appliedAt")}>
          {format.calendarDate(application.appliedAt)}
        </Field>
      )}
      {application.tags.length > 0 && (
        <Field label={t("filters.tags")}>
          <View className="flex-row flex-wrap gap-1">
            {application.tags.map((tag) => (
              <Text key={tag} className="rounded bg-accent-soft px-2 py-0.5 text-sm text-ink">
                {tag}
              </Text>
            ))}
          </View>
        </Field>
      )}
      {application.notes && <Field label={t("form.fields.notes")}>{application.notes}</Field>}
    </Section>
  );

  const historySection = (
    <Section title={t("detail.history")}>
      {history.map((change) => (
        <View key={change.changedAt + change.to} className="gap-0.5 border-l-2 border-border pl-3">
          <Text className="text-sm font-medium text-ink">
            {change.from
              ? t("detail.historyChange", {
                  from: t(`status.${change.from}`),
                  to: t(`status.${change.to}`),
                })
              : t("detail.historyCreated", { to: t(`status.${change.to}`) })}
          </Text>
          <Text className="text-xs text-ink-muted">
            {format.since(change.changedAt, today())} · {format.instant(change.changedAt)}
          </Text>
          {change.note && <Text className="text-sm text-ink">{change.note}</Text>}
        </View>
      ))}
    </Section>
  );

  return (
    <Screen>
      {back}
      {width >= WIDE ? (
        <View className="flex-row gap-6">
          <View className="flex-1 gap-6">
            {header}
            {data}
          </View>
          <View className="flex-1">{historySection}</View>
        </View>
      ) : (
        <>
          {header}
          {data}
          {historySection}
        </>
      )}
    </Screen>
  );
};
