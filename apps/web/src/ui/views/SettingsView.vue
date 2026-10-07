<script setup lang="ts">
import type { ThemePreference } from "@applytrack/core";
import { isLocale, SUPPORTED_LOCALES } from "@applytrack/i18n";
import { THEME_PREFERENCES } from "@applytrack/core";
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";

import { useAccount } from "../../composables/useAccount";
import { useDemoActions } from "../../composables/useDemoActions";
import { usePreferences } from "../../composables/usePreferences";

const { t } = useI18n();
const { reset, exit } = useDemoActions();
const { preferences, update } = usePreferences();
const { account, signOut } = useAccount();

const onLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (isLocale(value)) void update({ locale: value });
};

const chooseTheme = async (theme: ThemePreference) => {
  await update({ theme });
  await nextTick();
  document.getElementById(`theme-${theme}`)?.focus();
};

const onThemeKeydown = (event: KeyboardEvent) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (step === undefined) return;
  event.preventDefault();
  const index = THEME_PREFERENCES.indexOf(preferences.value.theme);
  const next = THEME_PREFERENCES.at((index + step) % THEME_PREFERENCES.length);
  if (next) void chooseTheme(next);
};
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-6 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ t("settings.title") }}</h1>

    <section class="border-border bg-surface rounded-lg border p-4">
      <label for="locale" class="font-semibold">{{ t("settings.language") }}</label>
      <select
        id="locale"
        class="border-border bg-surface mt-2 block min-h-10 w-full rounded-md border px-3 sm:w-64"
        :value="preferences.locale"
        @change="onLocaleChange"
      >
        <option v-for="option in SUPPORTED_LOCALES" :key="option" :value="option" :lang="option">
          {{ t(`settings.languageNames.${option}`) }}
        </option>
      </select>
    </section>

    <section class="border-border bg-surface rounded-lg border p-4">
      <h2 id="theme-title" class="font-semibold">{{ t("settings.theme") }}</h2>
      <div
        role="radiogroup"
        aria-labelledby="theme-title"
        class="bg-surface-muted mt-2 inline-flex flex-wrap gap-1 rounded-md p-1"
        @keydown="onThemeKeydown"
      >
        <button
          v-for="option in THEME_PREFERENCES"
          :id="`theme-${option}`"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="preferences.theme === option"
          :tabindex="preferences.theme === option ? 0 : -1"
          class="min-h-10 rounded px-4 text-sm font-medium"
          :class="
            preferences.theme === option
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          "
          @click="chooseTheme(option)"
        >
          {{ t(`settings.themes.${option}`) }}
        </button>
      </div>
    </section>

    <section
      v-if="account"
      class="border-border bg-surface rounded-lg border p-4"
      aria-labelledby="account-title"
    >
      <h2 id="account-title" class="font-semibold">{{ t("settings.accountTitle") }}</h2>
      <p class="text-ink-muted mt-1 text-sm break-words">
        {{ t("auth.signedInAs", { email: account.email }) }}
      </p>
      <button
        type="button"
        class="border-border hover:bg-surface-muted mt-4 min-h-10 rounded-md border px-4 text-sm font-medium"
        @click="signOut"
      >
        {{ t("auth.signOut") }}
      </button>
    </section>

    <section
      v-else
      class="border-border bg-surface rounded-lg border p-4"
      aria-labelledby="demo-title"
    >
      <h2 id="demo-title" class="font-semibold">{{ t("settings.demoTitle") }}</h2>
      <p class="text-ink-muted mt-1 text-sm">{{ t("settings.demoDescription") }}</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          class="border-border hover:bg-surface-muted min-h-10 rounded-md border px-4 text-sm font-medium"
          @click="reset"
        >
          {{ t("demo.reset") }}
        </button>
        <button
          type="button"
          class="border-border hover:bg-surface-muted min-h-10 rounded-md border px-4 text-sm font-medium"
          @click="exit"
        >
          {{ t("demo.exit") }}
        </button>
      </div>
    </section>
  </div>
</template>
