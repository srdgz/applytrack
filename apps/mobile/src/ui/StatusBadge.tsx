import type { ApplicationStatus } from "@applytrack/core";
import { statusTone } from "@applytrack/presentation";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Text } from "./Text";
import { TONE_CLASSES } from "./tone";

export const StatusBadge = ({
  status,
  size = "sm",
}: {
  readonly status: ApplicationStatus;
  readonly size?: "xs" | "sm";
}) => {
  const { t } = useTranslation();
  const tone = TONE_CLASSES[statusTone(status)];

  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full ${tone.soft} ${size === "sm" ? "px-3 py-1" : "px-2 py-0.5"}`}
    >
      <View className={`size-1.5 rounded-full ${tone.bg}`} />
      <Text className={`font-medium ${tone.text} ${size === "sm" ? "text-sm" : "text-xs"}`}>
        {t(`status.${status}`)}
      </Text>
    </View>
  );
};
