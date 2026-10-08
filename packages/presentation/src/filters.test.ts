import { describe, expect, it } from "vitest";

import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersFromQuery,
  queryFromFilters,
  toApplicationQuery,
  withoutFilters,
} from "./filters";

describe("filtersFromQuery", () => {
  it("sin parámetros devuelve los filtros por defecto", () => {
    expect(filtersFromQuery({})).toEqual(DEFAULT_FILTERS);
  });

  it("lee todos los parámetros", () => {
    expect(
      filtersFromQuery({
        q: " vue remoto ",
        status: "applied,screening",
        mode: "remote",
        source: "linkedin,referral",
        tag: "Vue,TypeScript",
        archived: "only",
        sort: "company",
        dir: "desc",
      }),
    ).toEqual({
      text: "vue remoto",
      statuses: ["applied", "screening"],
      workModes: ["remote"],
      sources: ["linkedin", "referral"],
      tags: ["Vue", "TypeScript"],
      archived: "only",
      sort: { field: "company", direction: "desc" },
    });
  });

  it("CA-102-18 · descarta los valores no válidos y aplica el resto", () => {
    expect(
      filtersFromQuery({
        status: "hired,applied,,applied",
        mode: "mars",
        archived: "maybe",
        sort: "salary",
        dir: "sideways",
      }),
    ).toEqual({ ...DEFAULT_FILTERS, statuses: ["applied"] });
  });

  it("usa el primer valor si un parámetro llega repetido", () => {
    expect(filtersFromQuery({ q: ["uno", "dos"], status: [null, "applied"] })).toMatchObject({
      text: "uno",
      statuses: [],
    });
  });

  it("si falta la dirección, usa la natural de cada campo", () => {
    expect(filtersFromQuery({ sort: "company" }).sort).toEqual({
      field: "company",
      direction: "asc",
    });
    expect(filtersFromQuery({ sort: "appliedAt" }).sort).toEqual({
      field: "appliedAt",
      direction: "desc",
    });
  });
});

describe("queryFromFilters", () => {
  it("no escribe los valores por defecto", () => {
    expect(queryFromFilters(DEFAULT_FILTERS)).toEqual({});
    expect(
      queryFromFilters({ ...DEFAULT_FILTERS, sort: { field: "company", direction: "asc" } }),
    ).toEqual({ sort: "company" });
  });

  it("ida y vuelta conserva los filtros", () => {
    const filters = {
      text: "react",
      statuses: ["offer" as const],
      workModes: ["hybrid" as const, "onsite" as const],
      sources: ["recruiter" as const],
      tags: ["Vue"],
      archived: "include" as const,
      sort: { field: "updatedAt" as const, direction: "asc" as const },
    };

    expect(filtersFromQuery(queryFromFilters(filters))).toEqual(filters);
  });
});

describe("utilidades", () => {
  it("cuenta los filtros activos sin contar el orden", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        text: "vue",
        statuses: ["applied", "offer"],
        archived: "only",
        sort: { field: "company", direction: "asc" },
      }),
    ).toBe(4);
  });

  it("quitar filtros conserva el orden", () => {
    const sort = { field: "company" as const, direction: "asc" as const };

    expect(withoutFilters({ ...DEFAULT_FILTERS, text: "vue", sort })).toEqual({
      ...DEFAULT_FILTERS,
      sort,
    });
  });

  it("convierte los filtros en consulta de core", () => {
    expect(toApplicationQuery(DEFAULT_FILTERS)).not.toHaveProperty("text");
    expect(toApplicationQuery({ ...DEFAULT_FILTERS, text: "vue" })).toMatchObject({ text: "vue" });
  });
});
