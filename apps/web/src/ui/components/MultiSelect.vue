<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

import AppIcon from "./AppIcon.vue";

export interface Option {
  readonly value: string;
  readonly label: string;
}

const props = defineProps<{
  label: string;
  options: readonly Option[];
  modelValue: readonly string[];
  layout: "bar" | "sheet";
  emptyText?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const { t } = useI18n();
const id = useId();
const details = ref<HTMLDetailsElement | null>(null);

const summary = computed(() => t("filters.selectedCount", { count: props.modelValue.length }));

const toggle = (value: string, checked: boolean) => {
  const next = checked
    ? [...props.modelValue, value]
    : props.modelValue.filter((item) => item !== value);
  emit(
    "update:modelValue",
    props.options.map(({ value: option }) => option).filter((option) => next.includes(option)),
  );
};

const close = (event: Event) => {
  const element = details.value;
  if (!element?.open) return;
  if (event instanceof KeyboardEvent) {
    if (event.key !== "Escape") return;
    element.open = false;
    element.querySelector("summary")?.focus();
    return;
  }
  if (!element.contains(event.target as Node)) element.open = false;
};

onMounted(() => {
  document.addEventListener("click", close);
  document.addEventListener("keydown", close);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", close);
  document.removeEventListener("keydown", close);
});
</script>

<template>
  <details v-if="layout === 'bar'" ref="details" class="relative">
    <summary
      class="border-border bg-surface hover:bg-surface-muted flex cursor-pointer list-none items-center gap-2 rounded-md border px-3 py-2 text-sm [&::-webkit-details-marker]:hidden"
    >
      <span class="font-medium">{{ label }}</span>
      <span class="text-ink-muted">{{ summary }}</span>
      <AppIcon name="chevron" class="text-ink-muted size-4" />
    </summary>
    <fieldset
      class="border-border bg-surface absolute z-20 mt-1 max-h-72 min-w-56 overflow-auto rounded-md border p-2 shadow-lg"
    >
      <legend class="sr-only">{{ label }}</legend>
      <p v-if="!options.length" class="text-ink-muted px-2 py-1 text-sm">{{ emptyText }}</p>
      <label
        v-for="option in options"
        :key="option.value"
        class="hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm"
      >
        <input
          type="checkbox"
          class="accent-accent size-4"
          :checked="modelValue.includes(option.value)"
          @change="toggle(option.value, ($event.target as HTMLInputElement).checked)"
        />
        {{ option.label }}
      </label>
    </fieldset>
  </details>

  <fieldset v-else>
    <legend :id="id" class="mb-2 text-sm font-semibold">{{ label }}</legend>
    <p v-if="!options.length" class="text-ink-muted text-sm">{{ emptyText }}</p>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="option in options"
        :key="option.value"
        class="border-border has-checked:border-accent has-checked:bg-accent-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm"
      >
        <input
          type="checkbox"
          class="accent-accent size-4"
          :checked="modelValue.includes(option.value)"
          @change="toggle(option.value, ($event.target as HTMLInputElement).checked)"
        />
        {{ option.label }}
      </label>
    </div>
  </fieldset>
</template>
