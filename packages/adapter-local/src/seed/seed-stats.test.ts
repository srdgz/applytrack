import { calendarDateFromDate, computeDashboardStats } from "@applytrack/core";
import { describe, expect, it } from "vitest";

import { buildSeed } from "./build-seed";

const now = new Date("2026-10-07T12:00:00.000Z");
const stats = computeDashboardStats(buildSeed("es", now), calendarDateFromDate(now));

describe("estadísticas de los datos de ejemplo", () => {
  it("CA-105-02 · 13 enviadas, 9 con respuesta, 5 con entrevista y 2 con oferta", () => {
    expect(stats).toMatchObject({ sent: 13, responded: 9, interviewed: 5, offered: 2 });
  });

  it("CA-105-03 · la mediana de días hasta la primera respuesta es 7", () => {
    expect(stats.medianDaysToResponse).toBe(7);
  });

  it("CA-105-04 · 10 activas, 5 cerradas y 2 paradas en orden de antigüedad", () => {
    expect(stats).toMatchObject({ total: 15, active: 10, closed: 5 });
    expect(stats.stale.map(({ company }) => company)).toEqual(["Lince Software", "Olivo Fintech"]);
  });

  it("agrupa por fuente ordenando por enviadas", () => {
    expect(stats.bySource[0]).toEqual({ source: "linkedin", sent: 4, responded: 2 });
    expect(stats.bySource.reduce((sum, { sent }) => sum + sent, 0)).toBe(13);
  });

  it("en las últimas 8 semanas entran todas las enviadas menos Mirlo Apps (hace 60 días)", () => {
    expect(stats.weekly).toHaveLength(8);
    expect(stats.weekly.reduce((sum, { count }) => sum + count, 0)).toBe(12);
  });
});
