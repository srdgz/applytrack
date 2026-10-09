<script setup lang="ts">
import type { ApplicationStatus } from "@applytrack/core";
import { statusTone } from "@applytrack/presentation";
import { useI18n } from "vue-i18n";

defineProps<{ status: ApplicationStatus }>();

const { t } = useI18n();
</script>

<template>
  <span
    :data-tone="statusTone(status)"
    class="inline-flex items-center gap-1.5 rounded-full bg-(--tone-soft) px-2 py-0.5 text-xs font-medium text-(--tone)"
  >
    <span aria-hidden="true" class="size-1.5 rounded-full bg-(--tone)" />
    {{ t(`status.${status}`) }}
  </span>
</template>
