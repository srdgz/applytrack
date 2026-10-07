import { aSnapshot, calendarDate } from "@applytrack/core/testing";
import { describe, expect, it } from "vitest";

import { parseApplicationRow, parseSearchResult, toSavePayload } from "./rows";

const complete = aSnapshot({
  id: "11111111-0000-0000-0000-000000000001",
  ownerId: "00000000-0000-0000-0000-00000000000a",
  company: "Árbol Studio",
  jobUrl: "https://arbol.example/jobs/1",
  location: "Madrid",
  salary: { min: 30000, max: 36000, currency: "EUR" },
  appliedAt: calendarDate("2026-09-10"),
  tags: ["Vue", "React"],
  notes: "Entrevista el lunes",
  status: "screening",
  history: [
    { from: null, to: "applied", changedAt: "2026-09-10T09:00:00.000Z" },
    { from: "applied", to: "screening", changedAt: "2026-09-12T09:00:00.000Z", note: "Llamada" },
  ],
  updatedAt: "2026-09-12T09:00:00.000Z",
});

const minimal = aSnapshot({ id: "11111111-0000-0000-0000-000000000002" });

const asDatabaseRow = (payload: ReturnType<typeof toSavePayload>) => ({
  ...payload.application,
  created_at: payload.application.created_at.replace(".000Z", "+00:00"),
  updated_at: payload.application.updated_at.replace(".000Z", "+00:00"),
  status_changes: [...payload.history]
    .reverse()
    .map((change) => ({ ...change, changed_at: change.changed_at.replace("Z", "+00:00") })),
});

describe("filas de Supabase", () => {
  it.each([
    ["completa", complete],
    ["mínima", minimal],
  ])("una candidatura %s sobrevive a guardar y leer", (_, snapshot) => {
    expect(parseApplicationRow(asDatabaseRow(toSavePayload(snapshot)))).toEqual(snapshot);
  });

  it("guarda el historial con su posición", () => {
    expect(toSavePayload(complete).history.map(({ seq }) => seq)).toEqual([0, 1]);
  });

  it("conserva la moneda aunque no haya cifras", () => {
    const onlyCurrency = aSnapshot({ id: "c-1", salary: { currency: "GBP" } });

    expect(parseApplicationRow(asDatabaseRow(toSavePayload(onlyCurrency)))?.salary).toEqual({
      currency: "GBP",
    });
  });

  it.each([
    ["sin historial", { status_changes: [] }],
    ["con un estado desconocido", { status: "ghosted" }],
    ["con una empresa vacía", { company: "  " }],
    ["con una fecha imposible", { applied_at: "2026-02-30" }],
    ["con una marca de tiempo inválida", { updated_at: "ayer" }],
    ["con demasiadas etiquetas", { tags: Array.from({ length: 11 }, (_, i) => `t${String(i)}`) }],
  ])("CA-104-12 · descarta una fila %s", (_, override) => {
    expect(parseApplicationRow({ ...asDatabaseRow(toSavePayload(minimal)), ...override })).toBe(
      null,
    );
  });

  it("valida la respuesta de la búsqueda", () => {
    expect(parseSearchResult({ total: 1, items: [{}] }).success).toBe(true);
    expect(parseSearchResult({ items: [] }).success).toBe(false);
  });
});
