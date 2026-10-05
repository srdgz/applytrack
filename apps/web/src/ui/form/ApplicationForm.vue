<script setup lang="ts">
import type { ApplicationStatus } from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  CURRENCIES,
  INITIAL_STATUSES,
  LIMITS,
  WORK_MODES,
} from "@applytrack/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { RouteLocationRaw } from "vue-router";

import { bumpDataVersion } from "../../composables/useDataVersion";
import { useGoBack } from "../../composables/useGoBack";
import { useLeaveGuard } from "../../composables/useLeaveGuard";
import { useToast } from "../../composables/useToast";
import type { FormValues } from "../../form/form-values";
import { showsAppliedAt } from "../../form/form-values";
import { useApplicationForm } from "../../form/useApplicationForm";
import StatusBadge from "../components/StatusBadge.vue";
import FieldErrors from "./FieldErrors.vue";
import SelectField from "./SelectField.vue";
import TagInput from "./TagInput.vue";
import TextField from "./TextField.vue";

export type SaveOutcome = "saved" | "invalid" | "error";

const props = defineProps<{
  initial: FormValues;
  currentStatus?: ApplicationStatus;
  save: (values: FormValues) => Promise<SaveOutcome>;
  fallback: RouteLocationRaw;
}>();

const { t, locale } = useI18n();
const goBack = useGoBack();
const toast = useToast();

const form = useApplicationForm({
  initial: props.initial,
  ...(props.currentStatus && { currentStatus: props.currentStatus }),
});
const { values, issuesFor, isDirty, touch, submitted } = form;

const saving = ref(false);
const saveError = ref(false);
const announcement = ref("");

useLeaveGuard(isDirty, () => t("form.unsavedConfirm"));

const options = <T extends string>(list: readonly T[], prefix: string) =>
  computed(() => list.map((value) => ({ value, label: t(`${prefix}.${value}`) })));

const sourceOptions = options(APPLICATION_SOURCES, "source");
const workModeOptions = options(WORK_MODES, "workMode");
const currencyOptions = CURRENCIES.map((value) => ({ value, label: value }));

const showAppliedAt = computed(() => showsAppliedAt(props.currentStatus ?? values.status));

const salaryPreview = computed(() => {
  const amounts = [values.salaryMin, values.salaryMax]
    .filter((value) => value.trim() !== "")
    .map(Number);
  if (!amounts.length || amounts.some((amount) => !Number.isInteger(amount) || amount <= 0)) {
    return "";
  }
  const format = new Intl.NumberFormat(locale.value, {
    style: "currency",
    currency: values.currency,
    maximumFractionDigits: 0,
  });
  return amounts.map((amount) => format.format(amount)).join(" – ");
});

const salaryIssues = (field: string) =>
  issuesFor("salary").filter((issue) => issue.field === field);

const notesCount = computed(() =>
  t("form.hints.notesCount", {
    count: new Intl.NumberFormat(locale.value).format(Array.from(values.notes).length),
    max: new Intl.NumberFormat(locale.value).format(LIMITS.notes),
  }),
);

const leave = () => goBack(props.fallback);

