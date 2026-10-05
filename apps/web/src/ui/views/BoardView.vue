<script setup lang="ts">
import type { BoardColumnId } from "@applytrack/core";
import { DEFAULT_SORT, groupForBoard, MAX_LIMIT, statusesForColumn } from "@applytrack/core";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useFilters } from "../../composables/useFilters";
import { usePagedSearch } from "../../composables/usePagedSearch";
import { toApplicationQuery } from "../../query/url-query";
import ApplicationCard from "../components/ApplicationCard.vue";
import FilterBar from "../components/FilterBar.vue";
import ResultState from "../components/ResultState.vue";

const { t } = useI18n();
const { filters } = useFilters();

const search = usePagedSearch(
  () => ({ ...toApplicationQuery(filters.value), sort: DEFAULT_SORT }),
  MAX_LIMIT,
);
const { items, total, status, showSkeleton } = search;

const columns = computed(() => {
  const selected = filters.value.statuses;
  return groupForBoard(items.value).filter(
    ({ id }) =>
      selected.length === 0 || statusesForColumn(id).some((status) => selected.includes(status)),
  );
});

const columnTitle = (id: BoardColumnId) =>
  id === "closed" ? t("board.closed") : t(`status.${id}`);

const activeTab = ref<BoardColumnId | null>(null);
const tabs = ref<HTMLButtonElement[]>([]);

watch(
  columns,
  (current) => {
    if (current.some(({ id }) => id === activeTab.value)) return;
    activeTab.value = (current.find(({ count }) => count > 0) ?? current[0])?.id ?? null;
  },
  { immediate: true },
);

const activeColumn = computed(() => columns.value.find(({ id }) => id === activeTab.value));

const onTabKeydown = async (event: KeyboardEvent, index: number) => {
  const last = columns.value.length - 1;
  const targets: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  };
  const target = targets[event.key];
  if (target === undefined) return;
  event.preventDefault();
  activeTab.value = columns.value[target]?.id ?? activeTab.value;
  await nextTick();
  tabs.value[target]?.focus();
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ t("board.title") }}</h1>
    <FilterBar />

    <p
      v-if="total > MAX_LIMIT"
      class="bg-warning-soft text-ink rounded-md p-3 text-sm"
      role="status"
    >
      {{ t("board.tooMany", { total }) }}
    </p>

    <ResultState
      :status="status"
      :show-skeleton="showSkeleton"
      :total="total"
      :has-items="items.length > 0"
      @retry="search.reload"
    >
      <div class="md:hidden">
        <div
          role="tablist"
          :aria-label="t('board.columnsLabel')"
          class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
        >
          <button
            v-for="(column, index) in columns"
            :id="`tab-${column.id}`"
            :key="column.id"
            ref="tabs"
            type="button"
            role="tab"
            :aria-selected="column.id === activeTab"
            :aria-controls="`tabpanel-${column.id}`"
            :tabindex="column.id === activeTab ? 0 : -1"
            class="border-border aria-selected:border-accent aria-selected:bg-accent aria-selected:text-accent-ink inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium"
            @click="activeTab = column.id"
            @keydown="onTabKeydown($event, index)"
          >
            {{ columnTitle(column.id) }}
            <span class="opacity-80">{{ column.count }}</span>
          </button>
        </div>
        <div
          v-if="activeColumn"
          :id="`tabpanel-${activeColumn.id}`"
          role="tabpanel"
          :aria-labelledby="`tab-${activeColumn.id}`"
          tabindex="0"
          class="mt-2"
        >
          <ol v-if="activeColumn.count" class="flex flex-col gap-3">
            <li v-for="application in activeColumn.items" :key="application.id">
              <ApplicationCard
                :application="application"
                :show-status="activeColumn.id === 'closed'"
              />
            </li>
          </ol>
          <p v-else class="text-ink-muted py-6 text-center text-sm">{{ t("board.emptyColumn") }}</p>
        </div>
      </div>

      <div class="hidden gap-4 overflow-x-auto pb-4 md:flex lg:overflow-visible">
        <section
          v-for="column in columns"
          :key="column.id"
          :aria-labelledby="`column-${column.id}`"
          class="bg-surface-muted flex w-72 shrink-0 flex-col rounded-lg p-3 lg:w-auto lg:min-w-0 lg:flex-1"
        >
          <h2
            :id="`column-${column.id}`"
            class="mb-3 flex items-center justify-between font-semibold"
          >
            <span>{{ columnTitle(column.id) }}</span>
            <span class="bg-surface text-ink-muted rounded-full px-2 text-sm">{{
              column.count
            }}</span>
          </h2>
          <ol v-if="column.count" class="flex flex-col gap-3">
            <li v-for="application in column.items" :key="application.id">
              <ApplicationCard :application="application" :show-status="column.id === 'closed'" />
            </li>
          </ol>
          <p v-else class="text-ink-muted py-6 text-center text-sm">{{ t("board.emptyColumn") }}</p>
        </section>
      </div>
    </ResultState>
  </div>
</template>
