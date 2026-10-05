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

const calendarDate = z.string().transform((value, context) => {
  const date = parseCalendarDate(value);
  if (date === null) {
    context.addIssue({ code: "custom", message: "invalid calendar date" });
    return z.NEVER;
  }
  return date;
});

const statusChange = z.object({
  from: status.nullable(),
  to: status,
  changedAt: z.iso.datetime(),
  note: z.string().optional(),
});

const snapshotSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  company: requiredText(LIMITS.company),
  position: requiredText(LIMITS.position),
  source: z.enum(APPLICATION_SOURCES),
  workMode: z.enum(WORK_MODES),
  jobUrl: text(LIMITS.jobUrl).optional(),
  location: text(LIMITS.location).optional(),
  salary: z
    .object({
      min: z.number().int().positive().optional(),
      max: z.number().int().positive().optional(),
      currency: z.enum(CURRENCIES),
    })
    .optional(),
  appliedAt: calendarDate.optional(),
  tags: z.array(requiredText(LIMITS.tag)).max(LIMITS.tags),
  notes: text(LIMITS.notes).optional(),
  status,
  archived: z.boolean(),
  history: z.array(statusChange).min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const datasetSchema = z.object({
  version: z.literal(1),
  locale: z.string().nullable(),
  seededAt: z.string().nullable(),
  applications: z.array(z.unknown()),
});

export const parseSnapshot = (row: unknown): ApplicationSnapshot | null => {
  const parsed = snapshotSchema.safeParse(row);
  if (!parsed.success) return null;

  const { id, ownerId, jobUrl, location, salary, appliedAt, notes, history, ...rest } = parsed.data;
  return {
    ...rest,
    id: toApplicationId(id),
    ownerId: toUserId(ownerId),
    ...(jobUrl !== undefined && { jobUrl }),
    ...(location !== undefined && { location }),
    ...(salary !== undefined && {
      salary: {
        ...(salary.min !== undefined && { min: salary.min }),
        ...(salary.max !== undefined && { max: salary.max }),
        currency: salary.currency,
      },
    }),
    ...(appliedAt !== undefined && { appliedAt }),
    ...(notes !== undefined && { notes }),
    history: history.map(({ note, ...change }) => ({
      ...change,
      ...(note !== undefined && { note }),
    })),
  };
};
