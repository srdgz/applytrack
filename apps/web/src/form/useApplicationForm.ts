import type { ApplicationStatus, FieldIssue } from "@applytrack/core";
import { computed, nextTick, reactive, ref } from "vue";

import { useUseCases } from "../di/use-cases";
import type { FieldGroup, FormValues } from "./form-values";
import {
  copyValues,
  FOCUS_TARGETS,
  groupOf,
  sameValues,
  showsAppliedAt,
  toDetailsDraft,
  toDraft,
} from "./form-values";

export interface FormOptions {
  readonly initial: FormValues;
  readonly currentStatus?: ApplicationStatus;
}

export const useApplicationForm = ({ initial, currentStatus }: FormOptions) => {
  const { validateApplicationDraft, today } = useUseCases();

  const values = reactive<FormValues>(copyValues(initial));
  const baseline = ref<FormValues>(copyValues(initial));
  const touched = reactive(new Set<FieldGroup>());
  const submitted = ref(false);

  const issues = computed<readonly FieldIssue[]>(() =>
    currentStatus === undefined
      ? validateApplicationDraft.execute({ draft: toDraft(values) })
      : validateApplicationDraft.execute({ draft: toDetailsDraft(values), currentStatus }),
  );

  const visibleIssues = computed(() =>
    issues.value.filter((issue) => submitted.value || touched.has(groupOf(issue))),
  );

  const issuesFor = (group: FieldGroup) =>
    visibleIssues.value.filter((issue) => groupOf(issue) === group);

  const isDirty = computed(() => !sameValues(values, baseline.value));

  const touch = (group: FieldGroup) => {
    touched.add(group);
  };

  const setStatus = (status: string) => {
    values.status = status;
    if (showsAppliedAt(status) && values.appliedAt === "") values.appliedAt = today();
  };

  const focusFirstError = async () => {
    await nextTick();
    const first = issues.value[0];
    if (first) document.getElementById(FOCUS_TARGETS[groupOf(first)])?.focus();
  };

  const markSaved = () => {
    baseline.value = copyValues(values);
  };

  return {
    values,
    issues,
    issuesFor,
    isDirty,
    submitted,
    touch,
    setStatus,
    focusFirstError,
    markSaved,
    today,
  };
};
