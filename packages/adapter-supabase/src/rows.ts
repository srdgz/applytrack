import type { ApplicationSnapshot } from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  CURRENCIES,
  LIMITS,
  parseCalendarDate,
  toApplicationId,
  toUserId,
  WORK_MODES,
} from "@applytrack/core";
import { z } from "zod";

const text = (max: number) =>
  z.string().refine((value) => Array.from(value).length <= max, { message: `max ${String(max)}` });

const requiredText = (max: number) => text(max).refine((value) => value.trim() !== "");

const status = z.enum(APPLICATION_STATUSES);

const timestamp = z.string().transform((value, context) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({ code: "custom", message: "invalid timestamp" });
    return z.NEVER;
  }
  return date.toISOString();
});

const calendarDate = z.string().transform((value, context) => {
  const date = parseCalendarDate(value);
  if (date === null) {
    context.addIssue({ code: "custom", message: "invalid calendar date" });
    return z.NEVER;
  }
  return date;
});

const statusChangeRow = z.object({
  seq: z.number().int().nonnegative(),
  from_status: status.nullable(),
  to_status: status,
  changed_at: timestamp,
  note: text(LIMITS.statusNote).nullable(),
});

const applicationRow = z.object({
  id: z.string().min(1),
  owner_id: z.string().min(1),
  company: requiredText(LIMITS.company),
  position: requiredText(LIMITS.position),
  job_url: text(LIMITS.jobUrl).nullable(),
  source: z.enum(APPLICATION_SOURCES),
  location: text(LIMITS.location).nullable(),
  work_mode: z.enum(WORK_MODES),
  salary_min: z.number().int().positive().nullable(),
  salary_max: z.number().int().positive().nullable(),
  salary_currency: z.enum(CURRENCIES).nullable(),
  status,
  applied_at: calendarDate.nullable(),
  tags: z.array(requiredText(LIMITS.tag)).max(LIMITS.tags),
  notes: text(LIMITS.notes).nullable(),
  archived: z.boolean(),
  created_at: timestamp,
  updated_at: timestamp,
  status_changes: z.array(statusChangeRow).min(1),
});

export const parseApplicationRow = (row: unknown): ApplicationSnapshot | null => {
  const parsed = applicationRow.safeParse(row);
  if (!parsed.success) return null;
  const data = parsed.data;

  return {
    id: toApplicationId(data.id),
    ownerId: toUserId(data.owner_id),
    company: data.company,
    position: data.position,
    source: data.source,
    workMode: data.work_mode,
    ...(data.job_url !== null && { jobUrl: data.job_url }),
    ...(data.location !== null && { location: data.location }),
    ...(data.salary_currency !== null && {
      salary: {
        ...(data.salary_min !== null && { min: data.salary_min }),
        ...(data.salary_max !== null && { max: data.salary_max }),
        currency: data.salary_currency,
      },
    }),
    ...(data.applied_at !== null && { appliedAt: data.applied_at }),
    tags: data.tags,
    ...(data.notes !== null && { notes: data.notes }),
    status: data.status,
    archived: data.archived,
    history: [...data.status_changes]
      .sort((a, b) => a.seq - b.seq)
      .map((change) => ({
        from: change.from_status,
        to: change.to_status,
        changedAt: change.changed_at,
        ...(change.note !== null && { note: change.note }),
      })),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const toSavePayload = (snapshot: ApplicationSnapshot) => ({
  application: {
    id: snapshot.id,
    owner_id: snapshot.ownerId,
    company: snapshot.company,
    position: snapshot.position,
    job_url: snapshot.jobUrl ?? null,
    source: snapshot.source,
    location: snapshot.location ?? null,
    work_mode: snapshot.workMode,
    salary_min: snapshot.salary?.min ?? null,
    salary_max: snapshot.salary?.max ?? null,
    salary_currency: snapshot.salary?.currency ?? null,
    status: snapshot.status,
    applied_at: snapshot.appliedAt ?? null,
    tags: snapshot.tags,
    notes: snapshot.notes ?? null,
    archived: snapshot.archived,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
  },
  history: snapshot.history.map((change, seq) => ({
    seq,
    from_status: change.from,
    to_status: change.to,
    changed_at: change.changedAt,
    note: change.note ?? null,
  })),
});

const searchResult = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(z.unknown()),
});

export const parseSearchResult = (value: unknown) => searchResult.safeParse(value);
