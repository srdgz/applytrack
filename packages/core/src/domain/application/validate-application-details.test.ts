import { describe, expect, it } from "vitest";

import type { CalendarDate } from "../shared/calendar-date";
import { parseCalendarDate } from "../shared/calendar-date";
import type { ApplicationDetailsDraft } from "./application-draft";
import type { ValidationContext } from "./validate-application-details";
import { validateApplicationDetails } from "./validate-application-details";

const today = parseCalendarDate("2026-10-05") as CalendarDate;

const draft = (overrides: Partial<ApplicationDetailsDraft> = {}): ApplicationDetailsDraft => ({
  company: "Acme",
  position: "Frontend Developer",
  source: "linkedin",
  workMode: "remote",
  ...overrides,
});

const issuesOf = (input: ApplicationDetailsDraft, context: Partial<ValidationContext> = {}) => {
  const result = validateApplicationDetails(input, { status: "applied", today, ...context });
  return result.ok ? [] : result.error;
};

const valueOf = (input: ApplicationDetailsDraft, context: Partial<ValidationContext> = {}) => {
  const result = validateApplicationDetails(input, { status: "applied", today, ...context });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
};

describe("validateApplicationDetails", () => {
  describe("campos obligatorios", () => {
    it("exige empresa y puesto", () => {
      expect(issuesOf(draft({ company: "  ", position: "" }))).toEqual([
        { field: "company", code: "REQUIRED_FIELD" },
        { field: "position", code: "REQUIRED_FIELD" },
      ]);
    });

    it("limita empresa y puesto a 120 caracteres", () => {
      expect(issuesOf(draft({ company: "a".repeat(121), position: "b".repeat(120) }))).toEqual([
        { field: "company", code: "FIELD_TOO_LONG", meta: { max: 120 } },
      ]);
    });

    it("rechaza fuente y modalidad fuera de la lista", () => {
      expect(issuesOf(draft({ source: "twitter", workMode: "mars" }))).toEqual([
        { field: "source", code: "INVALID_OPTION" },
        { field: "workMode", code: "INVALID_OPTION" },
      ]);
    });
  });

  describe("CA-100-08 · normalización de textos", () => {
    it("quita espacios y trata como ausentes los opcionales vacíos", () => {
      const value = valueOf(
        draft({ company: "  Acme ", position: " Dev ", location: "   ", notes: "", jobUrl: " " }),
      );

      expect(value.company).toBe("Acme");
      expect(value.position).toBe("Dev");
      expect(value).not.toHaveProperty("location");
      expect(value).not.toHaveProperty("notes");
      expect(value).not.toHaveProperty("jobUrl");
    });

    it("limita ubicación y notas", () => {
      expect(issuesOf(draft({ location: "x".repeat(121), notes: "y".repeat(5001) }))).toEqual([
        { field: "location", code: "FIELD_TOO_LONG", meta: { max: 120 } },
        { field: "notes", code: "FIELD_TOO_LONG", meta: { max: 5000 } },
      ]);
    });
  });

  describe("jobUrl", () => {
    it.each([
      "https://acme.example/jobs/1",
      "http://jobs.acme.io",
      "https://acme.com/?ref=linkedin",
    ])("acepta %s", (jobUrl) => {
      expect(valueOf(draft({ jobUrl })).jobUrl).toBe(jobUrl);
    });

    it.each(["acme.com", "ftp://acme.com", "https://", "https://acme", "https://ac me.com"])(
      "rechaza %s",
      (jobUrl) => {
        expect(issuesOf(draft({ jobUrl }))).toEqual([{ field: "jobUrl", code: "INVALID_URL" }]);
      },
    );

    it("limita la longitud a 2.048 caracteres", () => {
      const jobUrl = `https://acme.com/${"a".repeat(2048)}`;
      expect(issuesOf(draft({ jobUrl }))).toContainEqual({
        field: "jobUrl",
        code: "FIELD_TOO_LONG",
        meta: { max: 2048 },
      });
    });
  });

  describe("CA-100-06 · salario", () => {
    it("usa EUR si no se indica moneda", () => {
      expect(valueOf(draft({ salary: { min: 30000, max: 36000 } })).salary).toEqual({
        min: 30000,
        max: 36000,
        currency: "EUR",
      });
    });

    it("acepta solo mínimo o solo máximo", () => {
      expect(valueOf(draft({ salary: { min: 30000, currency: "GBP" } })).salary).toEqual({
        min: 30000,
        currency: "GBP",
      });
      expect(valueOf(draft({ salary: { max: 90000, currency: "USD" } })).salary).toEqual({
        max: 90000,
        currency: "USD",
      });
    });

    it("trata como ausente un salario sin cifras", () => {
      expect(valueOf(draft({ salary: { currency: "GBP" } }))).not.toHaveProperty("salary");
    });

    it("rechaza mínimo mayor que máximo", () => {
      expect(issuesOf(draft({ salary: { min: 40000, max: 30000 } }))).toEqual([
        { field: "salary", code: "INVALID_SALARY_RANGE" },
      ]);
    });

    it("rechaza cifras no enteras o no positivas", () => {
      expect(issuesOf(draft({ salary: { min: 0, max: 1.5 } }))).toEqual([
        { field: "salary.min", code: "INVALID_SALARY_RANGE" },
        { field: "salary.max", code: "INVALID_SALARY_RANGE" },
      ]);
    });

    it("rechaza monedas no admitidas", () => {
      expect(issuesOf(draft({ salary: { min: 30000, currency: "JPY" } }))).toEqual([
        { field: "salary.currency", code: "UNSUPPORTED_CURRENCY" },
      ]);
    });
  });

  describe("fecha de candidatura", () => {
    it("CA-100-02 · con estado applied y sin fecha, usa la de hoy", () => {
      expect(valueOf(draft()).appliedAt).toBe("2026-10-05");
    });

    it("con un estado posterior a applied y sin fecha, también usa la de hoy", () => {
      expect(valueOf(draft(), { status: "interviewing" }).appliedAt).toBe("2026-10-05");
    });

    it("acepta una fecha pasada", () => {
      expect(valueOf(draft({ appliedAt: "2026-09-30" })).appliedAt).toBe("2026-09-30");
    });

    it("CA-100-04 · no se permite con estado wishlist", () => {
      expect(issuesOf(draft({ appliedAt: "2026-10-01" }), { status: "wishlist" })).toEqual([
        { field: "appliedAt", code: "APPLIED_AT_NOT_ALLOWED" },
      ]);
    });

    it("con estado wishlist y sin fecha, queda ausente", () => {
      expect(valueOf(draft(), { status: "wishlist" })).not.toHaveProperty("appliedAt");
    });

    it("CA-100-05 · rechaza fechas futuras", () => {
      expect(issuesOf(draft({ appliedAt: "2026-10-06" }))).toEqual([
        { field: "appliedAt", code: "FUTURE_DATE" },
      ]);
    });

    it("CA-100-05 · rechaza fechas imposibles", () => {
      expect(issuesOf(draft({ appliedAt: "2026-02-30" }))).toEqual([
        { field: "appliedAt", code: "INVALID_DATE" },
      ]);
    });

    it("con estado desconocido valida el formato pero no rellena la fecha", () => {
      expect(issuesOf(draft({ appliedAt: "mañana" }), { status: undefined })).toEqual([
        { field: "appliedAt", code: "INVALID_DATE" },
      ]);
      expect(valueOf(draft(), { status: undefined })).not.toHaveProperty("appliedAt");
    });
  });

  describe("etiquetas", () => {
    it("quita espacios y descarta las vacías", () => {
      expect(valueOf(draft({ tags: [" Vue ", "", "  ", "React Native"] })).tags).toEqual([
        "Vue",
        "React Native",
      ]);
    });

    it("sin etiquetas devuelve una lista vacía", () => {
      expect(valueOf(draft()).tags).toEqual([]);
    });

    it("CA-100-07 · detecta repetidas sin distinguir mayúsculas ni tildes", () => {
      expect(issuesOf(draft({ tags: ["Vue", "vue ", "Diseño", "DISENO"] }))).toEqual([
        { field: "tags.1", code: "DUPLICATED_TAG", meta: { tag: "vue" } },
        { field: "tags.3", code: "DUPLICATED_TAG", meta: { tag: "DISENO" } },
      ]);
    });

    it("limita a 10 etiquetas de hasta 30 caracteres", () => {
      const tags = Array.from({ length: 11 }, (_, index) => `tag-${String(index)}`);
      expect(issuesOf(draft({ tags }))).toEqual([
        { field: "tags", code: "TOO_MANY_TAGS", meta: { max: 10 } },
      ]);
      expect(issuesOf(draft({ tags: ["", "t".repeat(31)] }))).toEqual([
        { field: "tags.1", code: "FIELD_TOO_LONG", meta: { max: 30 } },
      ]);
    });
  });

  it("CA-100-03 · devuelve todos los errores a la vez", () => {
    expect(
      issuesOf(
        draft({
          company: "",
          workMode: "",
          jobUrl: "acme",
          salary: { min: 2, max: 1 },
          appliedAt: "2027-01-01",
        }),
      ).map(({ field }) => field),
    ).toEqual(["company", "workMode", "jobUrl", "salary", "appliedAt"]);
  });
});
