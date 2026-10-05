import { describe, expect, it } from "vitest";

import { aSnapshot, calendarDate } from "../../../testing";
import { daysBetween } from "../shared/calendar-date";
import { CLOSED_STATUSES, isActiveStatus, toSummary } from "./summary";

const today = calendarDate("2026-10-05");

describe("toSummary", () => {
  it.each([
    ["2026-10-05T12:00:00.000Z", 0, false],
    ["2026-09-21T12:00:00.000Z", 14, false],
    ["2026-09-20T12:00:00.000Z", 15, true],
  ])("CA-102-09 · actualizada el %s: %i días, parada = %s", (updatedAt, days, stale) => {
    const summary = toSummary(aSnapshot({ id: "a", status: "applied", updatedAt }), today);

    expect(summary.daysSinceUpdate).toBe(days);
    expect(summary.stale).toBe(stale);
  });

  it.each(CLOSED_STATUSES)("CA-102-09 · %s nunca está parada", (status) => {
    const summary = toSummary(
      aSnapshot({ id: "a", status, updatedAt: "2026-01-01T12:00:00.000Z" }),
      today,
    );

    expect(summary.stale).toBe(false);
  });

  it("una fecha futura por desajuste de reloj cuenta como 0 días", () => {
    expect(
      toSummary(aSnapshot({ id: "a", updatedAt: "2026-10-08T12:00:00.000Z" }), today)
        .daysSinceUpdate,
    ).toBe(0);
  });

  it("distingue estados activos y cerrados", () => {
    expect(isActiveStatus("offer")).toBe(true);
    expect(isActiveStatus("no_response")).toBe(false);
  });
});

describe("daysBetween", () => {
  it("cuenta días de calendario, también entre meses y años bisiestos", () => {
    expect(daysBetween(calendarDate("2026-09-30"), calendarDate("2026-10-01"))).toBe(1);
    expect(daysBetween(calendarDate("2024-02-28"), calendarDate("2024-03-01"))).toBe(2);
    expect(daysBetween(calendarDate("2026-10-05"), calendarDate("2026-10-01"))).toBe(-4);
  });
});
