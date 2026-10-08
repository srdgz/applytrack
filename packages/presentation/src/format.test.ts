import { calendarDate } from "@applytrack/core/testing/doubles";
import { describe, expect, it } from "vitest";

import { createFormatter } from "./format";

describe("createFormatter", () => {
  it("formatea días relativos en español e inglés", () => {
    expect(createFormatter("es").daysAgo(0)).toBe("hoy");
    expect(createFormatter("es").daysAgo(1)).toBe("ayer");
    expect(createFormatter("es").daysAgo(5)).toBe("hace 5 días");
    expect(createFormatter("en").daysAgo(1)).toBe("yesterday");
    expect(createFormatter("en").daysAgo(5)).toBe("5 days ago");
  });

  it("calcula los días desde una fecha, sin negativos", () => {
    const format = createFormatter("es");

    expect(format.since("2026-10-01T10:00:00.000Z", calendarDate("2026-10-05"))).toBe(
      "hace 4 días",
    );
    expect(format.since("2026-10-09T10:00:00.000Z", calendarDate("2026-10-05"))).toBe("hoy");
  });

  it("formatea fechas, porcentajes y salarios", () => {
    const es = createFormatter("es");
    const en = createFormatter("en");

    expect(en.calendarDate(calendarDate("2026-10-05"))).toBe("Oct 5, 2026");
    expect(en.shortCalendarDate(calendarDate("2026-10-05"))).toBe("Oct 5");
    expect(es.ratio(1, 4).replace(/\s/g, " ")).toBe("25 %");
    expect(en.salary({ min: 30000, max: 36000, currency: "EUR" })).toBe("€30,000 – €36,000");
    expect(en.salary({ max: 50000, currency: "USD" })).toBe("$50,000");
    expect(en.instant("2026-10-05T10:00:00.000Z")).toContain("2026");
  });
});
