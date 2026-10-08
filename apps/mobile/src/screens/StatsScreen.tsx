import type { ApplicationStatus, DashboardStats } from "@applytrack/core";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@applytrack/core";
import { createFormatter } from "@applytrack/presentation";
import { useFocusEffect, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useUseCases } from "../shell/session";
import { Button } from "../ui/Button";
import { CardSkeleton, ResultState } from "../ui/ResultState";

const WIDE = 768;
const SKELETON_DELAY_MS = 200;
const WEEK_BAR_HEIGHT = 96;

type State =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly stats: DashboardStats }
  | { readonly kind: "error" };

const Block = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <View className="gap-3 rounded-lg border border-border bg-surface p-4">
    <Text accessibilityRole="header" className="text-base font-semibold text-ink">
      {title}
    </Text>
    {children}
  </View>
);

const Tile = ({
  label,
  value,
  detail,
  wide,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly wide: boolean;
}) => (
  <View
    accessible
    accessibilityLabel={`${label}: ${value}. ${detail}`}
    className={`gap-1 rounded-lg border border-border bg-surface p-4 ${wide ? "flex-1" : "w-[48%] grow"}`}
  >
    <Text className="text-sm text-ink-muted">{label}</Text>
    <Text className="text-2xl font-bold text-ink">{value}</Text>
    <Text className="text-xs text-ink-muted">{detail}</Text>
  </View>
);

const HorizontalBar = ({
  label,
  value,
  max,
}: {
  readonly label: string;
  readonly value: number;
  readonly max: number;
}) => (
  <View accessible accessibilityLabel={`${label}: ${String(value)}`} className="gap-1">
    <View className="flex-row justify-between gap-2">
      <Text className="flex-1 text-sm text-ink">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{value}</Text>
    </View>
    <View className="h-2 overflow-hidden rounded-full bg-surface-muted">
      <View
        className="h-2 rounded-full bg-accent"
        style={{ width: `${String((value / max) * 100)}%` as `${number}%` }}
      />
    </View>
  </View>
);

