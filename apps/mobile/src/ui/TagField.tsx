import type { FieldIssue } from "@applytrack/core";
import { LIMITS } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import type { Ref } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TextInput as TextInputType } from "react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useIsDark } from "../theme/theme";

export const TagField = ({
  label,
  tags,
  issues,
  onChange,
  onBlur,
  inputRef,
}: {
  readonly label: string;
  readonly tags: readonly string[];
  readonly issues: readonly FieldIssue[];
  readonly onChange: (tags: string[]) => void;
  readonly onBlur: () => void;
  readonly inputRef?: Ref<TextInputType>;
}) => {
  const { t } = useTranslation();
  const dark = useIsDark();
  const colors = COLORS[dark ? "dark" : "light"];
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag !== "") onChange([...tags, tag]);
    setDraft("");
  };

  const change = (text: string) => {
    if (!text.includes(",")) {
      setDraft(text);
      return;
    }
    const parts = text.split(",");
    const rest = parts.pop() ?? "";
    const added = parts.map((part) => part.trim()).filter((part) => part !== "");
    if (added.length > 0) onChange([...tags, ...added]);
    setDraft(rest);
  };

  const invalidIndexes = new Set(
    issues
      .map((issue) => Number(issue.field.split(".")[1]))
      .filter((index) => Number.isInteger(index)),
  );

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag, index) => (
            <View
              key={`${tag}-${String(index)}`}
              className={`flex-row items-center rounded-full border pl-3 ${
                invalidIndexes.has(index)
                  ? "border-danger bg-surface"
                  : "border-border bg-accent-soft"
              }`}
            >
              <Text className="text-sm text-ink">{tag}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("form.removeTag", { tag })}
                onPress={() => {
                  onChange(tags.filter((_, position) => position !== index));
                }}
                className="size-11 items-center justify-center"
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" accessible={false}>
                  <Path
                    d="M18 6 6 18M6 6l12 12"
                    stroke={colors["ink-muted"]}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <TextInput
        ref={inputRef}
        value={draft}
        onChangeText={change}
        onSubmitEditing={() => {
          add(draft);
        }}
        onBlur={() => {
          if (draft.trim() !== "") add(draft);
          onBlur();
        }}
        submitBehavior="submit"
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        placeholder={t("form.placeholders.tags")}
        placeholderTextColor={colors["ink-muted"]}
        className={`min-h-12 rounded-md border bg-surface px-3 text-base text-ink ${
          issues.length > 0 ? "border-danger" : "border-border"
        }`}
      />
      <Text className="text-xs text-ink-muted">
        {t("mobile.tagsHint")} {t("form.hints.tagsCount", { count: tags.length, max: LIMITS.tags })}
      </Text>
      {issues.map((issue) => (
        <Text key={`${issue.field}-${issue.code}`} className="text-sm text-danger">
          {t(`errors.${issue.code}`, { ...issue.meta })}
        </Text>
      ))}
    </View>
  );
};
