<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useDemoActions } from "../../composables/useDemoActions";

const { t } = useI18n();
const { reset, exit } = useDemoActions();
</script>

<template>
  <div
    class="bg-accent-soft/60 text-ink border-border flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b px-4 py-1.5 text-center text-sm"
    role="region"
    :aria-label="t('settings.demoTitle')"
  >
    <p>
      <span
        aria-hidden="true"
        class="bg-accent mr-2 inline-block size-1.5 rounded-full align-middle"
      />
      {{ t("demo.banner") }}
    </p>
    <div class="flex gap-1">
      <button
        type="button"
        class="text-accent hover:bg-accent-soft min-h-8 rounded-md px-2 font-semibold"
        @click="reset"
      >
        {{ t("demo.reset") }}
      </button>
      <button
        type="button"
        class="text-accent hover:bg-accent-soft min-h-8 rounded-md px-2 font-semibold"
        @click="exit"
      >
        {{ t("demo.exit") }}
      </button>
    </div>
  </div>
</template>
