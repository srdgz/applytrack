<script setup lang="ts">
import type { FieldIssue } from "@applytrack/core";
import { useI18n } from "vue-i18n";

defineProps<{ id: string; issues: readonly FieldIssue[] }>();

const { t } = useI18n();
</script>

<template>
  <ul v-if="issues.length" :id="id" class="text-danger mt-1 flex flex-col gap-0.5 text-sm">
    <li v-for="issue in issues" :key="`${issue.field}-${issue.code}`">
      {{ t(`errors.${issue.code}`, { ...issue.meta }) }}
    </li>
  </ul>
</template>
