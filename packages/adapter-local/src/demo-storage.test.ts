import { describe, expect, it } from "vitest";

import { DemoStorage } from "./demo-storage";
import { MemoryKeyValueStore } from "./key-value-store";
import { buildSeed } from "./seed/build-seed";
import { DEMO_KEY } from "./storage-keys";

const now = new Date("2026-10-05T10:00:00.000Z");

const storageWith = async (raw: string) => {
  const store = new MemoryKeyValueStore();
  await store.setItem(DEMO_KEY, raw);
  const warnings: string[] = [];
  return { storage: new DemoStorage(store, (message) => warnings.push(message)), warnings };
};

describe("DemoStorage", () => {
  it("sin datos devuelve absent y una lista vacía", async () => {
    const storage = new DemoStorage(new MemoryKeyValueStore());

    expect(await storage.read()).toEqual({ kind: "absent" });
    expect(await storage.applications()).toEqual([]);
  });

  it("guarda y recupera un conjunto completo", async () => {
    const storage = new DemoStorage(new MemoryKeyValueStore());
    const applications = buildSeed("es", now);

    await storage.replace({ version: 1, locale: "es", seededAt: now.toISOString(), applications });

    expect(await storage.applications()).toEqual(applications);
  });

  it.each([
    ["JSON corrupto", "{no es json"],
    [
      "versión desconocida",
      JSON.stringify({ version: 2, locale: "es", seededAt: null, applications: [] }),
    ],
    ["estructura inesperada", JSON.stringify([1, 2, 3])],
  ])("CA-103-09 · con %s devuelve corrupt y avisa", async (_, raw) => {
    const { storage, warnings } = await storageWith(raw);

    expect(await storage.read()).toEqual({ kind: "corrupt" });
    expect(await storage.applications()).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("CA-103-10 · descarta las filas inválidas, avisa y carga el resto", async () => {
    const [first, second] = buildSeed("en", now);
    const { storage, warnings } = await storageWith(
      JSON.stringify({
        version: 1,
        locale: "en",
        seededAt: null,
        applications: [
          first,
          { ...second, status: "hired" },
          { ...first, id: "x", appliedAt: "2026-02-30" },
          { ...first, id: "y", company: "   " },
          { ...first, id: "z", tags: ["t".repeat(31)] },
          "basura",
        ],
      }),
    );

    expect(await storage.applications()).toEqual([first]);
    expect(warnings).toHaveLength(5);
  });

  it("conserva las notas de los cambios de estado al leer", async () => {
    const [first] = buildSeed("es", now);
    if (!first) throw new Error("sin datos de ejemplo");
    const withNote = {
      ...first,
      history: first.history.map((change) => ({ ...change, note: "Llamada con RR. HH." })),
    };
    const { storage } = await storageWith(
      JSON.stringify({ version: 1, locale: "es", seededAt: null, applications: [withNote] }),
    );

    expect(await storage.applications()).toEqual([withNote]);
  });
});
