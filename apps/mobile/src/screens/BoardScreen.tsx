import type { ApplicationSummary, BoardColumn, BoardColumnId } from "@applytrack/core";
import { DEFAULT_SORT, groupForBoard, MAX_LIMIT, statusesForColumn } from "@applytrack/core";
import { countActiveFilters, toApplicationQuery } from "@applytrack/presentation";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ScrollView as ScrollViewType } from "react-native";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useFilters } from "../shell/filters";
import { ApplicationCard } from "../ui/ApplicationCard";
import { Fab } from "../ui/Fab";
import { CardSkeleton, ResultState } from "../ui/ResultState";
import { Toolbar } from "../ui/Toolbar";
import { useApplicationSearch } from "./useApplicationSearch";

const WIDE = 768;

export const BoardScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { filters, clear } = useFilters();
  const query = useMemo(() => ({ ...toApplicationQuery(filters), sort: DEFAULT_SORT }), [filters]);
  const search = useApplicationSearch(query, MAX_LIMIT);
  const tabsRef = useRef<ScrollViewType>(null);
  const tabX = useRef<Partial<Record<BoardColumnId, number>>>({});

  const columns = useMemo(() => {
    const selected = filters.statuses;
    return groupForBoard(search.items).filter(
      ({ id }) =>
        selected.length === 0 || statusesForColumn(id).some((status) => selected.includes(status)),
    );
  }, [search.items, filters.statuses]);

  const [activeId, setActiveId] = useState<BoardColumnId | null>(null);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  useEffect(() => {
    const current = columns.find(({ id }) => id === activeRef.current);
    const firstWithData = columns.find(({ count }) => count > 0);
    if (current && (current.count > 0 || !firstWithData)) return;
    setActiveId((firstWithData ?? columns[0])?.id ?? null);
  }, [columns]);

  const title = (id: BoardColumnId) => (id === "closed" ? t("board.closed") : t(`status.${id}`));

  const open = (application: ApplicationSummary) => {
    router.push(`/applications/${application.id}`);
  };

  const select = (id: BoardColumnId) => {
    setActiveId(id);
    tabsRef.current?.scrollTo({ x: Math.max(0, (tabX.current[id] ?? 0) - 16), animated: true });
  };

  const refreshControl = (
    <RefreshControl refreshing={search.refreshing} onRefresh={() => void search.refresh()} />
  );

  const card = (column: BoardColumn<ApplicationSummary>) =>
    function Card({ item }: { item: ApplicationSummary }) {
      return (
        <ApplicationCard
          application={item}
          showStatus={column.id === "closed"}
          onPress={() => {
            open(item);
          }}
        />
      );
    };

  const emptyColumn = (
    <Text className="py-6 text-center text-sm text-ink-muted">{t("board.emptyColumn")}</Text>
  );

  const body = () => {
    if (search.status === "error") {
      return <ResultState kind="error" onAction={() => void search.reload()} />;
    }
    if (search.status === "loading") {
      return search.showSkeleton ? (
        <View className="gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : null;
    }
    if (search.total === 0) {
      return countActiveFilters(filters) > 0 ? (
        <ResultState kind="filtered" onAction={clear} />
      ) : (
        <ResultState
          kind="none"
          onAction={() => {
            router.push("/applications/new");
          }}
        />
      );
    }

    if (width >= WIDE) {
      return (
        <ScrollView
          horizontal
          contentContainerClassName="gap-3 pb-24"
          refreshControl={refreshControl}
        >
          {columns.map((column) => (
            <View key={column.id} className="w-[280px] gap-2">
              <Text accessibilityRole="header" className="font-semibold text-ink">
                {title(column.id)} · {column.count}
              </Text>
              <FlatList
                data={column.items}
                keyExtractor={({ id }) => id}
                renderItem={card(column)}
                contentContainerClassName="gap-3"
                ListEmptyComponent={emptyColumn}
              />
            </View>
          ))}
        </ScrollView>
      );
    }

    const active = columns.find(({ id }) => id === activeId);
    return (
      <View className="flex-1 gap-3">
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          accessibilityLabel={t("board.columnsLabel")}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerClassName="items-center gap-2 py-1"
        >
          {columns.map((column) => {
            const selected = column.id === activeId;
            return (
              <Pressable
                key={column.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${title(column.id)}, ${t("results.count", { count: column.count })}`}
                onLayout={(event) => {
                  tabX.current[column.id] = event.nativeEvent.layout.x;
                }}
                onPress={() => {
                  select(column.id);
                }}
                className={`min-h-11 flex-row items-center gap-2 rounded-full border px-4 ${
                  selected ? "border-accent bg-accent-soft" : "border-border bg-surface"
                }`}
              >
                <Text className={selected ? "font-semibold text-ink" : "text-ink-muted"}>
                  {title(column.id)}
                </Text>
                <Text className="text-xs text-ink-muted">{column.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {active && (
          <FlatList
            data={active.items}
            keyExtractor={({ id }) => id}
            renderItem={card(active)}
            contentContainerClassName="gap-3 pb-24"
            ListEmptyComponent={emptyColumn}
            refreshControl={refreshControl}
          />
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 gap-3 bg-canvas px-4 pt-4">
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t("board.title")}
      </Text>
      <Toolbar />
      {search.status === "ready" && search.total > MAX_LIMIT && (
        <Text className="rounded-md bg-warning-soft p-3 text-sm text-warning">
          {t("board.tooMany", { total: search.total })}
        </Text>
      )}
      {body()}
      <Fab
        label={t("nav.newApplication")}
        onPress={() => {
          router.push("/applications/new");
        }}
      />
    </View>
  );
};
