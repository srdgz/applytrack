import { COLORS } from "@applytrack/design-tokens";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useIsDark } from "../theme/theme";

const DEBOUNCE_MS = 300;

export const SearchBar = ({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (text: string) => void;
}) => {
  const { t } = useTranslation();
  const dark = useIsDark();
  const colors = COLORS[dark ? "dark" : "light"];
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const change = (next: string) => {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      latest.current(next.trim());
    }, DEBOUNCE_MS);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setText("");
    latest.current("");
  };

  return (
    <View className="min-h-11 flex-1 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3">
      <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"
          stroke={colors["ink-muted"]}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <TextInput
        value={text}
        onChangeText={change}
        accessibilityLabel={t("filters.search")}
        placeholder={t("filters.searchPlaceholder")}
        placeholderTextColor={colors["ink-muted"]}
        returnKeyType="search"
        autoCorrect={false}
        className="min-h-11 flex-1 text-base text-ink"
      />
      {text !== "" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mobile.clearSearch")}
          onPress={clear}
          className="size-11 items-center justify-center"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
            <Path
              d="M18 6 6 18M6 6l12 12"
              stroke={colors["ink-muted"]}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      )}
    </View>
  );
};
