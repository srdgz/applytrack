<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRouter } from "vue-router";

import { bumpDataVersion } from "../../composables/useDataVersion";
import { useToast } from "../../composables/useToast";
import { useUseCases } from "../../di/use-cases";
import AppLogo from "../components/AppLogo.vue";

const { t, locale } = useI18n();
const { startDemo, accountsEnabled } = useUseCases();
const router = useRouter();
const toast = useToast();

const starting = ref(false);

const tryDemo = async () => {
  starting.value = true;
  try {
    await startDemo.execute(locale.value);
    bumpDataVersion();
    toast.icon(t("notify.demoStartedTitle"), {
      description: t("notify.demoStartedDescription"),
      icon: "sparkles",
    });
    await router.push({ name: "board" });
  } finally {
    starting.value = false;
  }
};
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-4">
    <section class="w-full max-w-lg text-center">
      <AppLogo :size="56" class="text-xl" />
      <h1 class="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
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
        <RouterLink
          v-if="accountsEnabled"
          :to="{ name: 'sign-in' }"
          class="border-border hover:bg-surface-muted inline-flex min-h-12 items-center justify-center rounded-md border px-6 font-medium"
        >
          {{ t("start.signIn") }}
        </RouterLink>
        <button
          v-else
          type="button"
          class="border-border text-ink-muted min-h-12 rounded-md border px-6 font-medium"
          disabled
          aria-describedby="sign-in-unavailable"
        >
          {{ t("start.signIn") }}
        </button>
      </div>
      <p class="text-ink-muted mt-3 text-sm">{{ t("start.tryDemoHint") }}</p>
      <p v-if="!accountsEnabled" id="sign-in-unavailable" class="text-ink-muted mt-1 text-xs">
        {{ t("start.signInUnavailable") }}
      </p>
    </section>
  </main>
</template>
