import type { ApplicationQuery, ApplicationSummary } from "@applytrack/core";
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { useDataVersion } from "./useDataVersion";

export type SearchStatus = "loading" | "ready" | "error";

const SKELETON_DELAY_MS = 200;

export const usePagedSearch = (query: () => Partial<ApplicationQuery>, pageSize: number) => {
  const { searchApplications } = useUseCases();
  const router = useRouter();
  const dataVersion = useDataVersion();

  const items = shallowRef<readonly ApplicationSummary[]>([]);
  const total = ref(0);
  const status = ref<SearchStatus>("loading");
  const showSkeleton = ref(false);
  const loadingMore = ref(false);

  let request = 0;
  let skeletonTimer: ReturnType<typeof setTimeout> | undefined;

  const fetchPage = async (offset: number) => {
    const result = await searchApplications.execute({ ...query(), offset, limit: pageSize });
    if (!result.ok && result.error.code === "UNAUTHENTICATED") {
      await router.replace({ name: "start" });
    }
    return result;
  };

  const load = async () => {
    const current = ++request;
    status.value = "loading";
    clearTimeout(skeletonTimer);
    skeletonTimer = setTimeout(() => {
      showSkeleton.value = status.value === "loading";
    }, SKELETON_DELAY_MS);

    try {
      const result = await fetchPage(0);
      if (current !== request) return;
      if (result.ok) {
        items.value = result.value.items;
        total.value = result.value.total;
        status.value = "ready";
      } else {
        status.value = "error";
      }
    } catch {
      if (current === request) status.value = "error";
    } finally {
      if (current === request) {
        clearTimeout(skeletonTimer);
        showSkeleton.value = false;
      }
    }
  };

  const loadMore = async () => {
    if (loadingMore.value || items.value.length >= total.value) return;
    const current = request;
    loadingMore.value = true;
    try {
      const result = await fetchPage(items.value.length);
      if (current === request && result.ok) {
        const known = new Set(items.value.map(({ id }) => id));
        items.value = [...items.value, ...result.value.items.filter(({ id }) => !known.has(id))];
        total.value = result.value.total;
      }
    } finally {
      loadingMore.value = false;
    }
  };

  watch([query, dataVersion], () => void load(), { immediate: true, deep: true });
  onScopeDispose(() => {
    clearTimeout(skeletonTimer);
  });

  return {
    items,
    total,
    status,
    showSkeleton,
    loadingMore,
    hasMore: computed(() => items.value.length < total.value),
    reload: load,
    loadMore,
  };
};
