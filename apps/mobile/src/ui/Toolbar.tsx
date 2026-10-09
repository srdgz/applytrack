import { countActiveFilters } from "@applytrack/presentation";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useFilters } from "../shell/filters";
import { SearchBar } from "./SearchBar";
import { Text } from "./Text";

export const ToolbarButton = ({
  label,
  active = false,
  onPress,
}: {
  readonly label: string;
  readonly active?: boolean;
  readonly onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    className={`min-h-11 justify-center rounded-md border px-3 ${
      active ? "border-accent bg-accent-soft" : "border-border bg-surface"
    }`}
  >
    <Text className={active ? "font-semibold text-ink" : "text-ink"}>{label}</Text>
  </Pressable>
);

export const Toolbar = ({ children }: { readonly children?: ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { filters, update } = useFilters();
  const active = countActiveFilters({ ...filters, text: "" });

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <SearchBar
          value={filters.text}
          onChange={(text) => {
            update({ text });
          }}
        />
      </View>
      <View className="flex-row flex-wrap gap-2">
        <ToolbarButton
          label={active > 0 ? t("mobile.filtersCount", { count: active }) : t("filters.open")}
          active={active > 0}
          onPress={() => {
            router.push("/filters");
          }}
        />
        {children}
      </View>
    </View>
  );
};
