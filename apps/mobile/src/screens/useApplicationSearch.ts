import type { ApplicationQuery, ApplicationSummary } from "@applytrack/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo } from "react-native";

import { useUseCases } from "../shell/session";

export type SearchStatus = "loading" | "ready" | "error";

const SKELETON_DELAY_MS = 200;

export const useApplicationSearch = (query: Partial<ApplicationQuery>, pageSize: number) => {
  const { searchApplications } = useUseCases();
  const { t } = useTranslation();

  const [items, setItems] = useState<readonly ApplicationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SearchStatus>("loading");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const request = useRef(0);
  const announced = useRef<number | null>(null);
  const key = JSON.stringify(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const current = ++request.current;
      if (!silent) setStatus("loading");
      const timer = silent
        ? undefined
        : setTimeout(() => {
            if (current === request.current) setShowSkeleton(true);
          }, SKELETON_DELAY_MS);

      try {
        const result = await searchApplications.execute({
          ...queryRef.current,
          offset: 0,
          limit: pageSize,
        });
        if (current !== request.current) return;
        if (result.ok) {
          setItems(result.value.items);
          setTotal(result.value.total);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch {
        if (current === request.current) setStatus("error");
      } finally {
        if (timer) clearTimeout(timer);
        if (current === request.current) setShowSkeleton(false);
      }
    },
    [searchApplications, pageSize],
  );

  useEffect(() => {
    void load();
  }, [load, key]);

  useFocusEffect(
    useCallback(() => {
      void load({ silent: true });
    }, [load]),
  );

  useEffect(() => {
    if (status !== "ready" || announced.current === total) return;
    announced.current = total;
    AccessibilityInfo.announceForAccessibility(t("results.count", { count: total }));
  }, [status, total, t]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || status !== "ready" || items.length >= total) return;
    const current = request.current;
    setLoadingMore(true);
    try {
      const result = await searchApplications.execute({
        ...queryRef.current,
        offset: items.length,
        limit: pageSize,
      });
      if (current !== request.current || !result.ok) return;
      const known = new Set(items.map(({ id }) => id));
      setItems([...items, ...result.value.items.filter(({ id }) => !known.has(id))]);
      setTotal(result.value.total);
    } finally {
      setLoadingMore(false);
    }
  }, [items, total, status, loadingMore, searchApplications, pageSize]);

  return {
    items,
    total,
    status,
    showSkeleton,
    refreshing,
    loadingMore,
    reload: () => load(),
    refresh,
    loadMore,
  };
};
