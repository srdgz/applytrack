<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import type { SearchStatus } from "../../composables/usePagedSearch";
import { useFilters } from "../../composables/useFilters";

defineProps<{
  status: SearchStatus;
  showSkeleton: boolean;
  total: number;
  hasItems: boolean;
}>();

defineEmits<{ retry: [] }>();

const { t } = useI18n();
const { activeCount, clear } = useFilters();
</script>

<template>
  <p class="sr-only" aria-live="polite">
    <template v-if="status === 'ready'">{{ t("results.count", { count: total }) }}</template>
  </p>

  <div v-if="status === 'loading' && showSkeleton" aria-busy="true">
    <span class="sr-only">{{ t("feedback.loading") }}</span>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      <div v-for="index in 6" :key="index" class="bg-surface-muted h-28 animate-pulse rounded-lg" />
    </div>
  </div>

  <div
    v-else-if="status === 'error'"
    class="border-border bg-surface mx-auto max-w-md rounded-lg border p-6 text-center"
    role="alert"
  >
    <h2 class="font-semibold">{{ t("feedback.errorTitle") }}</h2>
    <p class="text-ink-muted mt-1 text-sm">{{ t("feedback.errorDescription") }}</p>
    <button
      type="button"
      class="bg-accent text-accent-ink mt-4 min-h-10 rounded-md px-4 text-sm font-medium"
      @click="$emit('retry')"
    >
      {{ t("feedback.retry") }}
    </button>
  </div>

  <div
    v-else-if="status === 'ready' && total === 0"
    class="border-border mx-auto max-w-md rounded-lg border border-dashed p-8 text-center"
  >
    <template v-if="activeCount > 0">
      <h2 class="font-semibold">{{ t("empty.filteredTitle") }}</h2>
      <button
        type="button"
        class="text-accent mt-3 min-h-10 text-sm font-medium underline underline-offset-2"
        @click="clear"
      >
        {{ t("empty.filteredAction") }}
      </button>
    </template>
    <template v-else>
      <h2 class="font-semibold">{{ t("empty.noneTitle") }}</h2>
      <p class="text-ink-muted mt-1 text-sm">{{ t("empty.noneDescription") }}</p>
      <RouterLink
        :to="{ name: 'application-new' }"
        class="bg-accent text-accent-ink mt-4 inline-flex min-h-10 items-center rounded-md px-4 text-sm font-medium"
      >
        {{ t("empty.noneAction") }}
      </RouterLink>
    </template>
  </div>

  <slot v-else-if="hasItems" />
</template>
