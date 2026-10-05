import { describe, expect, it } from "vitest";

import { FakeDemoData } from "../../../testing";
import { ExitDemo, IsDemoActive, ResetDemo, StartDemo } from "./demo";

describe("casos de uso de la demo", () => {
  it("StartDemo activa la demo con el idioma indicado", async () => {
    const demo = new FakeDemoData();

    await new StartDemo({ demo }).execute("es");

    expect(demo.active).toBe(true);
    expect(demo.calls).toEqual(["start:es"]);
  });

  it("ResetDemo vuelve a cargar los ejemplos en el idioma indicado", async () => {
    const demo = new FakeDemoData();

    await new ResetDemo({ demo }).execute("en");

    expect(demo.calls).toEqual(["reset:en"]);
  });

  it("IsDemoActive indica si la demo está activa", async () => {
    const demo = new FakeDemoData();
    const isDemoActive = new IsDemoActive({ demo });

    expect(await isDemoActive.execute()).toBe(false);
    demo.active = true;
    expect(await isDemoActive.execute()).toBe(true);
  });

  it("ExitDemo sale de la demo", async () => {
    const demo = new FakeDemoData();
    demo.active = true;

    await new ExitDemo({ demo }).execute();

    expect(demo.active).toBe(false);
    expect(demo.calls).toEqual(["exit"]);
  });
});
