<script setup lang="ts">
import type { ApplicationSummary } from "@applytrack/core";
import { STALE_AFTER_DAYS } from "@applytrack/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import { useFormat } from "../../composables/useFormat";
import AppIcon from "./AppIcon.vue";
import StatusBadge from "./StatusBadge.vue";

const MAX_TAGS = 3;

const props = defineProps<{ application: ApplicationSummary; showStatus?: boolean }>();

const { t } = useI18n();
const { daysAgo } = useFormat();

const visibleTags = computed(() => props.application.tags.slice(0, MAX_TAGS));
const hiddenTags = computed(() => props.application.tags.length - visibleTags.value.length);
const label = computed(() =>
  t("card.linkLabel", {
    company: props.application.company,
    position: props.application.position,
    status: t(`status.${props.application.status}`),
  }),
);
</script>

<template>
  <article
    class="group border-border bg-surface hover:border-accent relative rounded-lg border p-3 shadow-xs transition-colors"
  >
    <h3 class="text-ink truncate font-semibold" :title="application.company">
      <RouterLink
        :to="{ name: 'application', params: { id: application.id } }"
        :aria-label="label"
        class="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
      >
        {{ application.company }}
      </RouterLink>
    </h3>
    <p class="text-ink-muted mt-0.5 line-clamp-2 text-sm">{{ application.position }}</p>

    <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      <StatusBadge v-if="showStatus" :status="application.status" />
      <span class="bg-surface-muted text-ink-muted rounded-full px-2 py-0.5">
        {{ t(`workMode.${application.workMode}`) }}
      </span>
      <span
        v-if="application.stale"
        class="bg-warning-soft text-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
        :title="t('card.staleHint', { days: STALE_AFTER_DAYS })"
      >
        <AppIcon name="clock" class="size-3.5" />
        {{ t("card.stale") }}
      </span>
    </div>

    <ul v-if="application.tags.length" class="mt-2 flex flex-wrap gap-1 text-xs">
      <li
        v-for="tag in visibleTags"
        :key="tag"
        class="border-border text-ink-muted rounded border px-1.5"
      >
        {{ tag }}
      </li>
      <li v-if="hiddenTags > 0" class="text-ink-muted px-1">
        {{ t("card.moreTags", { count: hiddenTags }) }}
      </li>
    </ul>

    <p class="text-ink-muted mt-3 text-xs">
      {{ t("card.updated", { when: daysAgo(application.daysSinceUpdate) }) }}
    </p>
  </article>
</template>
