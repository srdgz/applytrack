import type {
  ApplicationDetailsDraft,
  ApplicationDraft,
  ApplicationSnapshot,
  FieldIssue,
} from "@applytrack/core";
import { DEFAULT_CURRENCY } from "@applytrack/core";

export interface FormValues {
  company: string;
  position: string;
  jobUrl: string;
  source: string;
  workMode: string;
  location: string;
  status: string;
  appliedAt: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  tags: string[];
  notes: string;
}

export const FIELD_GROUPS = [
  "company",
  "position",
  "jobUrl",
  "source",
  "workMode",
  "location",
  "status",
  "appliedAt",
  "salary",
  "tags",
  "notes",
] as const;

export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const emptyValues = (): FormValues => ({
  company: "",
  position: "",
  jobUrl: "",
  source: "",
  workMode: "",
  location: "",
  status: "wishlist",
  appliedAt: "",
  salaryMin: "",
  salaryMax: "",
  currency: DEFAULT_CURRENCY,
  tags: [],
  notes: "",
});

export const valuesFromSnapshot = (snapshot: ApplicationSnapshot): FormValues => ({
  company: snapshot.company,
  position: snapshot.position,
  jobUrl: snapshot.jobUrl ?? "",
  source: snapshot.source,
  workMode: snapshot.workMode,
  location: snapshot.location ?? "",
  status: snapshot.status,
  appliedAt: snapshot.appliedAt ?? "",
  salaryMin: snapshot.salary?.min === undefined ? "" : String(snapshot.salary.min),
  salaryMax: snapshot.salary?.max === undefined ? "" : String(snapshot.salary.max),
  currency: snapshot.salary?.currency ?? DEFAULT_CURRENCY,
  tags: [...snapshot.tags],
  notes: snapshot.notes ?? "",
});

const optionalNumber = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value);

export const showsAppliedAt = (status: string): boolean => status !== "wishlist";

export const toDetailsDraft = (values: FormValues): ApplicationDetailsDraft => ({
  company: values.company,
  position: values.position,
  source: values.source,
  workMode: values.workMode,
  jobUrl: values.jobUrl,
  location: values.location,
  salary: {
    min: optionalNumber(values.salaryMin),
    max: optionalNumber(values.salaryMax),
    currency: values.currency,
  },
  appliedAt: showsAppliedAt(values.status) ? values.appliedAt : undefined,
  tags: values.tags,
  notes: values.notes,
});

export const toDraft = (values: FormValues): ApplicationDraft => ({
  ...toDetailsDraft(values),
  status: values.status,
});

export const groupOf = (issue: FieldIssue): FieldGroup => {
  const root = issue.field.split(".")[0];
  return FIELD_GROUPS.find((group) => group === root) ?? "company";
};

export const FOCUS_TARGETS: Readonly<Record<FieldGroup, string>> = {
  company: "field-company",
  position: "field-position",
  jobUrl: "field-jobUrl",
  source: "field-source",
  workMode: "field-workMode",
  location: "field-location",
  status: "field-status-wishlist",
  appliedAt: "field-appliedAt",
  salary: "field-salaryMin",
  tags: "field-tags",
  notes: "field-notes",
};

export const copyValues = (values: FormValues): FormValues => ({
  ...values,
  tags: [...values.tags],
});

export const sameValues = (a: FormValues, b: FormValues): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
