<script setup lang="ts">
import type { SortField } from "@applytrack/core";
import { DEFAULT_LIMIT, SORT_FIELDS } from "@applytrack/core";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import { useFilters } from "../../composables/useFilters";
import { useFormat } from "../../composables/useFormat";
import { usePagedSearch } from "../../composables/usePagedSearch";
import { defaultDirection, toApplicationQuery } from "@applytrack/presentation";
import AppIcon from "../components/AppIcon.vue";
import ApplicationCard from "../components/ApplicationCard.vue";
import FilterBar from "../components/FilterBar.vue";
import ResultState from "../components/ResultState.vue";
import StatusBadge from "../components/StatusBadge.vue";

const { t } = useI18n();
const { filters, update } = useFilters();
const { daysAgo, calendarDate } = useFormat();

const search = usePagedSearch(() => toApplicationQuery(filters.value), DEFAULT_LIMIT);
const { items, total, status, showSkeleton, hasMore, loadingMore } = search;

const sortBy = (field: SortField) => {
  const current = filters.value.sort;
  const direction =
    current.field === field
      ? current.direction === "asc"
        ? "desc"
        : "asc"
      : defaultDirection(field);
  void update({ sort: { field, direction } });
};

const ariaSort = (field: SortField) => {
  const { sort } = filters.value;
  if (sort.field !== field) return undefined;
  return sort.direction === "asc" ? "ascending" : "descending";
};

const onSortSelect = (event: Event) => {
  const [field, direction] = (event.target as HTMLSelectElement).value.split(":") as [
    SortField,
    "asc" | "desc",
  ];
  void update({ sort: { field, direction } });
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ t("list.title") }}</h1>
    <FilterBar>
      <label class="flex items-center gap-2 text-sm md:hidden">
        <span class="sr-only">{{ t("list.sortBy") }}</span>
        <select
          class="border-border bg-surface min-h-10 rounded-md border px-2"
          :value="`${filters.sort.field}:${filters.sort.direction}`"
          @change="onSortSelect"
        >
          <template v-for="field in SORT_FIELDS" :key="field">
            <option :value="`${field}:asc`">{{ t(`sort.${field}`) }} · {{ t("sort.asc") }}</option>
            <option :value="`${field}:desc`">
              {{ t(`sort.${field}`) }} · {{ t("sort.desc") }}
            </option>
          </template>
        </select>
      </label>
    </FilterBar>

    <ResultState
      :status="status"
      :show-skeleton="showSkeleton"
      :total="total"
      :has-items="items.length > 0"
      @retry="search.reload"
    >
      <ol class="flex flex-col gap-3 md:hidden">
        <li v-for="application in items" :key="application.id">
          <ApplicationCard :application="application" show-status />
        </li>
      </ol>

      <div class="border-border bg-surface hidden overflow-x-auto rounded-lg border md:block">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              t("list.caption")
            }}
          </caption>
          <thead class="bg-surface-muted text-ink-muted">
            <tr>
              <th scope="col" class="px-3 py-2 font-medium" :aria-sort="ariaSort('company')">
                <button
                  type="button"
                  class="hover:text-ink inline-flex items-center gap-1"
                  @click="sortBy('company')"
                >
                  <span class="lg:hidden">{{ t("list.columns.companyAndPosition") }}</span>
                  <span class="hidden lg:inline">{{ t("list.columns.company") }}</span>
                  <AppIcon
                    v-if="ariaSort('company')"
                    :name="filters.sort.direction === 'asc' ? 'arrowUp' : 'arrowDown'"
                    class="size-4"
                  />
                </button>
              </th>
              <th scope="col" class="hidden px-3 py-2 font-medium lg:table-cell">
                {{ t("list.columns.position") }}
              </th>
              <th scope="col" class="px-3 py-2 font-medium">{{ t("list.columns.status") }}</th>
              <th scope="col" class="hidden px-3 py-2 font-medium lg:table-cell">
                {{ t("list.columns.workMode") }}
              </th>
              <th scope="col" class="hidden px-3 py-2 font-medium lg:table-cell">
                {{ t("list.columns.source") }}
              </th>
              <th
                scope="col"
                class="hidden px-3 py-2 font-medium lg:table-cell"
                :aria-sort="ariaSort('appliedAt')"
              >
                <button
                  type="button"
                  class="hover:text-ink inline-flex items-center gap-1"
                  @click="sortBy('appliedAt')"
                >
                  {{ t("list.columns.appliedAt") }}
                  <AppIcon
                    v-if="ariaSort('appliedAt')"
                    :name="filters.sort.direction === 'asc' ? 'arrowUp' : 'arrowDown'"
                    class="size-4"
                  />
                </button>
              </th>
              <th scope="col" class="px-3 py-2 font-medium" :aria-sort="ariaSort('updatedAt')">
                <button
                  type="button"
                  class="hover:text-ink inline-flex items-center gap-1"
                  @click="sortBy('updatedAt')"
                >
                  {{ t("list.columns.updatedAt") }}
                  <AppIcon
                    v-if="ariaSort('updatedAt')"
                    :name="filters.sort.direction === 'asc' ? 'arrowUp' : 'arrowDown'"
                    class="size-4"
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody class="divide-border divide-y">
            <tr v-for="application in items" :key="application.id" class="hover:bg-surface-muted">
              <td class="px-3 py-2">
                <RouterLink
                  :to="{ name: 'application', params: { id: application.id } }"
                  class="font-medium hover:underline"
                >
                  {{ application.company }}
                </RouterLink>
                <p class="text-ink-muted lg:hidden">{{ application.position }}</p>
              </td>
              <td class="hidden px-3 py-2 lg:table-cell">{{ application.position }}</td>
              <td class="px-3 py-2">
                <span class="flex flex-wrap items-center gap-1.5">
                  <StatusBadge :status="application.status" />
                  <span
                    v-if="application.archived"
                    class="border-border text-ink-muted rounded-full border px-2 py-0.5 text-xs font-medium"
                  >
                    {{ t("card.archived") }}
                  </span>
                </span>
              </td>
              <td class="hidden px-3 py-2 lg:table-cell">
                {{ t(`workMode.${application.workMode}`) }}
              </td>
              <td class="hidden px-3 py-2 lg:table-cell">
                {{ t(`source.${application.source}`) }}
              </td>
              <td class="hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                {{ application.appliedAt ? calendarDate(application.appliedAt) : t("list.noDate") }}
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                {{ daysAgo(application.daysSinceUpdate) }}
                <span v-if="application.stale" class="text-warning ml-1 font-medium">
                  · {{ t("card.stale") }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col items-center gap-2 py-2">
        <p class="text-ink-muted text-sm">
          {{ t("list.showing", { shown: items.length, total }) }}
        </p>
        <button
          v-if="hasMore"
          type="button"
          class="border-border bg-surface hover:bg-surface-muted min-h-10 rounded-md border px-4 text-sm font-medium"
          :aria-busy="loadingMore"
          :disabled="loadingMore"
          @click="search.loadMore"
        >
          {{ t("list.loadMore") }}
        </button>
      </div>
    </ResultState>
  </div>
</template>
