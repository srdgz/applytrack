<script setup lang="ts">
import type { FieldIssue } from "@applytrack/core";
import { useI18n } from "vue-i18n";

import FieldErrors from "./FieldErrors.vue";

defineProps<{
  name: string;
  label: string;
  issues: readonly FieldIssue[];
  options: readonly { readonly value: string; readonly label: string }[];
  required?: boolean;
  placeholder?: boolean;
}>();

const model = defineModel<string>({ required: true });
defineEmits<{ blur: [] }>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="`field-${name}`" class="text-sm font-medium">
      {{ label }}<span v-if="required" aria-hidden="true" class="text-danger"> *</span>
    </label>
    <select
      :id="`field-${name}`"
      v-model="model"
      :name="name"
      :aria-required="required || undefined"
      :aria-invalid="issues.length > 0 || undefined"
      :aria-describedby="issues.length ? `error-${name}` : undefined"
      class="border-border bg-surface aria-invalid:border-danger min-h-11 rounded-md border px-3"
      @blur="$emit('blur')"
    >
      <option v-if="placeholder" value="" disabled>{{ t("form.chooseOption") }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <FieldErrors :id="`error-${name}`" :issues="issues" />
  </div>
</template>
