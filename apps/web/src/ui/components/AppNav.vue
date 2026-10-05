<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import type { IconName } from "./AppIcon.vue";
import AppIcon from "./AppIcon.vue";

const { t } = useI18n();

const items: readonly { name: string; icon: IconName; label: string }[] = [
  { name: "board", icon: "board", label: "nav.board" },
  { name: "list", icon: "list", label: "nav.list" },
  { name: "stats", icon: "chart", label: "nav.stats" },
  { name: "settings", icon: "settings", label: "nav.settings" },
];
</script>

<template>
  <nav :aria-label="t('nav.label')">
    <ul class="flex md:flex-col md:gap-1">
      <li v-for="item in items" :key="item.name" class="flex-1 md:flex-none">
        <RouterLink
          :to="{ name: item.name }"
          class="text-ink-muted hover:bg-surface-muted hover:text-ink flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md px-2 text-xs md:min-h-11 md:flex-row md:justify-center lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
          active-class="!text-accent font-semibold"
          :title="t(item.label)"
        >
          <AppIcon :name="item.icon" class="shrink-0" />
          <span class="md:sr-only lg:not-sr-only">{{ t(item.label) }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
