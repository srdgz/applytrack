import { describe, expect, it } from "vitest";

import { aSnapshot, calendarDate } from "../../../testing";
import { addDays, startOfWeek } from "../shared/calendar-date";
import type { StatusChange } from "./status-change";
import { computeDashboardStats } from "./stats";

const today = calendarDate("2026-10-07");

const step = (from: StatusChange["from"], to: StatusChange["to"], day: string): StatusChange => ({
  from,
  to,
  changedAt: `${day}T12:00:00.000Z`,
});

describe("computeDashboardStats", () => {
  it("CA-105-01 · sin candidaturas todo está a cero", () => {
    const stats = computeDashboardStats([], today);

    expect(stats).toMatchObject({
      total: 0,
      active: 0,
      closed: 0,
      sent: 0,
      responded: 0,
      interviewed: 0,
      offered: 0,
      medianDaysToResponse: null,
      bySource: [],
      stale: [],
    });
    expect(Object.values(stats.byStatus).every((count) => count === 0)).toBe(true);
    expect(stats.weekly.map(({ count }) => count)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("CA-105-05 · una archivada parada cuenta en las cifras pero no en la lista de paradas", () => {
    const stats = computeDashboardStats(
      [
        aSnapshot({
          id: "archived",
          status: "applied",
          archived: true,
          history: [step(null, "applied", "2026-08-01")],
          updatedAt: "2026-08-01T12:00:00.000Z",
        }),
        aSnapshot({
          id: "visible",
          status: "applied",
          history: [step(null, "applied", "2026-08-02")],
          updatedAt: "2026-08-02T12:00:00.000Z",
        }),
      ],
      today,
    );

    expect(stats).toMatchObject({ total: 2, active: 2, sent: 2 });
    expect(stats.stale.map(({ id }) => id)).toEqual(["visible"]);
  });

  it("CA-105-06 · 8 semanas que empiezan en lunes; un domingo cuenta en su semana", () => {
    const stats = computeDashboardStats(
      [
        aSnapshot({ id: "sunday", status: "applied", appliedAt: calendarDate("2026-10-04") }),
        aSnapshot({ id: "monday", status: "applied", appliedAt: calendarDate("2026-10-05") }),
        aSnapshot({ id: "old", status: "applied", appliedAt: calendarDate("2026-08-01") }),
      ],
      today,
    );

    expect(stats.weekly).toHaveLength(8);
    expect(stats.weekly.at(-1)).toEqual({ weekStart: "2026-10-05", count: 1 });
    expect(stats.weekly.at(-2)).toEqual({ weekStart: "2026-09-28", count: 1 });
    expect(stats.weekly[0]?.weekStart).toBe("2026-08-17");
    expect(stats.weekly.reduce((sum, { count }) => sum + count, 0)).toBe(2);
  });

  it("CA-105-07 · un rechazo es respuesta; retirarse y sin respuesta, no", () => {
    const stats = computeDashboardStats(
      [
        aSnapshot({
          id: "rejected",
          status: "rejected",
          source: "linkedin",
          history: [step(null, "applied", "2026-09-01"), step("applied", "rejected", "2026-09-04")],
        }),
        aSnapshot({
          id: "withdrawn",
          status: "withdrawn",
          source: "linkedin",
          history: [
            step(null, "applied", "2026-09-01"),
            step("applied", "withdrawn", "2026-09-02"),
          ],
        }),
        aSnapshot({
          id: "silent",
          status: "no_response",
          source: "referral",
          history: [
            step(null, "applied", "2026-09-01"),
            step("applied", "no_response", "2026-09-20"),
          ],
        }),
        aSnapshot({
          id: "wish",
          status: "wishlist",
          history: [step(null, "wishlist", "2026-09-01")],
        }),
      ],
      today,
    );

    expect(stats).toMatchObject({ sent: 3, responded: 1, medianDaysToResponse: 3 });
    expect(stats.bySource).toEqual([
      { source: "linkedin", sent: 2, responded: 1 },
      { source: "referral", sent: 1, responded: 0 },
    ]);
  });

  it("la mediana con un número par de respuestas es la media de las dos centrales", () => {
    const responded = (id: string, days: number) =>
      aSnapshot({
        id,
        status: "screening",
        history: [
          step(null, "applied", "2026-09-01"),
          step("applied", "screening", addDays(calendarDate("2026-09-01"), days)),
        ],
      });

    expect(
      computeDashboardStats([responded("a", 2), responded("b", 5)], today).medianDaysToResponse,
    ).toBe(3.5);
  });

  it("cuenta entrevistas y ofertas aunque la candidatura ya esté cerrada", () => {
    const stats = computeDashboardStats(
      [
        aSnapshot({
          id: "closed",
          status: "accepted",
          history: [
            step(null, "applied", "2026-09-01"),
            step("applied", "interviewing", "2026-09-05"),
            step("interviewing", "offer", "2026-09-10"),
            step("offer", "accepted", "2026-09-12"),
          ],
        }),
      ],
      today,
    );

    expect(stats).toMatchObject({ interviewed: 1, offered: 1, closed: 1, active: 0 });
    expect(stats.byStatus.accepted).toBe(1);
  });
});

describe("semanas", () => {
  it("startOfWeek devuelve el lunes, también entre meses y años", () => {
    expect(startOfWeek(calendarDate("2026-10-07"))).toBe("2026-10-05");
    expect(startOfWeek(calendarDate("2026-10-05"))).toBe("2026-10-05");
    expect(startOfWeek(calendarDate("2026-11-01"))).toBe("2026-10-26");
    expect(startOfWeek(calendarDate("2027-01-02"))).toBe("2026-12-28");
  });
});
