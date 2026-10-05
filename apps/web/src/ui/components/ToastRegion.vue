<script setup lang="ts">
import type { Toast, ToastKind } from "@applytrack/notifications";
import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue";
import { useI18n } from "vue-i18n";

import { useToastQueue } from "../../composables/useToast";
import type { IconName } from "./AppIcon.vue";
import AppIcon from "./AppIcon.vue";

const { t } = useI18n();
const queue = useToastQueue();

const toasts = shallowRef<readonly Toast[]>([]);
let unsubscribe: (() => void) | undefined;

onMounted(() => {
  unsubscribe = queue.subscribe((current) => {
    toasts.value = current;
  });
});
onBeforeUnmount(() => {
  unsubscribe?.();
});

const polite = computed(() => toasts.value.filter(({ kind }) => kind !== "error"));
const assertive = computed(() => toasts.value.filter(({ kind }) => kind === "error"));

const icons: Record<ToastKind, IconName> = {
  success: "check",
  info: "info",
  error: "alert",
};

const borders: Record<ToastKind, string> = {
  success: "border-l-success",
  info: "border-l-accent",
  error: "border-l-danger",
};

const iconColors: Record<ToastKind, string> = {
  success: "text-success",
  info: "text-accent",
  error: "text-danger",
};

const onFocusOut = (event: FocusEvent, id: string) => {
  const item = event.currentTarget as HTMLElement;
  if (!item.contains(event.relatedTarget as Node | null)) queue.resume(id);
};

const onKeydown = (event: KeyboardEvent, id: string) => {
  if (event.key === "Escape") queue.dismiss(id);
};
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-50 flex flex-col gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
    :aria-label="t('toast.region')"
    role="region"
  >
    <template v-for="group in [polite, assertive]" :key="group === polite ? 'status' : 'alert'">
      <div :role="group === polite ? 'status' : 'alert'" class="flex flex-col gap-2">
        <div
          v-for="toast in group"
          :key="toast.id"
          class="border-border bg-surface text-ink pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 p-3 shadow-lg motion-safe:animate-toast-in"
          :class="borders[toast.kind]"
          @mouseenter="queue.pause(toast.id)"
          @mouseleave="queue.resume(toast.id)"
          @focusin="queue.pause(toast.id)"
          @focusout="onFocusOut($event, toast.id)"
          @keydown="onKeydown($event, toast.id)"
        >
          <AppIcon
            :name="icons[toast.kind]"
            class="mt-0.5 shrink-0"
            :class="iconColors[toast.kind]"
          />
          <p class="min-w-0 flex-1 text-sm">
            <span class="sr-only">{{ t(`toast.${toast.kind}`) }}: </span>{{ toast.message }}
          </p>
          <button
            type="button"
            class="text-ink-muted hover:bg-surface-muted hover:text-ink -m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md"
            :aria-label="t('toast.close')"
            @click="queue.dismiss(toast.id)"
          >
            <AppIcon name="close" class="size-4" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
