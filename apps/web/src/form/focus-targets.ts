import type { FieldGroup } from "@applytrack/presentation";

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
