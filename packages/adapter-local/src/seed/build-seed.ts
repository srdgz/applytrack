import type { ApplicationSnapshot, StatusChange } from "@applytrack/core";
import { calendarDateFromDate, toApplicationId, toUserId } from "@applytrack/core";

import { DEMO_USER_ID } from "../storage-keys";
import type { SeedDefinition, SeedLocale, SeedStep } from "./definitions";
import { SEED } from "./definitions";

const DAY_MS = 24 * 60 * 60 * 1000;

export const resolveSeedLocale = (contentLocale: string): SeedLocale =>
  contentLocale.toLowerCase().startsWith("es") ? "es" : "en";

const daysBefore = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY_MS);

const history = (path: readonly SeedStep[], now: Date): StatusChange[] =>
  path.map(([to, daysAgo], index) => ({
    from: index === 0 ? null : (path[index - 1]?.[0] ?? null),
    to,
    changedAt: daysBefore(now, daysAgo).toISOString(),
  }));

const toSnapshot = (
  definition: SeedDefinition,
  index: number,
  locale: SeedLocale,
  now: Date,
): ApplicationSnapshot => {
  const changes = history(definition.path, now);
  const first = changes[0];
  const last = changes[changes.length - 1] ?? first;
  const appliedStep = definition.path.find(([status]) => status === "applied");

  if (!first || !last) throw new Error(`Seed ${definition.company} has no history`);

  return {
    id: toApplicationId(`demo-${String(index + 1).padStart(2, "0")}`),
    ownerId: toUserId(DEMO_USER_ID),
    company: definition.company,
    position: definition.position[locale],
    source: definition.source,
    workMode: definition.workMode,
    ...(definition.jobUrl !== undefined && { jobUrl: definition.jobUrl }),
    ...(definition.location !== undefined && { location: definition.location[locale] }),
    ...(definition.salary !== undefined && { salary: definition.salary }),
    ...(appliedStep !== undefined && {
      appliedAt: calendarDateFromDate(daysBefore(now, appliedStep[1])),
    }),
    tags: [...definition.tags[locale]],
    ...(definition.notes !== undefined && { notes: definition.notes[locale] }),
    status: last.to,
    archived: definition.archived ?? false,
    history: changes,
    createdAt: first.changedAt,
    updatedAt: last.changedAt,
  };
};

export const buildSeed = (locale: SeedLocale, now: Date): ApplicationSnapshot[] =>
  SEED.map((definition, index) => toSnapshot(definition, index, locale, now));
