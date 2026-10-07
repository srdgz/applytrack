import { describe, expect, it } from "vitest";

import { EMAIL_MAX_LENGTH, validateEmail } from "./email";
import { validateSignInCode } from "./sign-in-code";

describe("validateEmail", () => {
  it("CA-104-01 · recorta espacios y pasa a minúsculas", () => {
    expect(validateEmail("  Ana@Example.com ")).toEqual({ ok: true, value: "ana@example.com" });
  });

  it("CA-104-01 · un email vacío es obligatorio", () => {
    expect(validateEmail("   ")).toEqual({
      ok: false,
      error: { field: "email", code: "REQUIRED_FIELD" },
    });
  });

  it.each(["ana@", "ana@example", "@example.com", "ana example@mail.com", "ana@@mail.com"])(
    "CA-104-01 · rechaza %s",
    (value) => {
      expect(validateEmail(value)).toEqual({
        ok: false,
        error: { field: "email", code: "INVALID_EMAIL" },
      });
    },
  );

  it("CA-104-01 · rechaza más de 254 caracteres", () => {
    const tooLong = `${"a".repeat(EMAIL_MAX_LENGTH - "@mail.com".length + 1)}@mail.com`;
    const longest = `${"a".repeat(EMAIL_MAX_LENGTH - "@mail.com".length)}@mail.com`;

    expect(validateEmail(tooLong).ok).toBe(false);
    expect(validateEmail(longest).ok).toBe(true);
  });
});

describe("validateSignInCode", () => {
  it("CA-104-02 · acepta 6 dígitos e ignora espacios", () => {
    expect(validateSignInCode("123 456")).toEqual({ ok: true, value: "123456" });
  });

  it.each(["12345", "1234567", "12a456"])("CA-104-02 · rechaza %s", (value) => {
    expect(validateSignInCode(value)).toEqual({
      ok: false,
      error: { field: "code", code: "INVALID_CODE_FORMAT", meta: { length: 6 } },
    });
  });

  it("un código vacío es obligatorio", () => {
    expect(validateSignInCode(" ")).toEqual({
      ok: false,
      error: { field: "code", code: "REQUIRED_FIELD" },
    });
  });
});
