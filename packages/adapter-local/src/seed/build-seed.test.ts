import type { ApplicationSnapshot } from "@applytrack/core";
import {
  APPLICATION_STATUSES,
  calendarDateFromDate,
  validateApplicationDetails,
} from "@applytrack/core";
import { describe, expect, it } from "vitest";

import { buildSeed, resolveSeedLocale } from "./build-seed";
import { SEED_LOCALES } from "./definitions";

const now = new Date("2026-10-05T10:00:00.000Z");
const today = calendarDateFromDate(now);
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE = ["wishlist", "applied", "screening", "interviewing", "offer"];

const withoutTexts = ({ position, location, tags, notes, ...rest }: ApplicationSnapshot) => ({
  ...rest,
  hasLocation: location !== undefined,
  hasNotes: notes !== undefined,
  tagCount: tags.length,
  hasPosition: position.length > 0,
});

describe.each(SEED_LOCALES)("datos de ejemplo (%s)", (locale) => {
  const seed = buildSeed(locale, now);

  it("tiene 15 candidaturas con ids únicos", () => {
    expect(seed).toHaveLength(15);
    expect(new Set(seed.map(({ id }) => id)).size).toBe(15);
  });

  it("CA-103-06 · cubre los 9 estados", () => {
    expect(new Set(seed.map(({ status }) => status))).toEqual(new Set(APPLICATION_STATUSES));
  });

  it("CA-103-06 · cada historial es coherente con el estado actual", () => {
    for (const application of seed) {
      const { history, status } = application;

      expect(history[0]?.from).toBeNull();
      history.slice(1).forEach((change, index) => {
        expect(change.from).toBe(history[index]?.to);
        expect(change.changedAt > (history[index]?.changedAt ?? "")).toBe(true);
      });
      expect(history.at(-1)?.to).toBe(status);
      expect(application.createdAt).toBe(history[0]?.changedAt);
      expect(application.updatedAt).toBe(history.at(-1)?.changedAt);
    }
  });

  it("CA-103-07 · todas pasan la validación de la spec 100 sin cambios y sin fechas futuras", () => {
    for (const application of seed) {
      const result = validateApplicationDetails(application, { status: application.status, today });
      const {
        id: _id,
        ownerId: _ownerId,
        status: _status,
        archived: _archived,
        history: _history,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...details
      } = application;

      expect(result).toEqual({ ok: true, value: details });
      for (const change of application.history) {
        expect(new Date(change.changedAt).getTime()).toBeLessThanOrEqual(now.getTime());
      }
    }
  });

  it("solo las de wishlist no tienen fecha de candidatura", () => {
    for (const application of seed) {
      expect(application.appliedAt === undefined).toBe(application.status === "wishlist");
    }
  });

  it("hay dos candidaturas activas paradas (más de 14 días sin cambios)", () => {
    const stale = seed.filter(
      ({ status, updatedAt }) =>
        ACTIVE.includes(status) && now.getTime() - new Date(updatedAt).getTime() > 14 * DAY_MS,
    );

    expect(stale.map(({ company }) => company)).toEqual(["Lince Software", "Olivo Fintech"]);
  });

  it("solo hay una candidatura archivada", () => {
    expect(seed.filter(({ archived }) => archived).map(({ company }) => company)).toEqual([
      "Faro Labs",
    ]);
  });

  it("todas son del usuario demo", () => {
    expect(new Set(seed.map(({ ownerId }) => ownerId))).toEqual(new Set(["demo-user"]));
  });
});

describe("buildSeed", () => {
  it("CA-103-08 · español e inglés tienen la misma estructura y solo cambian los textos", () => {
    const spanish = buildSeed("es", now);
    const english = buildSeed("en", now);

    expect(spanish.map(withoutTexts)).toEqual(english.map(withoutTexts));
    expect(spanish.map(({ position }) => position)).not.toEqual(
      english.map(({ position }) => position),
    );
  });

  it("los puestos en español no marcan género", () => {
    for (const { position } of buildSeed("es", now)) {
      expect(position).not.toMatch(/dora\b|Ingeniera\b|Desarrollador\b|Ingeniero\b/);
    }
  });

  it("las fechas se calculan a partir de hoy", () => {
    const later = new Date(now.getTime() + 10 * DAY_MS);

    expect(buildSeed("es", later)[0]?.createdAt).toBe(
      new Date(later.getTime() - 2 * DAY_MS).toISOString(),
    );
  });
});

describe("resolveSeedLocale", () => {
  it.each([
    ["es", "es"],
    ["es-ES", "es"],
    ["ES", "es"],
    ["en", "en"],
    ["en-GB", "en"],
    ["fr", "en"],
  ])("%s → %s", (input, expected) => {
    expect(resolveSeedLocale(input)).toBe(expected);
  });
});
