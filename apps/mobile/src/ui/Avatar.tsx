import type { ApplicationStatus } from "@applytrack/core";
import { companyInitials, statusTone } from "@applytrack/presentation";
import { View } from "react-native";

import { Text } from "./Text";
import { TONE_CLASSES } from "./tone";

export const Avatar = ({
  company,
  status,
  size = "md",
}: {
  readonly company: string;
  readonly status: ApplicationStatus;
  readonly size?: "md" | "lg";
}) => {
  const tone = TONE_CLASSES[statusTone(status)];

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className={`items-center justify-center ${tone.soft} ${size === "lg" ? "size-12 rounded-lg" : "size-10 rounded-md"}`}
    >
      <Text className={`font-semibold ${tone.text} ${size === "lg" ? "text-base" : "text-sm"}`}>
        {companyInitials(company)}
      </Text>
    </View>
  );
};
