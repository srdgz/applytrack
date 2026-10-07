import { describe, expect, it } from "vitest";

import { MemoryKeyValueStore } from "./key-value-store";
import { LocalPreferencesStore } from "./local-preferences-store";

describe("LocalPreferencesStore", () => {
  it("sin nada guardado devuelve null", async () => {
    expect(await new LocalPreferencesStore(new MemoryKeyValueStore()).get()).toBeNull();
  });

  it("guarda y recupera idioma y tema", async () => {
    const preferences = new LocalPreferencesStore(new MemoryKeyValueStore());

    await preferences.save({ locale: "en", theme: "dark" });

    expect(await preferences.get()).toEqual({ locale: "en", theme: "dark" });
  });

  it("reutiliza el idioma guardado antes de que existiera el tema", async () => {
    const store = new MemoryKeyValueStore();
    await store.setItem("applytrack:locale", "en");

    expect(await new LocalPreferencesStore(store).get()).toEqual({
      locale: "en",
      theme: "system",
    });
  });

  it("descarta valores desconocidos", async () => {
    const store = new MemoryKeyValueStore();
    await store.setItem("applytrack:locale", "fr");

    expect(await new LocalPreferencesStore(store).get()).toBeNull();
  });
});