export const StatsScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const { getDashboardStats } = useUseCases();
  const format = useMemo(() => createFormatter(i18n.language), [i18n.language]);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    const timer = setTimeout(() => {
      if (current === request.current) setShowSkeleton(true);
    }, SKELETON_DELAY_MS);
    try {
      const result = await getDashboardStats.execute();
      if (current !== request.current) return;
      setState(result.ok ? { kind: "ready", stats: result.value } : { kind: "error" });
    } catch {
      if (current === request.current) setState({ kind: "error" });
    } finally {
      clearTimeout(timer);
      if (current === request.current) setShowSkeleton(false);
    }
  }, [getDashboardStats]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const body = (): ReactNode => {
    if (state.kind === "error") {
      return <ResultState kind="error" onAction={() => void load()} />;
    }
    if (state.kind === "loading") {
      return showSkeleton ? (
        <View className="gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : null;
    }

    const stats = state.stats;
    if (stats.total === 0) {
      return (
        <View className="items-center gap-3 rounded-lg border border-dashed border-border p-8">
          <Text className="text-center text-lg font-semibold text-ink">
            {t("stats.emptyTitle")}
          </Text>
          <Button
            variant="secondary"
            label={t("stats.emptyAction")}
            onPress={() => {
              router.push("/applications/new");
            }}
          />
        </View>
      );
    }

    const rate = (count: number) =>
      stats.sent
        ? {
            value: format.ratio(count, stats.sent),
            detail: t("stats.rateDetail", { count, total: stats.sent }),
          }
        : { value: "—", detail: t("stats.notSentYet") };

    const tiles = [
      {
        label: t("stats.active"),
        value: String(stats.active),
        detail: t("stats.activeDetail", { closed: stats.closed }),
      },
      { label: t("stats.responseRate"), ...rate(stats.responded) },
      { label: t("stats.interviewRate"), ...rate(stats.interviewed) },
      {
        label: t("stats.offers"),
        value: String(stats.offered),
        detail: stats.sent
          ? `${format.ratio(stats.offered, stats.sent)} · ${t("stats.rateDetail", { count: stats.offered, total: stats.sent })}`
          : t("stats.notSentYet"),
      },
    ];

    const weeklyMax = Math.max(1, ...stats.weekly.map(({ count }) => count));
    const statusMax = Math.max(1, ...Object.values(stats.byStatus));

    const summary = (
      <View accessibilityLabel={t("stats.summary")} className="flex-row flex-wrap gap-3">
        {tiles.map((tile) => (
          <Tile key={tile.label} {...tile} wide={wide} />
        ))}
      </View>
    );

    const weekly = (
      <Block title={t("stats.weekly")}>
        <View className="flex-row items-end gap-1">
          {stats.weekly.map((week) => {
            const date = format.shortCalendarDate(week.weekStart);
            return (
              <View
                key={week.weekStart}
                accessible
                accessibilityLabel={t("stats.weekLabel", { date, count: week.count })}
                className="flex-1 items-center gap-1"
              >
                <Text className="text-xs font-semibold text-ink">{week.count}</Text>
                <View
                  className="w-full rounded-t bg-accent"
                  style={{ height: Math.max(2, (week.count / weeklyMax) * WEEK_BAR_HEIGHT) }}
                />
                <Text className="text-center text-[11px] text-ink-muted">{date}</Text>
              </View>
            );
          })}
        </View>
      </Block>
    );

    const byStatus = (
      <Block title={t("stats.byStatus")}>
        {[
          { title: t("stats.activeGroup"), statuses: ACTIVE_STATUSES, total: stats.active },
          { title: t("stats.closedGroup"), statuses: CLOSED_STATUSES, total: stats.closed },
        ].map((group) => (
          <View key={group.title} className="gap-2">
            <Text className="text-sm font-medium text-ink-muted">
              {group.title} · {group.total}
            </Text>
            {group.statuses.map((status: ApplicationStatus) => (
              <HorizontalBar
                key={status}
                label={t(`status.${status}`)}
                value={stats.byStatus[status]}
                max={statusMax}
              />
            ))}
          </View>
        ))}
      </Block>
    );

    const bySource = (
      <Block title={t("stats.bySource")}>
        {stats.bySource.length === 0 ? (
          <Text className="text-sm text-ink-muted">{t("stats.notSentYet")}</Text>
        ) : (
          stats.bySource.map((source) => {
            const name = t(`source.${source.source}`);
            const sourceRate = format.ratio(source.responded, source.sent);
            return (
              <View
                key={source.source}
                accessible
                accessibilityLabel={`${name}: ${t("stats.sent")} ${String(source.sent)}, ${t("stats.responded")} ${String(source.responded)}, ${t("stats.rate")} ${sourceRate}`}
                className="flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-2"
              >
                <Text className="flex-1 text-sm font-medium text-ink">{name}</Text>
                <Text className="text-xs text-ink-muted">
                  {t("stats.sent")} {source.sent} · {t("stats.responded")} {source.responded} ·{" "}
                  {sourceRate}
                </Text>
              </View>
            );
          })
        )}
      </Block>
    );

    const responseTime = (
      <Block title={t("stats.responseTime")}>
        {stats.medianDaysToResponse === null ? (
          <Text className="text-sm text-ink-muted">
            {stats.sent ? t("stats.noResponses") : t("stats.notSentYet")}
          </Text>
        ) : (
          <>
            <Text className="text-2xl font-bold text-ink">
              {t("stats.medianDays", { days: stats.medianDaysToResponse })}
            </Text>
            <Text className="text-xs text-ink-muted">{t("stats.medianHint")}</Text>
          </>
        )}
      </Block>
    );

    const stale = (
      <Block title={t("stats.stale")}>
        {stats.stale.length === 0 ? (
          <Text className="text-sm text-ink-muted">{t("stats.noStale")}</Text>
        ) : (
          stats.stale.map((application) => (
            <Pressable
              key={application.id}
              accessibilityRole="button"
              accessibilityLabel={`${application.company}, ${application.position}. ${t("stats.staleDays", { days: application.daysSinceUpdate })}`}
              onPress={() => {
                router.push(`/applications/${application.id}`);
              }}
              className="min-h-11 gap-0.5 border-b border-border py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-ink">{application.company}</Text>
              <Text className="text-xs text-ink-muted">
                {application.position} ·{" "}
                {t("stats.staleDays", { days: application.daysSinceUpdate })}
              </Text>
            </Pressable>
          ))
        )}
      </Block>
    );

    return (
      <>
        {summary}
        {wide ? (
          <View className="flex-row gap-4">
            <View className="flex-1 gap-4">
              {weekly}
              {byStatus}
            </View>
            <View className="flex-1 gap-4">
              {bySource}
              {responseTime}
              {stale}
            </View>
          </View>
        ) : (
          <>
            {weekly}
            {byStatus}
            {bySource}
            {responseTime}
            {stale}
          </>
        )}
      </>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="gap-4 p-4 pb-8"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
    >
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t("stats.title")}
      </Text>
      {body()}
    </ScrollView>
  );
};