const onSubmit = async () => {
  submitted.value = true;
  saveError.value = false;
  if (form.issues.value.length) {
    announcement.value = t("errors.VALIDATION_FAILED");
    await form.focusFirstError();
    return;
  }

  saving.value = true;
  try {
    const outcome = await props.save(values);
    if (outcome === "saved") {
      form.markSaved();
      bumpDataVersion();
      toast.success(t("form.saved"));
      await leave();
    } else if (outcome === "invalid") {
      await form.focusFirstError();
    } else {
      saveError.value = true;
      toast.error(t("form.saveError"));
    }
  } catch {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <form novalidate class="flex flex-col gap-6 pb-20 md:pb-0" @submit.prevent="onSubmit">
    <p class="text-ink-muted text-sm">{{ t("form.requiredHint") }}</p>
    <p class="sr-only" aria-live="assertive">{{ announcement }}</p>

    <fieldset class="border-border bg-surface grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      <legend class="px-1 font-semibold">{{ t("form.groups.offer") }}</legend>
      <TextField
        v-model="values.company"
        name="company"
        :label="t('form.fields.company')"
        :issues="issuesFor('company')"
        :maxlength="LIMITS.company"
        required
        @blur="touch('company')"
      />
      <TextField
        v-model="values.position"
        name="position"
        :label="t('form.fields.position')"
        :issues="issuesFor('position')"
        :maxlength="LIMITS.position"
        required
        @blur="touch('position')"
      />
      <SelectField
        v-model="values.source"
        name="source"
        :label="t('form.fields.source')"
        :options="sourceOptions"
        :issues="issuesFor('source')"
        required
        placeholder
        @blur="touch('source')"
      />
      <SelectField
        v-model="values.workMode"
        name="workMode"
        :label="t('form.fields.workMode')"
        :options="workModeOptions"
        :issues="issuesFor('workMode')"
        required
        placeholder
        @blur="touch('workMode')"
      />
      <TextField
        v-model="values.jobUrl"
        name="jobUrl"
        type="url"
        :label="t('form.fields.jobUrl')"
        :placeholder="t('form.placeholders.jobUrl')"
        :issues="issuesFor('jobUrl')"
        :maxlength="LIMITS.jobUrl"
        @blur="touch('jobUrl')"
      />
      <TextField
        v-model="values.location"
        name="location"
        :label="t('form.fields.location')"
        :placeholder="t('form.placeholders.location')"
        :issues="issuesFor('location')"
        :maxlength="LIMITS.location"
        @blur="touch('location')"
      />
    </fieldset>

    <fieldset class="border-border bg-surface grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      <legend class="px-1 font-semibold">{{ t("form.groups.process") }}</legend>

      <div v-if="currentStatus" class="flex flex-col gap-1">
        <p class="text-sm font-medium">{{ t("form.currentStatus") }}</p>
        <p><StatusBadge :status="currentStatus" /></p>
        <p class="text-ink-muted text-sm">{{ t("form.statusHint") }}</p>
      </div>
      <fieldset v-else class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-medium">
          {{ t("form.fields.status") }}<span aria-hidden="true" class="text-danger"> *</span>
        </legend>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="status in INITIAL_STATUSES"
            :key="status"
            class="border-border has-checked:border-accent has-checked:bg-accent-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3"
          >
            <input
              :id="`field-status-${status}`"
              type="radio"
              name="status"
              class="accent-accent size-4"
              :value="status"
              :checked="values.status === status"
              @change="form.setStatus(status)"
            />
            {{ t(`status.${status}`) }}
          </label>
        </div>
        <FieldErrors id="error-status" :issues="issuesFor('status')" />
      </fieldset>

      <TextField
        v-if="showAppliedAt"
        v-model="values.appliedAt"
        name="appliedAt"
        type="date"
        :max="form.today()"
        :label="t('form.fields.appliedAt')"
        :issues="issuesFor('appliedAt')"
        @blur="touch('appliedAt')"
      />
    </fieldset>

    <fieldset
      class="border-border bg-surface grid gap-4 rounded-lg border p-4 md:grid-cols-3"
      aria-describedby="hint-salary error-salary"
    >
      <legend class="px-1 font-semibold">{{ t("form.groups.salary") }}</legend>
      <TextField
        v-model="values.salaryMin"
        name="salaryMin"
        type="number"
        :label="t('form.fields.salaryMin')"
        :issues="salaryIssues('salary.min')"
        @blur="touch('salary')"
      />
      <TextField
        v-model="values.salaryMax"
        name="salaryMax"
        type="number"
        :label="t('form.fields.salaryMax')"
        :issues="salaryIssues('salary.max')"
        @blur="touch('salary')"
      />
      <SelectField
        v-model="values.currency"
        name="currency"
        :label="t('form.fields.currency')"
        :options="currencyOptions"
        :issues="salaryIssues('salary.currency')"
        @blur="touch('salary')"
      />
      <div class="md:col-span-3">
        <p id="hint-salary" class="text-ink-muted text-sm">
          {{ t("form.hints.salary") }}
          <span v-if="salaryPreview" class="text-ink font-medium">{{ salaryPreview }}</span>
        </p>
        <FieldErrors id="error-salary" :issues="salaryIssues('salary')" />
      </div>
    </fieldset>

    <fieldset class="border-border bg-surface rounded-lg border p-4">
      <legend class="px-1 font-semibold">{{ t("form.groups.tags") }}</legend>
      <TagInput v-model="values.tags" :issues="issuesFor('tags')" @blur="touch('tags')" />
    </fieldset>

    <fieldset class="border-border bg-surface flex flex-col gap-1 rounded-lg border p-4">
      <legend class="px-1 font-semibold">{{ t("form.groups.notes") }}</legend>
      <label for="field-notes" class="sr-only">{{ t("form.fields.notes") }}</label>
      <textarea
        id="field-notes"
        v-model="values.notes"
        rows="5"
        :aria-invalid="issuesFor('notes').length > 0 || undefined"
        aria-describedby="hint-notes error-notes"
        class="border-border bg-surface aria-invalid:border-danger rounded-md border p-3"
        @blur="touch('notes')"
      />
      <p id="hint-notes" class="text-ink-muted text-right text-sm">{{ notesCount }}</p>
      <FieldErrors id="error-notes" :issues="issuesFor('notes')" />
    </fieldset>

    <p v-if="saveError" role="alert" class="text-danger text-sm font-medium">
      {{ t("form.saveError") }}
    </p>

    <div
      class="border-border bg-surface fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex gap-3 border-t p-3 md:static md:justify-end md:border-0 md:bg-transparent md:p-0"
    >
      <button
        type="button"
        class="border-border hover:bg-surface-muted min-h-11 flex-1 rounded-md border px-4 font-medium md:flex-none"
        @click="leave"
      >
        {{ t("form.cancel") }}
      </button>
      <button
        type="submit"
        class="bg-accent text-accent-ink min-h-11 flex-1 rounded-md px-6 font-semibold disabled:opacity-70 md:flex-none"
        :disabled="saving"
        :aria-busy="saving"
      >
        {{ saving ? t("form.saving") : t("form.save") }}
      </button>
    </div>
  </form>
</template>
