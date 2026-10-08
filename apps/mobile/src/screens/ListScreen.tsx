import type { ApplicationSummary } from "@applytrack/core";
import { DEFAULT_LIMIT, DEFAULT_SORT } from "@applytrack/core";
import { countActiveFilters, toApplicationQuery } from "@applytrack/presentation";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useFilters } from "../shell/filters";
import { ApplicationRow, ApplicationTableHeader, WIDE_TABLE } from "../ui/ApplicationTable";
import { Button } from "../ui/Button";
import { Fab } from "../ui/Fab";
import { CardSkeleton, ResultState } from "../ui/ResultState";
import { Toolbar, ToolbarButton } from "../ui/Toolbar";
import { useApplicationSearch } from "./useApplicationSearch";

export const ListScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_TABLE;
  const { filters, update, clear } = useFilters();
  const query = useMemo(() => toApplicationQuery(filters), [filters]);
  const search = useApplicationSearch(query, DEFAULT_LIMIT);
  const sorted =
    filters.sort.field !== DEFAULT_SORT.field || filters.sort.direction !== DEFAULT_SORT.direction;

  const empty = () => {
    if (search.status === "error") {
      return <ResultState kind="error" onAction={() => void search.reload()} />;
    }
    if (search.status === "loading") {
      return search.showSkeleton ? (
        <View className="gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : null;
    }
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
  };

  const footer =
    search.status === "ready" && search.total > 0 ? (
      <View className="items-center gap-2 py-4">
        {search.loadingMore && <ActivityIndicator accessibilityLabel={t("mobile.loadingMore")} />}
        <Text className="text-sm text-ink-muted">
          {t("list.showing", { shown: search.items.length, total: search.total })}
        </Text>
        {search.items.length < search.total && !search.loadingMore && (
          <Button
            variant="link"
            label={t("list.loadMore")}
            onPress={() => void search.loadMore()}
          />
        )}
      </View>
    ) : null;

  const renderItem = ({ item }: { item: ApplicationSummary }) => (
    <ApplicationRow
      application={item}
      wide={wide}
      onPress={() => {
        router.push(`/applications/${item.id}`);
      }}
    />
  );

  const hasRows = search.status === "ready" && search.items.length > 0;

  return (
    <View className="flex-1 gap-3 bg-canvas px-4 pt-4">
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t("list.title")}
      </Text>
      <Toolbar>
        <ToolbarButton
          label={t("mobile.sort")}
          active={sorted}
          onPress={() => {
            router.push("/sort");
          }}
        />
      </Toolbar>
      <FlatList
        testID="applications-list"
        data={search.status === "ready" ? search.items : []}
        keyExtractor={({ id }) => id}
        renderItem={renderItem}
        contentContainerClassName="pb-24"
        className="overflow-hidden rounded-lg border border-border"
        style={hasRows ? undefined : { borderWidth: 0 }}
        ListHeaderComponent={
          hasRows ? (
            <ApplicationTableHeader
              wide={wide}
              sort={filters.sort}
              onSort={(sort) => {
                update({ sort });
              }}
            />
          ) : null
        }
        stickyHeaderIndices={hasRows ? [0] : undefined}
        ListEmptyComponent={empty()}
        ListFooterComponent={footer}
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={search.refreshing} onRefresh={() => void search.refresh()} />
        }
      />
      <Fab
        label={t("nav.newApplication")}
        onPress={() => {
          router.push("/applications/new");
        }}
      />
    </View>
  );
};
