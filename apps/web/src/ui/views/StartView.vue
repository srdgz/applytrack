<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { bumpDataVersion } from "../../composables/useDataVersion";
import { useUseCases } from "../../di/use-cases";

const { t, locale } = useI18n();
const { startDemo } = useUseCases();
const router = useRouter();

const starting = ref(false);

const tryDemo = async () => {
  starting.value = true;
  try {
    await startDemo.execute(locale.value);
    bumpDataVersion();
    await router.push({ name: "board" });
  } finally {
    starting.value = false;
  }
};
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-4">
    <section class="w-full max-w-lg text-center">
      <p class="text-accent text-sm font-semibold tracking-wide uppercase">{{ t("app.name") }}</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {{ t("start.title") }}
      </h1>
      <p class="text-ink-muted mt-4 text-pretty">{{ t("start.description") }}</p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          class="bg-accent text-accent-ink min-h-12 rounded-md px-6 font-semibold disabled:opacity-70"
          :disabled="starting"
          :aria-busy="starting"
          @click="tryDemo"
        >
          {{ starting ? t("start.starting") : t("start.tryDemo") }}
        </button>
        <button
          type="button"
          class="border-border text-ink-muted min-h-12 rounded-md border px-6 font-medium"
          disabled
          aria-describedby="sign-in-soon"
        >
          {{ t("start.signIn") }}
        </button>
      </div>
      <p class="text-ink-muted mt-3 text-sm">{{ t("start.tryDemoHint") }}</p>
      <p id="sign-in-soon" class="text-ink-muted mt-1 text-xs">
        {{ t("start.signIn") }}: {{ t("start.signInSoon") }}
      </p>
    </section>
  </main>
</template>
