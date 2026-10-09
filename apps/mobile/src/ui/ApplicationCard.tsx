import type { ApplicationSummary } from "@applytrack/core";
import { STALE_AFTER_DAYS } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import { createFormatter, statusTone } from "@applytrack/presentation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useIsDark } from "../theme/theme";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";
import { Text } from "./Text";
import { CARD_SHADOW, TONE_CLASSES } from "./tone";

const MAX_TAGS = 3;

const Pill = ({
  label,
  tone = "muted",
}: {
  readonly label: string;
  readonly tone?: "muted" | "warning";
}) => (
  <View
    className={`rounded-full px-2 py-0.5 ${tone === "warning" ? "bg-warning-soft" : "bg-surface-muted"}`}
  >
    <Text className={`text-xs ${tone === "warning" ? "text-warning" : "text-ink-muted"}`}>
      {label}
    </Text>
  </View>
);

export const ApplicationCard = ({
  application,
  showStatus,
  onPress,
  onMove,
}: {
  readonly application: ApplicationSummary;
  readonly showStatus: boolean;
  readonly onPress: () => void;
  readonly onMove?: (() => void) | undefined;
}) => {
  const { t, i18n } = useTranslation();
  const dark = useIsDark();
  const format = useMemo(() => createFormatter(i18n.language), [i18n.language]);
  const status = t(`status.${application.status}`);
  const extraTags = application.tags.length - MAX_TAGS;

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

  const muted = COLORS[dark ? "dark" : "light"]["ink-muted"];
  const tone = TONE_CLASSES[statusTone(application.status)];

  return (
    <View
      className={`relative rounded-2xl border border-t-[3px] border-border bg-surface ${tone.borderTop}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={onMove ? t("mobile.moveHint") : undefined}
        onPress={onPress}
        onLongPress={onMove}
        className={`gap-3 rounded-2xl p-4 active:opacity-80 ${onMove ? "pr-14" : ""}`}
      >
        <View className="flex-row items-center gap-3">
          <Avatar company={application.company} status={application.status} />
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-base font-semibold text-ink">
              {application.company}
            </Text>
            <Text numberOfLines={2} className="text-sm text-ink-muted">
              {application.position}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {showStatus && <StatusBadge status={application.status} size="xs" />}
          <Pill label={t(`workMode.${application.workMode}`)} />
          {application.archived && <Pill label={t("card.archived")} />}
          {application.stale && (
            <View
              className="flex-row items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5"
              accessibilityHint={t("card.staleHint", { days: STALE_AFTER_DAYS })}
            >
              <Icon name="clock" size={12} color={COLORS[dark ? "dark" : "light"].warning} />
              <Text className="text-xs font-medium text-warning">{t("card.stale")}</Text>
            </View>
          )}
        </View>
        {application.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1">
            {application.tags.slice(0, MAX_TAGS).map((tag) => (
              <Text
                key={tag}
                className="overflow-hidden rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </Text>
            ))}
            {extraTags > 0 && (
              <Text className="px-1 py-0.5 text-xs text-ink-muted">
                {t("card.moreTags", { count: extraTags })}
              </Text>
            )}
          </View>
        )}
        <Text className="text-xs text-ink-muted">
          {t("card.updated", { when: format.daysAgo(application.daysSinceUpdate) })}
        </Text>
      </Pressable>
      {onMove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("board.moveTo", { company: application.company })}
          onPress={onMove}
          className="absolute right-1 top-1 size-11 items-center justify-center rounded-full active:bg-surface-muted"
        >
          <Icon name="more" size={20} color={muted} />
        </Pressable>
      )}
    </View>
  );
};
