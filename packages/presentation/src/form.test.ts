import { aSnapshot, calendarDate } from "@applytrack/core/testing/doubles";
import { describe, expect, it } from "vitest";

import {
  emptyValues,
  groupOf,
  sameValues,
  toDetailsDraft,
  toDraft,
  valuesFromSnapshot,
} from "./form";

describe("form-values", () => {
  it("un formulario nuevo empieza en «Me interesa» y en EUR", () => {
    expect(emptyValues()).toMatchObject({ status: "wishlist", currency: "EUR", tags: [] });
  });

  it("convierte las cifras del salario y deja ausentes las vacías", () => {
    const draft = toDetailsDraft({ ...emptyValues(), salaryMin: "35000", salaryMax: " " });

    expect(draft.salary).toEqual({ min: 35000, max: undefined, currency: "EUR" });
  });

  it("solo envía la fecha de candidatura si el estado la admite", () => {
    const values = { ...emptyValues(), appliedAt: "2026-10-01" };

    expect(toDraft(values).appliedAt).toBeUndefined();
    expect(toDraft({ ...values, status: "applied" }).appliedAt).toBe("2026-10-01");
  });

  it("rellena el formulario con una candidatura guardada", () => {
    const values = valuesFromSnapshot(
      aSnapshot({
        id: "a",
        status: "interviewing",
        appliedAt: calendarDate("2026-09-01"),
        salary: { min: 30000, currency: "GBP" },
        tags: ["Vue"],
      }),
    );

    expect(values).toMatchObject({
      status: "interviewing",
      appliedAt: "2026-09-01",
      salaryMin: "30000",
      salaryMax: "",
      currency: "GBP",
      tags: ["Vue"],
      jobUrl: "",
    });
  });

  it("agrupa los errores por campo", () => {
    expect(groupOf({ field: "salary.min", code: "INVALID_SALARY_RANGE" })).toBe("salary");
    expect(groupOf({ field: "tags.3", code: "DUPLICATED_TAG" })).toBe("tags");
    expect(groupOf({ field: "company", code: "REQUIRED_FIELD" })).toBe("company");
  });

  it("detecta cambios comparando valores", () => {
    const values = emptyValues();

    expect(sameValues(values, emptyValues())).toBe(true);
    expect(sameValues(values, { ...values, tags: ["Vue"] })).toBe(false);
  });
});
