<script setup lang="ts">
import type { FieldIssue } from "@applytrack/core";
import { computed } from "vue";

import FieldErrors from "./FieldErrors.vue";

const props = withDefaults(
  defineProps<{
    name: string;
    label: string;
    issues: readonly FieldIssue[];
    type?: string;
    required?: boolean;
    maxlength?: number | undefined;
    placeholder?: string | undefined;
    hint?: string | undefined;
    max?: string | undefined;
    autocomplete?: string;
    inputmode?: "text" | "email" | "numeric" | undefined;
  }>(),
  {
    type: "text",
    autocomplete: "off",
    maxlength: undefined,
    placeholder: undefined,
    hint: undefined,
    max: undefined,
    inputmode: undefined,
  },
);

const model = defineModel<string>({ required: true });
defineEmits<{ blur: [] }>();

const id = computed(() => `field-${props.name}`);
const describedBy = computed(
  () =>
    [props.hint ? `hint-${props.name}` : "", props.issues.length ? `error-${props.name}` : ""]
      .filter(Boolean)
      .join(" ") || undefined,
);
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-sm font-medium">
      {{ label }}<span v-if="required" aria-hidden="true" class="text-danger"> *</span>
    </label>
    <input
      :id="id"
      :value="model"
      :type="type"
      :name="name"
      :maxlength="maxlength"
      :max="max"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-required="required || undefined"
      :aria-invalid="issues.length > 0 || undefined"
      :aria-describedby="describedBy"
      class="border-border bg-surface placeholder:text-ink-muted aria-invalid:border-danger min-h-11 rounded-md border px-3"
      @input="model = ($event.target as HTMLInputElement).value"
      @blur="$emit('blur')"
    />
    <p v-if="hint" :id="`hint-${name}`" class="text-ink-muted text-sm">{{ hint }}</p>
    <FieldErrors :id="`error-${name}`" :issues="issues" />
  </div>
</template>
