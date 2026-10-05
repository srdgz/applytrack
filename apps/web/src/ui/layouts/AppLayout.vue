<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink, RouterView } from "vue-router";

import { useSidebar } from "../../composables/useSidebar";
import AppIcon from "../components/AppIcon.vue";
import AppNav from "../components/AppNav.vue";
import DemoBanner from "../components/DemoBanner.vue";

const { t } = useI18n();
const { collapsed, expanded, toggle } = useSidebar();
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="bg-accent text-accent-ink sr-only z-50 rounded px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {{ t("app.skipToContent") }}
    </a>

    <DemoBanner />

    <header
      class="border-border bg-surface flex items-center justify-between gap-4 border-b px-4 py-3"
    >
      <RouterLink :to="{ name: 'board' }" class="text-lg font-bold tracking-tight">
        {{ t("app.name") }}
      </RouterLink>
      <RouterLink
        :to="{ name: 'application-new' }"
        class="bg-accent text-accent-ink hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium md:inline-flex"
      >
        <AppIcon name="plus" />
        {{ t("nav.newApplication") }}
      </RouterLink>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside
        id="sidebar"
        class="border-border bg-surface hidden w-16 shrink-0 flex-col gap-2 border-r p-2 transition-[width] md:flex"
        :class="{ 'lg:w-56 lg:p-3': !collapsed }"
      >
        <button
          type="button"
          class="text-ink-muted hover:bg-surface-muted hover:text-ink hidden min-h-11 items-center gap-3 rounded-md px-3 text-sm lg:flex"
          :class="collapsed ? 'justify-center' : 'justify-start'"
          :aria-expanded="!collapsed"
          aria-controls="sidebar"
          :aria-label="collapsed ? t('nav.expand') : t('nav.collapse')"
          :title="collapsed ? t('nav.expand') : t('nav.collapse')"
          @click="toggle"
        >
          <AppIcon :name="collapsed ? 'chevronRight' : 'chevronLeft'" class="shrink-0" />
          <span v-if="!collapsed" aria-hidden="true">{{ t("nav.collapse") }}</span>
        </button>
        <AppNav variant="side" :expanded="expanded" />
      </aside>

      <main id="main" tabindex="-1" class="min-w-0 flex-1 pb-24 md:pb-0">
        <RouterView />
      </main>
    </div>

    <div
      class="border-border bg-surface fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <AppNav variant="bottom" />
    </div>

    <RouterLink
      :to="{ name: 'application-new' }"
      class="bg-accent text-accent-ink fixed right-4 bottom-20 z-30 inline-flex size-14 items-center justify-center rounded-full shadow-lg md:hidden"
      :aria-label="t('nav.newApplication')"
    >
      <AppIcon name="plus" class="size-6" />
    </RouterLink>
  </div>
</template>
