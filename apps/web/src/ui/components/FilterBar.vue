<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useUseCases } from "../../di/use-cases";
import { useDataVersion } from "../../composables/useDataVersion";
import { useFilters } from "../../composables/useFilters";
import AppIcon from "./AppIcon.vue";
import FilterControls from "./FilterControls.vue";
import SearchInput from "./SearchInput.vue";

const { t } = useI18n();
const { listTags } = useUseCases();
const { activeCount, clear } = useFilters();
const dataVersion = useDataVersion();

const tags = shallowRef<readonly string[]>([]);
const panelOpen = ref(false);
const sheet = ref<HTMLDialogElement | null>(null);

const loadTags = async () => {
  const result = await listTags.execute();
  if (result.ok) tags.value = result.value;
};

onMounted(loadTags);
watch(dataVersion, loadTags);

const openFilters = () => {
  if (window.matchMedia("(min-width: 48rem)").matches) panelOpen.value = !panelOpen.value;
  else sheet.value?.showModal();
};

const closeSheet = () => {
  sheet.value?.close();
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <SearchInput class="min-w-48 flex-1" />
      <button
        type="button"
        class="border-border bg-surface hover:bg-surface-muted inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium lg:hidden"
        :aria-expanded="panelOpen"
        aria-controls="filter-panel"
        @click="openFilters"
      >
        <AppIcon name="filter" class="size-4" />
        {{ t("filters.open") }}
        <span
          v-if="activeCount"
          class="bg-accent text-accent-ink rounded-full px-1.5 text-xs leading-5"
        >
          {{ activeCount }}
        </span>
      </button>
      <button
        v-if="activeCount"
        type="button"
        class="text-accent min-h-10 px-2 text-sm font-medium underline underline-offset-2"
        @click="clear"
      >
        {{ t("filters.clear", { count: activeCount }) }}
      </button>
      <slot />
    </div>

    <div id="filter-panel" class="hidden lg:block" :class="{ 'md:block': panelOpen }">
      <FilterControls layout="bar" :tags="tags" />
    </div>

    <dialog
      ref="sheet"
      class="bg-surface text-ink fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-auto rounded-t-2xl p-4 backdrop:bg-black/40 md:hidden"
      :aria-label="t('filters.title')"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ t("filters.title") }}</h2>
        <button
          type="button"
          class="hover:bg-surface-muted inline-flex size-11 items-center justify-center rounded-full"
          :aria-label="t('filters.close')"
          @click="closeSheet"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <FilterControls layout="sheet" :tags="tags" />
      <button
        type="button"
        class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 mt-6 min-h-11 w-full rounded-md font-medium"
        @click="closeSheet"
      >
        {{ t("filters.showResults") }}
      </button>
    </dialog>
  </div>
</template>
