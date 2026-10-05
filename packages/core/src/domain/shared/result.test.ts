import { describe, expect, it } from "vitest";

import { combine, err, ok } from "./result";

describe("Result", () => {
  it("ok envuelve un valor", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err envuelve un error", () => {
    expect(err("REQUIRED_FIELD")).toEqual({ ok: false, error: "REQUIRED_FIELD" });
  });

  describe("combine", () => {
    it("devuelve todos los valores si todos son correctos", () => {
      expect(combine([ok(1), ok(2)])).toEqual(ok([1, 2]));
    });

    it("devuelve todos los errores si alguno falla", () => {
      expect(combine([ok(1), err("A"), err("B")])).toEqual(err(["A", "B"]));
    });

    it("con una lista vacía devuelve una lista de valores vacía", () => {
      expect(combine([])).toEqual(ok([]));
    });
  });
});
