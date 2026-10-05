<script setup lang="ts">
import type {
  ApplicationSource,
  ApplicationStatus,
  ArchivedFilter,
  WorkMode,
} from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  ARCHIVED_FILTERS,
  WORK_MODES,
} from "@applytrack/core";
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";

import { useFilters } from "../../composables/useFilters";
import MultiSelect from "./MultiSelect.vue";

const props = defineProps<{ layout: "bar" | "sheet"; tags: readonly string[] }>();

const { t } = useI18n();
const { filters, update } = useFilters();
const archivedId = useId();

const options = <T extends string>(values: readonly T[], prefix: string) =>
  computed(() => values.map((value) => ({ value, label: t(`${prefix}.${value}`) })));

const statusOptions = options(APPLICATION_STATUSES, "status");
const workModeOptions = options(WORK_MODES, "workMode");
const sourceOptions = options(APPLICATION_SOURCES, "source");
const tagOptions = computed(() => props.tags.map((tag) => ({ value: tag, label: tag })));
</script>

<template>
  <div :class="layout === 'bar' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-6'">
    <MultiSelect
      :layout="layout"
      :label="t('filters.status')"
      :options="statusOptions"
      :model-value="filters.statuses"
      @update:model-value="update({ statuses: $event as ApplicationStatus[] })"
    />
    <MultiSelect
      :layout="layout"
      :label="t('filters.workMode')"
      :options="workModeOptions"
      :model-value="filters.workModes"
      @update:model-value="update({ workModes: $event as WorkMode[] })"
    />
    <MultiSelect
      :layout="layout"
      :label="t('filters.source')"
      :options="sourceOptions"
      :model-value="filters.sources"
      @update:model-value="update({ sources: $event as ApplicationSource[] })"
    />
    <MultiSelect
      :layout="layout"
      :label="t('filters.tags')"
      :options="tagOptions"
      :model-value="filters.tags"
      :empty-text="t('filters.noTags')"
      @update:model-value="update({ tags: $event })"
    />
    <div :class="layout === 'bar' ? 'flex items-center gap-2' : 'flex flex-col gap-2'">
      <label :for="archivedId" :class="layout === 'bar' ? 'sr-only' : 'text-sm font-semibold'">
        {{ t("filters.archived") }}
      </label>
      <select
        :id="archivedId"
        class="border-border bg-surface min-h-10 rounded-md border px-3 py-2 text-sm"
        :value="filters.archived"
        @change="update({ archived: ($event.target as HTMLSelectElement).value as ArchivedFilter })"
      >
        <option v-for="value in ARCHIVED_FILTERS" :key="value" :value="value">
          {{ t(`filters.archivedOptions.${value}`) }}
        </option>
      </select>
    </div>
  </div>
</template>
