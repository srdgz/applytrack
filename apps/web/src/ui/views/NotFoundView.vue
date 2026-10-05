<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

const { t } = useI18n();
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
    <h1 class="text-2xl font-bold">{{ t("notFound.title") }}</h1>
    <RouterLink
      :to="{ name: 'start' }"
      class="text-accent font-medium underline underline-offset-2"
    >
      {{ t("notFound.back") }}
    </RouterLink>
  </main>
</template>
