<script setup lang="ts">
import type { ApplicationStatus, ApplicationSummary } from "@applytrack/core";
import { STALE_AFTER_DAYS } from "@applytrack/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import { useFormat } from "../../composables/useFormat";
import AppIcon from "./AppIcon.vue";
import MoveMenu from "./MoveMenu.vue";
import StatusBadge from "./StatusBadge.vue";

const MAX_TAGS = 3;

const props = defineProps<{
  application: ApplicationSummary;
  showStatus?: boolean;
  movable?: boolean;
  draggable?: boolean;
}>();

const emit = defineEmits<{
  move: [status: ApplicationStatus];
  dragstart: [application: ApplicationSummary];
  dragend: [];
}>();

const onDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData("text/plain", props.application.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  emit("dragstart", props.application);
};

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
    class="group border-border bg-surface hover:border-accent has-[a:focus-visible]:outline-accent relative rounded-lg border p-3 shadow-xs transition-colors has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2"
    :class="{ 'cursor-grab active:cursor-grabbing': draggable }"
    :draggable="draggable ? 'true' : undefined"
    @dragstart="onDragStart"
    @dragend="emit('dragend')"
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
      <span
        v-if="application.archived"
        class="border-border text-ink-muted rounded-full border px-2 py-0.5 font-medium"
      >
        {{ t("card.archived") }}
      </span>
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

    <div class="mt-2 flex items-center justify-between gap-2">
      <p class="text-ink-muted text-xs">
        {{ t("card.updated", { when: daysAgo(application.daysSinceUpdate) }) }}
      </p>
      <MoveMenu
        v-if="movable"
        class="-mr-1 -mb-1 shrink-0"
        :company="application.company"
        :status="application.status"
        @select="emit('move', $event)"
      />
    </div>
  </article>
</template>
