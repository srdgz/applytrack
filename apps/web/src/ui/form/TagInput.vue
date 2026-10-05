<script setup lang="ts">
import type { FieldIssue } from "@applytrack/core";
import { LIMITS } from "@applytrack/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import AppIcon from "../components/AppIcon.vue";
import FieldErrors from "./FieldErrors.vue";

const props = defineProps<{ issues: readonly FieldIssue[] }>();
const tags = defineModel<string[]>({ required: true });
const emit = defineEmits<{ blur: [] }>();

const { t } = useI18n();
const pending = ref("");

const invalidIndexes = computed(
  () =>
    new Set(
      props.issues
        .map(({ field }) => Number(field.split(".")[1]))
        .filter((index) => Number.isInteger(index)),
    ),
);

const add = () => {
  const tag = pending.value.replace(/,/g, "").trim();
  if (tag) tags.value = [...tags.value, tag];
  pending.value = "";
};

const remove = (index: number) => {
  tags.value = tags.value.filter((_, position) => position !== index);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    add();
  } else if (event.key === "Backspace" && pending.value === "" && tags.value.length) {
    remove(tags.value.length - 1);
  }
};

const onBlur = () => {
  add();
  emit("blur");
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <ul v-if="tags.length" class="flex flex-wrap gap-2">
      <li
        v-for="(tag, index) in tags"
        :key="`${tag}-${index}`"
        class="bg-surface-muted inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3 text-sm"
        :class="invalidIndexes.has(index) ? 'border-danger' : 'border-border'"
      >
        {{ tag }}
        <button
          type="button"
          class="hover:bg-surface inline-flex size-7 items-center justify-center rounded-full"
          :aria-label="t('form.removeTag', { tag })"
          @click="remove(index)"
        >
          <AppIcon name="close" class="size-4" />
        </button>
      </li>
    </ul>
    <label for="field-tags" class="text-sm font-medium">{{ t("form.fields.tags") }}</label>
    <input
      id="field-tags"
      v-model="pending"
      type="text"
      autocomplete="off"
      :placeholder="t('form.placeholders.tags')"
      :maxlength="LIMITS.tag"
      :aria-invalid="issues.length > 0 || undefined"
      aria-describedby="hint-tags error-tags"
      class="border-border bg-surface placeholder:text-ink-muted aria-invalid:border-danger min-h-11 rounded-md border px-3"
      @keydown="onKeydown"
      @blur="onBlur"
    />
    <p id="hint-tags" class="text-ink-muted text-sm">
      {{ t("form.hints.tags") }}
      {{ t("form.hints.tagsCount", { count: tags.length, max: LIMITS.tags }) }}
    </p>
    <FieldErrors id="error-tags" :issues="issues" />
  </div>
</template>
