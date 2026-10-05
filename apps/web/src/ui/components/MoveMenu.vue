<script setup lang="ts">
import type { ApplicationStatus } from "@applytrack/core";
import { allowedTransitions } from "@applytrack/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

import AppIcon from "./AppIcon.vue";

const props = defineProps<{ company: string; status: ApplicationStatus }>();
const emit = defineEmits<{ select: [status: ApplicationStatus] }>();

const { t } = useI18n();
const menuId = useId();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const items = ref<HTMLButtonElement[]>([]);

const options = computed(() => allowedTransitions(props.status));
const label = computed(() => t("board.moveTo", { company: props.company }));

const focusItem = (index: number) => {
  const count = items.value.length;
  items.value[(index + count) % count]?.focus();
};

const openMenu = async (index = 0) => {
  open.value = true;
  await nextTick();
  focusItem(index);
};

const close = (restoreFocus = true) => {
  open.value = false;
  if (restoreFocus) trigger.value?.focus();
};

const choose = (status: ApplicationStatus) => {
  close();
  emit("select", status);
};

const onTriggerKeydown = async (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    await openMenu(event.key === "ArrowDown" ? 0 : options.value.length - 1);
  }
};

const onMenuKeydown = (event: KeyboardEvent) => {
  const current = items.value.indexOf(document.activeElement as HTMLButtonElement);
  const moves: Record<string, number> = {
    ArrowDown: current + 1,
    ArrowUp: current - 1,
    Home: 0,
    End: items.value.length - 1,
  };
  const target = moves[event.key];
  if (target !== undefined) {
    event.preventDefault();
    focusItem(target);
  } else if (event.key === "Escape") {
    event.preventDefault();
    close();
  } else if (event.key === "Tab") {
    close(false);
  }
};

const onDocumentClick = (event: MouseEvent) => {
  if (open.value && !root.value?.contains(event.target as Node)) close(false);
};

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <div v-if="options.length" ref="root" class="relative z-10">
    <button
      ref="trigger"
      type="button"
      class="text-ink-muted hover:bg-surface-muted hover:text-ink inline-flex size-9 items-center justify-center rounded-md"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      :aria-label="label"
      :title="label"
      @click="open ? close() : openMenu()"
      @keydown="onTriggerKeydown"
    >
      <AppIcon name="more" />
    </button>
    <ul
      v-if="open"
      :id="menuId"
      role="menu"
      :aria-label="label"
      class="border-border bg-surface absolute right-0 z-30 mt-1 min-w-48 rounded-md border p-1 shadow-lg"
      @keydown="onMenuKeydown"
    >
      <li v-for="option in options" :key="option" role="none">
        <button
          ref="items"
          type="button"
          role="menuitem"
          tabindex="-1"
          class="hover:bg-surface-muted focus:bg-surface-muted w-full rounded px-3 py-2 text-left text-sm"
          @click="choose(option)"
        >
          {{ t(`status.${option}`) }}
        </button>
      </li>
    </ul>
  </div>
</template>
