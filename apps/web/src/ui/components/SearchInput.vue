<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useFilters } from "../../composables/useFilters";
import AppIcon from "./AppIcon.vue";

const DEBOUNCE_MS = 300;

const { t } = useI18n();
const { filters, update } = useFilters();

const text = ref(filters.value.text);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => filters.value.text,
  (value) => {
    if (value !== text.value.trim()) text.value = value;
  },
);

const onInput = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void update({ text: text.value }, { replace: true });
  }, DEBOUNCE_MS);
};

onBeforeUnmount(() => {
  clearTimeout(timer);
});
</script>

<template>
  <div class="relative">
    <label for="search" class="sr-only">{{ t("filters.search") }}</label>
    <AppIcon
      name="search"
      class="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
    />
    <input
      id="search"
      v-model="text"
      type="search"
      autocomplete="off"
      :placeholder="t('filters.searchPlaceholder')"
      class="border-border bg-surface placeholder:text-ink-muted w-full rounded-md border py-2 pr-3 pl-10"
      @input="onInput"
    />
  </div>
</template>
