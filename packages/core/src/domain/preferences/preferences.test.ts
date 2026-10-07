import { describe, expect, it } from "vitest";

import { parsePreferences, samePreferences } from "./preferences";

describe("parsePreferences", () => {
  it("acepta un idioma y un tema válidos e ignora el resto", () => {
    expect(parsePreferences({ locale: "en", theme: "dark", extra: 1 })).toEqual({
      locale: "en",
      theme: "dark",
    });
  });

  it.each([
    null,
    undefined,
    "es",
    {},
    { locale: "es" },
    { theme: "dark" },
    { locale: "fr", theme: "dark" },
    { locale: "es", theme: "sepia" },
    { locale: null, theme: null },
  ])("CA-104-07 · devuelve null con %o", (raw) => {
    expect(parsePreferences(raw)).toBeNull();
  });
});

describe("samePreferences", () => {
  it("compara idioma y tema", () => {
    expect(samePreferences({ locale: "es", theme: "dark" }, { locale: "es", theme: "dark" })).toBe(
      true,
    );
    expect(samePreferences({ locale: "es", theme: "dark" }, { locale: "en", theme: "dark" })).toBe(
      false,
    );
  });
});
