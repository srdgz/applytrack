<script setup lang="ts">
import type { ApplicationSnapshot, ApplicationStatus, FieldIssue } from "@applytrack/core";
import { allowedTransitions, LIMITS } from "@applytrack/core";
import { computed, nextTick, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useStatusChange } from "../../composables/useStatusChange";
import FieldErrors from "../form/FieldErrors.vue";

const props = defineProps<{ application: ApplicationSnapshot }>();
const emit = defineEmits<{ saved: [application: ApplicationSnapshot]; cancel: [] }>();

const { t, locale } = useI18n();
const { change } = useStatusChange();

const options = computed(() => allowedTransitions(props.application.status));
const selected = ref<ApplicationStatus | null>(null);
const note = ref("");
const saving = ref(false);
const message = ref("");
const issues = ref<readonly FieldIssue[]>([]);
const panel = ref<HTMLElement | null>(null);

const noteCount = computed(() =>
  t("detail.noteCount", {
    count: new Intl.NumberFormat(locale.value).format(Array.from(note.value).length),
    max: new Intl.NumberFormat(locale.value).format(LIMITS.statusNote),
  }),
);

onMounted(async () => {
  await nextTick();
  panel.value?.querySelector<HTMLInputElement>("input[type=radio]")?.focus();
});

const onSubmit = async () => {
  message.value = "";
  issues.value = [];
  if (selected.value === null) {
    message.value = t("detail.chooseStatus");
    return;
  }
  saving.value = true;
  try {
    const outcome = await change(props.application.id, selected.value, note.value);
    if (outcome.ok) emit("saved", outcome.application);
    else {
      message.value = outcome.message;
      issues.value = outcome.issues;
    }
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <form
    ref="panel"
    class="border-accent bg-surface flex flex-col gap-4 rounded-lg border p-4"
    aria-labelledby="status-panel-title"
    @submit.prevent="onSubmit"
  >
    <h2 id="status-panel-title" class="font-semibold">{{ t("detail.changeStatus") }}</h2>

    <fieldset>
      <legend class="mb-2 text-sm font-medium">{{ t("detail.newStatus") }}</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="status in options"
          :key="status"
          class="border-border has-checked:border-accent has-checked:bg-accent-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3"
        >
          <input
            v-model="selected"
            type="radio"
            name="new-status"
            class="accent-accent size-4"
            :value="status"
          />
          {{ t(`status.${status}`) }}
        </label>
      </div>
    </fieldset>

    <div class="flex flex-col gap-1">
      <label for="status-note" class="text-sm font-medium">{{ t("detail.note") }}</label>
      <textarea
        id="status-note"
        v-model="note"
        rows="3"
        :maxlength="LIMITS.statusNote"
        :aria-invalid="issues.length > 0 || undefined"
        aria-describedby="status-note-count error-status-note"
        class="border-border bg-surface aria-invalid:border-danger rounded-md border p-3"
      />
      <p id="status-note-count" class="text-ink-muted text-right text-sm">{{ noteCount }}</p>
      <FieldErrors id="error-status-note" :issues="issues" />
    </div>

    <p v-if="message" role="alert" class="text-danger text-sm font-medium">{{ message }}</p>

    <div class="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        class="border-border hover:bg-surface-muted min-h-11 rounded-md border px-4 font-medium"
        @click="emit('cancel')"
      >
        {{ t("detail.cancel") }}
      </button>
      <button
        type="submit"
        class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 min-h-11 rounded-md px-5 font-semibold disabled:opacity-70"
        :disabled="saving"
        :aria-busy="saving"
      >
        {{ t("detail.saveChange") }}
      </button>
    </div>
  </form>
</template>
