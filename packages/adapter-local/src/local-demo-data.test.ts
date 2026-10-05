import { CreateApplication, ExitDemo, ResetDemo, StartDemo } from "@applytrack/core";
import { FixedClock, SequentialIdGenerator } from "@applytrack/core/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { DemoSessionProvider } from "./demo-session-provider";
import { DemoStorage } from "./demo-storage";
import { MemoryKeyValueStore } from "./key-value-store";
import { LocalApplicationRepository } from "./local-application-repository";
import { LocalDemoData } from "./local-demo-data";
import { DEMO_KEY } from "./storage-keys";

describe("LocalDemoData", () => {
  let store: MemoryKeyValueStore;
  let storage: DemoStorage;
  let demo: LocalDemoData;
  let session: DemoSessionProvider;
  let clock: FixedClock;

  beforeEach(() => {
    store = new MemoryKeyValueStore();
    storage = new DemoStorage(store);
    clock = new FixedClock("2026-10-05T10:00:00.000Z");
    demo = new LocalDemoData({ store, storage, clock });
    session = new DemoSessionProvider(store);
  });

  it("sin empezar la demo no hay sesión ni datos", async () => {
    expect(await demo.isActive()).toBe(false);
    expect(await session.currentUser()).toBeNull();
    expect(await storage.applications()).toEqual([]);
  });

  it("CA-103-02 · al empezar carga las 15 candidaturas y abre la sesión demo", async () => {
    await new StartDemo({ demo }).execute("es");

    expect(await demo.isActive()).toBe(true);
    expect(await session.currentUser()).toBe("demo-user");
    expect(await storage.applications()).toHaveLength(15);
    expect(await storage.read()).toMatchObject({
      kind: "ok",
      dataset: { locale: "es", seededAt: "2026-10-05T10:00:00.000Z" },
    });
  });

  it("CA-103-03 · al volver a empezar conserva los datos de la visita anterior", async () => {
    await new StartDemo({ demo }).execute("es");
    const created = await new CreateApplication({
      repository: new LocalApplicationRepository(storage),
      session,
      clock,
      ids: new SequentialIdGenerator(),
    }).execute({
      company: "Mi empresa",
      position: "Frontend",
      source: "other",
      workMode: "remote",
      status: "wishlist",
    });
    expect(created.ok).toBe(true);
    await new ExitDemo({ demo }).execute();

    await new StartDemo({ demo }).execute("en");

    const applications = await storage.applications();
    expect(applications).toHaveLength(16);
    expect(applications[0]?.position).toBe("Desarrollo Frontend (Vue)");
  });

  it("CA-103-04 · reiniciar sustituye todo por los ejemplos en el idioma indicado", async () => {
    await new StartDemo({ demo }).execute("es");
    await storage.update((dataset) => ({
      ...dataset,
      applications: dataset.applications.slice(0, 2),
    }));

    await new ResetDemo({ demo }).execute("en");

    const applications = await storage.applications();
    expect(applications).toHaveLength(15);
    expect(applications[0]?.position).toBe("Frontend Developer (Vue)");
  });

  it("CA-103-05 · salir cierra la sesión demo pero conserva los datos", async () => {
    await new StartDemo({ demo }).execute("es");

    await new ExitDemo({ demo }).execute();

    expect(await demo.isActive()).toBe(false);
    expect(await session.currentUser()).toBeNull();
    expect(await storage.applications()).toHaveLength(15);
  });

  it("CA-103-09 · si los datos están corruptos, al empezar vuelve a cargar los ejemplos", async () => {
    await store.setItem(DEMO_KEY, "{corrupto");

    await new StartDemo({ demo }).execute("es");

    expect(await storage.applications()).toHaveLength(15);
  });

  it("con un idioma no soportado carga los ejemplos en inglés", async () => {
    await new StartDemo({ demo }).execute("fr");

    expect((await storage.applications())[0]?.position).toBe("Frontend Developer (Vue)");
  });
});
