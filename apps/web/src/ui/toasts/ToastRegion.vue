<script setup lang="ts">
import type { Toast } from "@applytrack/notifications";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";

import { useToastQueue } from "../../composables/useToast";
import SileoToast from "./SileoToast.vue";

const COLLAPSE_MS = 250;
const FADE_MS = 200;

const { t } = useI18n();
const queue = useToastQueue();

const toasts = shallowRef<readonly Toast[]>([]);
const politeMessage = ref("");
const assertiveMessage = ref("");
const root = ref<HTMLElement | null>(null);
const announced = new Set<string>();

const signature = ({ id, kind, title, description }: Toast) =>
  [id, kind, title, description ?? ""].join("|");

const announce = (current: readonly Toast[]) => {
  for (const toast of [...current].reverse()) {
    const key = signature(toast);
    if (announced.has(key)) continue;
    announced.add(key);
    const text = [`${t(`toast.${toast.kind}`)}: ${toast.title}`, toast.description]
      .filter(Boolean)
      .join(". ");
    if (toast.kind === "error" || toast.kind === "warning") assertiveMessage.value = text;
    else politeMessage.value = text;
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (!event.altKey || event.key.toLowerCase() !== "t") return;
  const target = toasts.value.find(({ action }) => action);
  if (!target) return;
  event.preventDefault();
  root.value
    ?.querySelector<HTMLButtonElement>(`[data-toast-id="${target.id}"] [data-toast-action]`)
    ?.focus();
};

let unsubscribe: (() => void) | undefined;

onMounted(() => {
  unsubscribe = queue.subscribe((current) => {
    toasts.value = current;
    announce(current);
  });
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  unsubscribe?.();
  window.removeEventListener("keydown", onKeydown);
});

const reducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const onLeave = (element: Element, done: () => void) => {
  if (reducedMotion()) {
    done();
    return;
  }
  const toast = element as HTMLElement;
  toast.dataset.leaving = "true";
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-0.5rem) scale(0.92)";
    setTimeout(done, FADE_MS);
  }, COLLAPSE_MS);
};
</script>

<template>
  <svg width="0" height="0" class="absolute" aria-hidden="true" focusable="false">
    <defs>
      <filter id="sileo-goo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>

  <section
    ref="root"
    :aria-label="t('toast.region')"
    class="pointer-events-none fixed inset-x-4 top-4 z-[60] md:inset-x-auto md:right-4 md:w-[22rem]"
  >
    <p class="sr-only" role="status">{{ politeMessage }}</p>
    <p class="sr-only" role="alert">{{ assertiveMessage }}</p>

    <TransitionGroup
      tag="ol"
      class="flex flex-col gap-2"
      enter-active-class="transition duration-500 ease-spring"
      enter-from-class="-translate-y-2 scale-90 opacity-0"
      move-class="transition-transform duration-500 ease-spring"
      @leave="onLeave"
    >
      <li
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto transition-[opacity,transform] duration-200"
      >
        <SileoToast :toast="toast" />
      </li>
    </TransitionGroup>
  </section>
</template>

<style>
.sileo-canvas {
  filter: url(#sileo-goo);
}

:root[data-theme="dark"] .sileo-canvas {
  filter: url(#sileo-goo) drop-shadow(0 0 1px rgb(255 255 255 / 0.45));
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .sileo-canvas {
    filter: url(#sileo-goo) drop-shadow(0 0 1px rgb(255 255 255 / 0.45));
  }
}

[data-leaving] .sileo-toast {
  height: 40px !important;
}

[data-leaving] .sileo-body {
  height: 0 !important;
}

[data-leaving] .sileo-toast > div:last-child {
  opacity: 0;
}
</style>
