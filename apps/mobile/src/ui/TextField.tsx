import type { FieldIssue } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import type { TextInputProps } from "react-native";
import { TextInput, View } from "react-native";

import { useIsDark } from "../theme/theme";
import { Text } from "./Text";

export const TextField = ({
  label,
  value,
  onChangeText,
  issues,
  inputRef,
  required = false,
  hint,
  ...input
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly issues: readonly FieldIssue[];
  readonly inputRef?: Ref<TextInput>;
  readonly required?: boolean;
  readonly hint?: string | undefined;
} & Pick<
  TextInputProps,
  | "autoComplete"
  | "keyboardType"
  | "textContentType"
  | "onSubmitEditing"
  | "returnKeyType"
  | "maxLength"
  | "onBlur"
  | "placeholder"
  | "multiline"
  | "submitBehavior"
  | "autoCapitalize"
>) => {
  const { t } = useTranslation();
  const dark = useIsDark();
  const invalid = issues.length > 0;

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-ink">
        {label}
        {required ? <Text className="text-danger"> *</Text> : null}
      </Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={COLORS[dark ? "dark" : "light"]["ink-muted"]}
        className={`font-sans min-h-12 rounded-md border bg-surface px-3 text-base text-ink ${
          input.multiline ? "min-h-28 py-2" : ""
        } ${invalid ? "border-danger" : "border-border"}`}
        {...input}
      />
      {hint ? <Text className="text-xs text-ink-muted">{hint}</Text> : null}
      {issues.map((issue) => (
        <Text
          key={`${issue.field}-${issue.code}`}
          accessibilityLiveRegion="polite"
          className="text-sm text-danger"
        >
          {t(`errors.${issue.code}`, { ...issue.meta })}
        </Text>
      ))}
    </View>
  );
};
