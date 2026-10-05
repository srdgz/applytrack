import { describe, expect, it } from "vitest";

import { charLength, foldForComparison, optionalText } from "./text";

describe("text", () => {
  it("cuenta caracteres Unicode, no unidades UTF-16", () => {
    expect(charLength("Cáceres")).toBe(7);
    expect(charLength("🚀")).toBe(1);
  });

  it("ignora mayúsculas y tildes al comparar", () => {
    expect(foldForComparison("Ingeniería")).toBe(foldForComparison("INGENIERIA"));
  });

  it("trata como ausente un texto opcional vacío", () => {
    expect(optionalText(undefined)).toBeUndefined();
    expect(optionalText("   ")).toBeUndefined();
    expect(optionalText("  Madrid ")).toBe("Madrid");
  });
});
