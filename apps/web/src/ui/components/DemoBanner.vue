<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useDemoActions } from "../../composables/useDemoActions";

const { t } = useI18n();
const { reset, exit } = useDemoActions();
</script>

<template>
  <div
    class="bg-accent-soft text-ink flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-center text-sm"
    role="region"
    :aria-label="t('settings.demoTitle')"
  >
    <p>{{ t("demo.banner") }}</p>
    <div class="flex gap-3">
      <button type="button" class="font-medium underline underline-offset-2" @click="reset">
        {{ t("demo.reset") }}
      </button>
      <button type="button" class="font-medium underline underline-offset-2" @click="exit">
        {{ t("demo.exit") }}
      </button>
    </div>
  </div>
</template>
