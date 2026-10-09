<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import type { IconName } from "./AppIcon.vue";
import AppIcon from "./AppIcon.vue";

defineProps<{ variant: "bottom" | "side"; expanded?: boolean }>();

const { t } = useI18n();
const tooltipsHidden = ref(false);

const items: readonly { name: string; icon: IconName; label: string }[] = [
  { name: "board", icon: "board", label: "nav.board" },
  { name: "list", icon: "list", label: "nav.list" },
  { name: "stats", icon: "chart", label: "nav.stats" },
  { name: "settings", icon: "settings", label: "nav.settings" },
];

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") tooltipsHidden.value = true;
};

const showTooltips = () => {
  tooltipsHidden.value = false;
};
</script>

<template>
  <nav
    :aria-label="t('nav.label')"
    @keydown="onKeydown"
    @focusin="showTooltips"
    @mouseover="showTooltips"
  >
    <ul v-if="variant === 'bottom'" class="flex">
      <li v-for="item in items" :key="item.name" class="flex-1">
        <RouterLink
          :to="{ name: item.name }"
          class="group text-ink-muted hover:text-ink flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md px-2 text-xs"
          active-class="!text-accent font-semibold is-active"
        >
          <span
            class="group-[.is-active]:bg-accent-soft flex h-7 w-12 items-center justify-center rounded-full transition-colors"
          >
            <AppIcon :name="item.icon" class="shrink-0" />
          </span>
          <span>{{ t(item.label) }}</span>
        </RouterLink>
      </li>
    </ul>

    <ul v-else class="flex flex-col gap-1">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          :to="{ name: item.name }"
          class="group text-ink-muted hover:bg-surface-muted hover:text-ink relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm"
          :class="expanded ? 'justify-start' : 'justify-center'"
          active-class="!text-accent !bg-accent-soft font-semibold"
        >
          <AppIcon :name="item.icon" class="shrink-0" />
          <span :class="{ 'sr-only': !expanded }">{{ t(item.label) }}</span>
          <span
            v-if="!expanded"
            aria-hidden="true"
            class="bg-ink text-canvas pointer-events-none invisible absolute top-1/2 left-full z-40 ml-3 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg group-hover:visible group-focus-visible:visible"
            :class="{ 'invisible!': tooltipsHidden }"
          >
            {{ t(item.label) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
