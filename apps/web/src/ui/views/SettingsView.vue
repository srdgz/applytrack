<script setup lang="ts">
import { SUPPORTED_LOCALES } from "@applytrack/i18n";
import { useI18n } from "vue-i18n";

import { useDemoActions } from "../../composables/useDemoActions";
import { applyLocale } from "../../i18n";
import { useAppI18n } from "../../i18n/use-app-i18n";

const { t, locale } = useI18n();
const i18n = useAppI18n();
const { reset, exit } = useDemoActions();

const onLocaleChange = (event: Event) => {
  applyLocale(i18n, (event.target as HTMLSelectElement).value);
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
        :value="locale"
        @change="onLocaleChange"
      >
        <option v-for="option in SUPPORTED_LOCALES" :key="option" :value="option" :lang="option">
          {{ t(`settings.languageNames.${option}`) }}
        </option>
      </select>
    </section>

    <section class="border-border bg-surface rounded-lg border p-4" aria-labelledby="demo-title">
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
