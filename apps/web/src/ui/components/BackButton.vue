<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { RouteLocationRaw } from "vue-router";

import { useGoBack } from "../../composables/useGoBack";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ fallback: RouteLocationRaw }>();

const { t } = useI18n();
const goBack = useGoBack();
</script>

<template>
  <button
    type="button"
    class="text-ink-muted hover:text-ink hover:bg-surface-muted -ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-md px-2 text-sm font-medium"
    @click="goBack(props.fallback)"
  >
    <AppIcon name="chevronLeft" class="size-4" />
    {{ t("nav.back") }}
  </button>
</template>
