import { describe, expect, it } from "vitest";

import { calendarDateFromDate, isAfter, parseCalendarDate } from "./calendar-date";

describe("CalendarDate", () => {
  it.each(["2026-10-05", "2024-02-29", "2000-02-29", "2026-12-31"])("acepta %s", (value) => {
    expect(parseCalendarDate(value)).toBe(value);
  });

  it.each([
    "2026-02-30",
    "2025-02-29",
    "1900-02-29",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
    "2026-10-00",
    "05/10/2026",
    "2026-1-5",
    "",
  ])("rechaza %s", (value) => {
    expect(parseCalendarDate(value)).toBeNull();
  });

  it("convierte una fecha a su día en la zona horaria local", () => {
    expect(calendarDateFromDate(new Date(2026, 9, 5, 23, 30))).toBe("2026-10-05");
  });

  it("compara fechas", () => {
    const earlier = parseCalendarDate("2026-10-04");
    const later = parseCalendarDate("2026-10-05");
    if (earlier === null || later === null) throw new Error("fechas de prueba inválidas");

    expect(isAfter(later, earlier)).toBe(true);
    expect(isAfter(earlier, later)).toBe(false);
    expect(isAfter(later, later)).toBe(false);
  });
});
