<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRouter } from "vue-router";

import { useToast } from "../../composables/useToast";
import { useUseCases } from "../../di/use-cases";

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const { account } = useUseCases();

onMounted(async () => {
  if (!account) return;
  toast.success(t("auth.signedInTitle", { email: account.email }));
  await router.replace({ name: "board" });
});
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-4">
    <section v-if="account" class="text-center" aria-live="polite">
      <p class="text-ink-muted">{{ t("auth.callbackTitle") }}</p>
    </section>
    <section
      v-else
      class="border-border bg-surface w-full max-w-md rounded-lg border p-6"
      aria-labelledby="callback-title"
    >
      <h1 id="callback-title" class="text-2xl font-bold tracking-tight text-balance">
        {{ t("auth.callbackFailedTitle") }}
      </h1>
      <p class="text-ink-muted mt-2 text-pretty">{{ t("auth.callbackFailedDescription") }}</p>
      <RouterLink
        :to="{ name: 'sign-in' }"
        class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 mt-6 inline-flex min-h-12 items-center rounded-md px-6 font-semibold"
      >
        {{ t("auth.tryAgain") }}
      </RouterLink>
    </section>
  </main>
</template>
