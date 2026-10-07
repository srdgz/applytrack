import { describe, expect, it } from "vitest";

import { InMemoryPreferencesStore } from "../../../testing";
import type { Preferences } from "../../domain/preferences/preferences";
import { GetPreferences, UpdatePreferences } from "./preferences";

const fallback: Preferences = { locale: "es", theme: "system" };
const english: Preferences = { locale: "en", theme: "light" };
const dark: Preferences = { locale: "es", theme: "dark" };

describe("GetPreferences", () => {
  it("CA-104-05 · con cuenta y perfil con preferencias gana el perfil y se copia al dispositivo", async () => {
    const device = new InMemoryPreferencesStore(english);
    const profile = new InMemoryPreferencesStore(dark);

    expect(await new GetPreferences({ device, profile }).execute({ fallback })).toEqual(dark);
    expect(device.peek()).toEqual(dark);
  });

  it("no reescribe el dispositivo si ya coincide con el perfil", async () => {
    const device = new InMemoryPreferencesStore(dark);
    const profile = new InMemoryPreferencesStore(dark);

    await new GetPreferences({ device, profile }).execute({ fallback });

    expect(device.saves).toBe(0);
  });

  it("CA-104-05 · con un perfil vacío se suben las del dispositivo", async () => {
    const device = new InMemoryPreferencesStore(english);
    const profile = new InMemoryPreferencesStore(null);

    expect(await new GetPreferences({ device, profile }).execute({ fallback })).toEqual(english);
    expect(profile.peek()).toEqual(english);
  });

  it("con perfil y dispositivo vacíos se sube el valor por defecto", async () => {
    const profile = new InMemoryPreferencesStore(null);

    const result = await new GetPreferences({
      device: new InMemoryPreferencesStore(),
      profile,
    }).execute({ fallback });

    expect(result).toEqual(fallback);
    expect(profile.peek()).toEqual(fallback);
  });

  it("CA-104-05 · sin cuenta usa las del dispositivo", async () => {
    const device = new InMemoryPreferencesStore(english);

    expect(await new GetPreferences({ device }).execute({ fallback })).toEqual(english);
  });

  it("CA-104-05 · si no hay nada guardado usa el valor por defecto", async () => {
    expect(
      await new GetPreferences({ device: new InMemoryPreferencesStore() }).execute({ fallback }),
    ).toEqual(fallback);
  });

  it("CA-104-05 · si el perfil falla usa las del dispositivo sin error", async () => {
    const profile = new InMemoryPreferencesStore(dark);
    profile.failing = true;

    const result = await new GetPreferences({
      device: new InMemoryPreferencesStore(english),
      profile,
    }).execute({ fallback });

    expect(result).toEqual(english);
  });

  it("si el dispositivo falla sigue funcionando", async () => {
    const device = new InMemoryPreferencesStore(english);
    device.failing = true;

    expect(await new GetPreferences({ device }).execute({ fallback })).toEqual(fallback);
    expect(
      await new GetPreferences({ device, profile: new InMemoryPreferencesStore(dark) }).execute({
        fallback,
      }),
    ).toEqual(dark);
  });
});

describe("UpdatePreferences", () => {
  it("aplica el cambio sobre las actuales y guarda en dispositivo y perfil", async () => {
    const device = new InMemoryPreferencesStore(fallback);
    const profile = new InMemoryPreferencesStore(fallback);

    const result = await new UpdatePreferences({ device, profile }).execute({
      current: fallback,
      changes: { theme: "dark" },
    });

    expect(result).toEqual({ ok: true, value: { locale: "es", theme: "dark" } });
    expect(device.peek()).toEqual({ locale: "es", theme: "dark" });
    expect(profile.peek()).toEqual({ locale: "es", theme: "dark" });
  });

  it("sin cuenta solo guarda en el dispositivo", async () => {
    const device = new InMemoryPreferencesStore();

    const result = await new UpdatePreferences({ device }).execute({
      current: fallback,
      changes: { locale: "en" },
    });

    expect(result).toEqual({ ok: true, value: { locale: "en", theme: "system" } });
    expect(device.peek()).toEqual({ locale: "en", theme: "system" });
  });

  it("CA-104-06 · si el perfil falla guarda en el dispositivo y devuelve SYNC_FAILED", async () => {
    const device = new InMemoryPreferencesStore(fallback);
    const profile = new InMemoryPreferencesStore(fallback);
    profile.failing = true;

    const result = await new UpdatePreferences({ device, profile }).execute({
      current: fallback,
      changes: { locale: "en" },
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "SYNC_FAILED", preferences: { locale: "en", theme: "system" } },
    });
    expect(device.peek()).toEqual({ locale: "en", theme: "system" });
  });
});
