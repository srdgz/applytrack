<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink, RouterView, useRoute } from "vue-router";

import { useAccount } from "../../composables/useAccount";
import { useSidebar } from "../../composables/useSidebar";
import AppIcon from "../components/AppIcon.vue";
import AppLogo from "../components/AppLogo.vue";
import AppNav from "../components/AppNav.vue";
import DemoBanner from "../components/DemoBanner.vue";

const { t } = useI18n();
const { collapsed, expanded, toggle } = useSidebar();
const route = useRoute();
const { account, signOut } = useAccount();
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="bg-accent text-accent-ink sr-only z-50 rounded px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {{ t("app.skipToContent") }}
    </a>

    <DemoBanner v-if="!account" />

    <header
      class="border-border bg-surface flex items-center justify-between gap-4 border-b px-4 py-3"
    >
      <RouterLink :to="{ name: 'board' }" class="text-lg">
        <AppLogo :size="28" />
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
        <div v-if="account" class="border-border mt-auto flex flex-col gap-1 border-t pt-2">
          <p v-if="expanded" class="text-ink-muted truncate px-3 text-xs" :title="account.email">
            {{ account.email }}
          </p>
          <button
            type="button"
            class="text-ink-muted hover:bg-surface-muted hover:text-ink flex min-h-11 items-center gap-3 rounded-md px-3 text-sm"
            :class="expanded ? 'justify-start' : 'justify-center'"
            :aria-label="expanded ? undefined : t('auth.signOut')"
            :title="expanded ? undefined : `${t('auth.signOut')} · ${account.email}`"
            @click="signOut"
          >
            <AppIcon name="logout" class="shrink-0" />
            <span v-if="expanded">{{ t("auth.signOut") }}</span>
          </button>
        </div>
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
      v-if="!route.meta.hideFab"
      :to="{ name: 'application-new' }"
      class="bg-accent text-accent-ink fixed right-4 bottom-20 z-30 inline-flex size-14 items-center justify-center rounded-full shadow-lg md:hidden"
      :aria-label="t('nav.newApplication')"
    >
      <AppIcon name="plus" class="size-6" />
    </RouterLink>
  </div>
</template>
