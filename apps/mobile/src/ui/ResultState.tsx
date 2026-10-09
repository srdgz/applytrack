import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";

export type ResultKind = "none" | "filtered" | "error";

export const ResultState = ({
  kind,
  onAction,
}: {
  readonly kind: ResultKind;
  readonly onAction: () => void;
}) => {
  const { t } = useTranslation();

  const content = {
    none: {
      title: t("empty.noneTitle"),
      description: t("empty.noneDescription"),
      action: t("empty.noneAction"),
    },
    filtered: {
      title: t("empty.filteredTitle"),
      description: null,
      action: t("empty.filteredAction"),
    },
    error: {
      title: t("feedback.errorTitle"),
      description: t("feedback.errorDescription"),
      action: t("feedback.retry"),
    },
  }[kind];

  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : undefined}
      className="items-center gap-3 rounded-lg border border-dashed border-border p-8"
    >
      <Text className="text-center text-lg font-semibold text-ink">{content.title}</Text>
      {content.description && (
        <Text className="text-center text-base text-ink-muted">{content.description}</Text>
      )}
      <Button variant="secondary" label={content.action} onPress={onAction} />
    </View>
  );
};

export const CardSkeleton = () => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    className="gap-3 rounded-lg border border-border bg-surface p-4"
  >
    <View className="h-4 w-2/3 rounded bg-surface-muted" />
    <View className="h-3 w-1/2 rounded bg-surface-muted" />
    <View className="h-3 w-1/3 rounded bg-surface-muted" />
  </View>
);
