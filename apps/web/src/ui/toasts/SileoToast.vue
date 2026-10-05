<script setup lang="ts">
import type { Toast } from "@applytrack/notifications";
import { iconFor, TOAST_COLORS, TOAST_ICONS } from "@applytrack/notifications";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useToastQueue } from "../../composables/useToast";
import AppIcon from "../components/AppIcon.vue";

const PILL_HEIGHT = 40;
const BODY_OFFSET = 24;
const CONTENT_GAP = 4;
const EXPAND_DELAY_MS = 300;

const props = defineProps<{ toast: Toast }>();

const { t } = useI18n();
const queue = useToastQueue();

const header = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const opened = ref(false);
const hovered = ref(false);
const focused = ref(false);
const pillWidth = ref(160);
const contentHeight = ref(0);

const color = computed(() => TOAST_COLORS[props.toast.kind]);
const iconPaths = computed(() => TOAST_ICONS[iconFor(props.toast)]);
const hasBody = computed(() => Boolean(props.toast.description ?? props.toast.action));
const expanded = computed(() => hasBody.value && (opened.value || hovered.value || focused.value));
const bodyHeight = computed(() =>
  expanded.value ? PILL_HEIGHT + CONTENT_GAP - BODY_OFFSET + contentHeight.value : 0,
);
const totalHeight = computed(() => (expanded.value ? BODY_OFFSET + bodyHeight.value : PILL_HEIGHT));

let openTimer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;

const measure = () => {
  if (header.value) pillWidth.value = header.value.offsetWidth;
  if (content.value) contentHeight.value = content.value.offsetHeight;
};

onMounted(() => {
  measure();
  openTimer = setTimeout(() => {
    opened.value = true;
  }, EXPAND_DELAY_MS);
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(measure);
    if (header.value) observer.observe(header.value);
    if (content.value) observer.observe(content.value);
  }
});

watch(
  () => [props.toast.title, props.toast.description, props.toast.kind, expanded.value],
  async () => {
    await nextTick();
    measure();
  },
);

onBeforeUnmount(() => {
  clearTimeout(openTimer);
  observer?.disconnect();
});

const onMouseEnter = () => {
  hovered.value = true;
  queue.pause(props.toast.id);
};

const onMouseLeave = () => {
  hovered.value = false;
  if (!focused.value) queue.resume(props.toast.id);
};

const onFocusIn = () => {
  focused.value = true;
  queue.pause(props.toast.id);
};

const onFocusOut = (event: FocusEvent) => {
  const root = event.currentTarget as HTMLElement;
  if (root.contains(event.relatedTarget as Node | null)) return;
  focused.value = false;
  if (!hovered.value) queue.resume(props.toast.id);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") queue.dismiss(props.toast.id);
};
</script>

<template>
  <div
    class="sileo-toast relative w-full transition-[height] duration-500 ease-spring"
    :style="{ height: `${String(totalHeight)}px` }"
    :data-toast-id="toast.id"
    :data-kind="toast.kind"
    :data-expanded="expanded"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <div class="sileo-canvas pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="sileo-pill bg-toast absolute top-0 right-0 rounded-2xl transition-[width] duration-500 ease-spring"
        :style="{ width: `${String(pillWidth)}px`, height: `${String(PILL_HEIGHT)}px` }"
      />
      <div
        class="sileo-body bg-toast absolute inset-x-0 rounded-2xl transition-[height] duration-500 ease-spring"
        :style="{ top: `${String(BODY_OFFSET)}px`, height: `${String(bodyHeight)}px` }"
      />
    </div>

    <div
      ref="header"
      class="absolute top-0 right-0 flex items-center gap-2 pr-2 pl-2"
      :style="{ height: `${String(PILL_HEIGHT)}px` }"
    >
      <span
        class="inline-flex size-6 shrink-0 items-center justify-center rounded-full"
        :style="{ color, backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)` }"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'animate-spin': toast.kind === 'loading' }"
        >
          <path v-for="path in iconPaths" :key="path" :d="path" />
        </svg>
      </span>
      <p class="max-w-64 truncate pr-1 text-sm font-semibold" :style="{ color }">
        <span class="sr-only">{{ t(`toast.${toast.kind}`) }}: </span>{{ toast.title }}
      </p>
      <button
        type="button"
        class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        :class="{ 'sr-only focus:not-sr-only': !expanded }"
        :aria-label="t('toast.close')"
        @click="queue.dismiss(toast.id)"
      >
        <AppIcon name="close" class="size-4" />
      </button>
    </div>

    <div
      v-if="hasBody"
      ref="content"
      class="absolute inset-x-0 flex flex-col items-start gap-3 px-4 pb-4 transition-opacity duration-300"
      :class="expanded ? 'opacity-100' : 'pointer-events-none opacity-0'"
      :style="{ top: `${String(PILL_HEIGHT + CONTENT_GAP)}px` }"
      :aria-hidden="!expanded"
    >
      <p v-if="toast.description" class="text-sm leading-snug text-white/50">
        {{ toast.description }}
      </p>
      <button
        v-if="toast.action"
        type="button"
        data-toast-action
        class="min-h-9 rounded-full px-4 text-sm font-semibold"
        :style="{ color, backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)` }"
        :tabindex="expanded ? undefined : -1"
        @click="toast.action.onPress()"
      >
        {{ toast.action.label }}
      </button>
    </div>
  </div>
</template>
