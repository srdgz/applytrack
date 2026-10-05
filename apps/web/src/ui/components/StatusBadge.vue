<script setup lang="ts">
import type { ApplicationStatus } from "@applytrack/core";
import { isActiveStatus } from "@applytrack/core";
import { useI18n } from "vue-i18n";

defineProps<{ status: ApplicationStatus }>();

const { t } = useI18n();
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="
      isActiveStatus(status)
        ? 'bg-accent-soft text-ink'
        : 'border-border text-ink-muted border bg-transparent'
    "
  >
    {{ t(`status.${status}`) }}
  </span>
</template>
