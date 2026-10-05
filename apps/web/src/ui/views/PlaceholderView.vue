<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();

const title = computed(() => (route.meta.titleKey ? t(route.meta.titleKey) : ""));
</script>

<template>
  <div class="flex flex-col gap-4 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    <p class="text-ink-muted">{{ t("placeholder.soon") }}</p>
    <RouterLink
      :to="{ name: 'board' }"
      class="text-accent font-medium underline underline-offset-2"
    >
      {{ t("placeholder.back") }}
    </RouterLink>
  </div>
</template>
