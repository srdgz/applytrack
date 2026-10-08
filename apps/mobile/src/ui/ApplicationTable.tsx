import type { ApplicationSort, ApplicationSummary, SortField } from "@applytrack/core";
import { STALE_AFTER_DAYS } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import { createFormatter, defaultDirection } from "@applytrack/presentation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useIsDark } from "../theme/theme";
import { Icon } from "./Icon";

export const WIDE_TABLE = 768;

const STATUS_WIDTH = "w-[84px]";
const DATE_WIDTH = "w-[72px]";
const MODE_WIDTH = "w-[76px]";

const useFormatter = () => {
  const { i18n } = useTranslation();
  return useMemo(() => createFormatter(i18n.language), [i18n.language]);
};

const SortableHeader = ({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  readonly label: string;
  readonly field: SortField;
  readonly sort: ApplicationSort;
  readonly onSort: (sort: ApplicationSort) => void;
  readonly className: string;
}) => {
  const { t } = useTranslation();
  const active = sort.field === field;
  const arrow = active ? (sort.direction === "asc" ? " ↑" : " ↓") : "";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("list.sortByColumn", { column: label })}
      accessibilityState={{ selected: active }}
      onPress={() => {
        onSort({
          field,
          direction: active ? (sort.direction === "asc" ? "desc" : "asc") : defaultDirection(field),
        });
      }}
      className={`min-h-11 justify-center ${className}`}
    >
      <Text className={`text-xs ${active ? "font-semibold text-ink" : "text-ink-muted"}`}>
        {label}
        {arrow}
      </Text>
    </Pressable>
  );
};

const PlainHeader = ({
  label,
  className,
}: {
  readonly label: string;
  readonly className: string;
}) => (
  <View className={`min-h-11 justify-center ${className}`}>
    <Text className="text-xs text-ink-muted">{label}</Text>
  </View>
);

export const ApplicationTableHeader = ({
  wide,
  sort,
  onSort,
}: {
  readonly wide: boolean;
  readonly sort: ApplicationSort;
  readonly onSort: (sort: ApplicationSort) => void;
}) => {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2 border-b border-border bg-surface-muted px-3">
      <SortableHeader
        label={wide ? t("list.columns.company") : t("list.columns.companyAndPosition")}
        field="company"
        sort={sort}
        onSort={onSort}
        className="flex-1"
      />
      <PlainHeader label={t("list.columns.status")} className={STATUS_WIDTH} />
      {wide && <PlainHeader label={t("list.columns.workMode")} className={MODE_WIDTH} />}
      {wide && (
        <SortableHeader
          label={t("list.columns.appliedAt")}
          field="appliedAt"
          sort={sort}
          onSort={onSort}
          className={DATE_WIDTH}
        />
      )}
      <SortableHeader
        label={t("list.columns.updatedAt")}
        field="updatedAt"
        sort={sort}
        onSort={onSort}
        className={`${DATE_WIDTH} items-end`}
      />
    </View>
  );
};

export const ApplicationRow = ({
  application,
  wide,
  onPress,
}: {
  readonly application: ApplicationSummary;
  readonly wide: boolean;
  readonly onPress: () => void;
}) => {
  const { t } = useTranslation();
  const dark = useIsDark();
  const format = useFormatter();
  const status = t(`status.${application.status}`);

  const label = [
    t("card.linkLabel", {
      company: application.company,
      position: application.position,
      status,
    }),
    application.stale ? t("card.stale") : null,
    application.archived ? t("card.archived") : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-2 border-b border-border bg-surface px-3 py-2 active:bg-surface-muted"
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink text-sm font-semibold text-ink">
            {application.company}
          </Text>
          {application.stale && (
            <View
              className="flex-row items-center gap-0.5"
              accessibilityHint={t("card.staleHint", { days: STALE_AFTER_DAYS })}
            >
              <Icon name="clock" size={11} color={COLORS[dark ? "dark" : "light"].warning} />
              <Text className="text-[11px] font-medium text-warning">{t("card.stale")}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} className="text-xs text-ink-muted">
          {application.position}
          {application.archived ? ` · ${t("card.archived")}` : ""}
        </Text>
      </View>
      <Text numberOfLines={2} className={`${STATUS_WIDTH} text-xs text-ink`}>
        {status}
      </Text>
      {wide && (
        <Text className={`${MODE_WIDTH} text-xs text-ink-muted`}>
          {t(`workMode.${application.workMode}`)}
        </Text>
      )}
      {wide && (
        <Text className={`${DATE_WIDTH} text-xs text-ink-muted`}>
          {application.appliedAt
            ? format.shortCalendarDate(application.appliedAt)
            : t("list.noDate")}
        </Text>
      )}
      <Text numberOfLines={2} className={`${DATE_WIDTH} text-right text-xs text-ink-muted`}>
        {format.daysAgo(application.daysSinceUpdate)}
      </Text>
    </Pressable>
  );
};
