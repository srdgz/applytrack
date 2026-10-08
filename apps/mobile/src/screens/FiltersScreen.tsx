import type { ArchivedFilter } from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  ARCHIVED_FILTERS,
  WORK_MODES,
} from "@applytrack/core";
import { countActiveFilters } from "@applytrack/presentation";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useFilters } from "../shell/filters";
import { useUseCases } from "../shell/session";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Screen } from "../ui/Screen";

const toggle = <T,>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const Group = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <View className="gap-2">
    <Text accessibilityRole="header" className="text-base font-semibold text-ink">
      {title}
    </Text>
    <View className="flex-row flex-wrap gap-2">{children}</View>
  </View>
);

export const FiltersScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { listTags } = useUseCases();
  const { filters, update } = useFilters();
  const [tags, setTags] = useState<readonly string[]>([]);
  const active = countActiveFilters({ ...filters, text: "" });

  useEffect(() => {
    void listTags.execute().then((result) => {
      if (result.ok) setTags(result.value);
    });
  }, [listTags]);

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
          {t("filters.title")}
        </Text>
        <View className="flex-row gap-3">
          {active > 0 && (
            <Button
              variant="link"
              label={t("filters.clear", { count: active })}
              onPress={() => {
                update({
                  statuses: [],
                  workModes: [],
                  sources: [],
                  tags: [],
                  archived: "exclude",
                });
              }}
            />
          )}
          <Button
            variant="link"
            label={t("mobile.done")}
            onPress={() => {
              router.back();
            }}
          />
        </View>
      </View>

      <Group title={t("filters.status")}>
        {APPLICATION_STATUSES.map((status) => (
          <Chip
            key={status}
            role="checkbox"
            label={t(`status.${status}`)}
            selected={filters.statuses.includes(status)}
            onPress={() => {
              update({ statuses: toggle(filters.statuses, status) });
            }}
          />
        ))}
      </Group>

      <Group title={t("filters.workMode")}>
        {WORK_MODES.map((mode) => (
          <Chip
            key={mode}
            role="checkbox"
            label={t(`workMode.${mode}`)}
            selected={filters.workModes.includes(mode)}
            onPress={() => {
              update({ workModes: toggle(filters.workModes, mode) });
            }}
          />
        ))}
      </Group>

      <Group title={t("filters.source")}>
        {APPLICATION_SOURCES.map((source) => (
          <Chip
            key={source}
            role="checkbox"
            label={t(`source.${source}`)}
            selected={filters.sources.includes(source)}
            onPress={() => {
              update({ sources: toggle(filters.sources, source) });
            }}
          />
        ))}
      </Group>

      <Group title={t("filters.tags")}>
        {tags.length === 0 ? (
          <Text className="text-sm text-ink-muted">{t("filters.noTags")}</Text>
        ) : (
          tags.map((tag) => (
            <Chip
              key={tag}
              role="checkbox"
              label={tag}
              selected={filters.tags.includes(tag)}
              onPress={() => {
                update({ tags: toggle(filters.tags, tag) });
              }}
            />
          ))
        )}
      </Group>

      <Group title={t("filters.archived")}>
        {ARCHIVED_FILTERS.map((option: ArchivedFilter) => (
          <Chip
            key={option}
            role="radio"
            label={t(`filters.archivedOptions.${option}`)}
            selected={filters.archived === option}
            onPress={() => {
              update({ archived: option });
            }}
          />
        ))}
      </Group>
    </Screen>
  );
};
