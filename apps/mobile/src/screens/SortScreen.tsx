import { SORT_DIRECTIONS, SORT_FIELDS } from "@applytrack/core";
import { defaultDirection } from "@applytrack/presentation";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFilters } from "../shell/filters";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";

export const SortScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { filters, update } = useFilters();

  return (
    <Screen
      footer={
        <View className="flex-1">
          <Button
            label={t("mobile.done")}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/list");
            }}
          />
        </View>
      }
    >
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t("list.sortBy")}
      </Text>

      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {SORT_FIELDS.map((field) => (
          <Chip
            key={field}
            role="radio"
            label={t(`sort.${field}`)}
            selected={filters.sort.field === field}
            onPress={() => {
              update({ sort: { field, direction: defaultDirection(field) } });
            }}
          />
        ))}
      </View>

      <Text accessibilityRole="header" className="text-base font-semibold text-ink">
        {t("mobile.sortDirection")}
      </Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {SORT_DIRECTIONS.map((direction) => (
          <Chip
            key={direction}
            role="radio"
            label={t(`sort.${direction}`)}
            selected={filters.sort.direction === direction}
            onPress={() => {
              update({ sort: { ...filters.sort, direction } });
            }}
          />
        ))}
      </View>
    </Screen>
  );
};
