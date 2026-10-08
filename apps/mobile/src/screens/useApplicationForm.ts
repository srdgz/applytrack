import type { ApplicationStatus, FieldIssue } from "@applytrack/core";
import type { FieldGroup, FormValues } from "@applytrack/presentation";
import {
  copyValues,
  groupOf,
  sameValues,
  showsAppliedAt,
  toDetailsDraft,
  toDraft,
} from "@applytrack/presentation";
import { useCallback, useMemo, useState } from "react";

import { useUseCases } from "../shell/session";

export const useApplicationForm = ({
  initial,
  currentStatus,
}: {
  readonly initial: FormValues;
  readonly currentStatus?: ApplicationStatus | undefined;
}) => {
  const { validateApplicationDraft, today } = useUseCases();
  const [values, setValues] = useState<FormValues>(() => copyValues(initial));
  const [baseline, setBaseline] = useState<FormValues>(() => copyValues(initial));
  const [touched, setTouched] = useState<ReadonlySet<FieldGroup>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const issues = useMemo<readonly FieldIssue[]>(
    () =>
      currentStatus === undefined
        ? validateApplicationDraft.execute({ draft: toDraft(values) })
        : validateApplicationDraft.execute({ draft: toDetailsDraft(values), currentStatus }),
    [values, currentStatus, validateApplicationDraft],
  );

  const issuesFor = useCallback(
    (group: FieldGroup) =>
      issues.filter(
        (issue) => groupOf(issue) === group && (submitted || touched.has(groupOf(issue))),
      ),
    [issues, submitted, touched],
  );

  const set = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const touch = useCallback((group: FieldGroup) => {
    setTouched((current) => (current.has(group) ? current : new Set([...current, group])));
  }, []);

  const setStatus = useCallback(
    (status: string) => {
      setValues((current) => ({
        ...current,
        status,
        appliedAt: showsAppliedAt(status) && current.appliedAt === "" ? today() : current.appliedAt,
      }));
    },
    [today],
  );

  return {
    values,
    issues,
    issuesFor,
    isDirty: !sameValues(values, baseline),
    submitted,
    submit: () => {
      setSubmitted(true);
    },
    set,
    touch,
    setStatus,
    markSaved: () => {
      setBaseline(copyValues(values));
    },
    today,
  };
};

export type ApplicationFormState = ReturnType<typeof useApplicationForm>;
