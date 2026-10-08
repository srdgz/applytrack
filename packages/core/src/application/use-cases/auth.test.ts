import { describe, expect, it } from "vitest";

import { FakeAuthGateway } from "../../../testing";
import {
  CompleteSignIn,
  GetCurrentAccount,
  RequestSignIn,
  SignOut,
  VerifySignInCode,
} from "./auth";

const setup = () => {
  const auth = new FakeAuthGateway();
  return {
    auth,
    getCurrentAccount: new GetCurrentAccount({ auth }),
    requestSignIn: new RequestSignIn({ auth }),
    verifySignInCode: new VerifySignInCode({ auth }),
    signOut: new SignOut({ auth }),
  };
};

const redirectTo = "http://localhost:5173/auth/callback";

describe("RequestSignIn", () => {
  it("envía el email normalizado con la URL de vuelta", async () => {
    const { auth, requestSignIn } = setup();

    const result = await requestSignIn.execute({ email: " Ana@Mail.com ", redirectTo });

    expect(result.ok).toBe(true);
    expect(auth.requests).toEqual([{ email: "ana@mail.com", redirectTo }]);
  });

  it("CA-104-03 · con un email inválido no llama al servicio", async () => {
    const { auth, requestSignIn } = setup();

    const result = await requestSignIn.execute({ email: "ana@", redirectTo });

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_FAILED", issues: [{ field: "email", code: "INVALID_EMAIL" }] },
    });
    expect(auth.requests).toEqual([]);
  });

  it.each(["RATE_LIMITED", "AUTH_UNAVAILABLE"] as const)(
    "CA-104-04 · devuelve el fallo %s del servicio",
    async (failure) => {
      const { auth, requestSignIn } = setup();
      auth.failure = failure;

      expect(await requestSignIn.execute({ email: "ana@mail.com", redirectTo })).toEqual({
        ok: false,
        error: { code: failure },
      });
    },
  );
});

describe("VerifySignInCode", () => {
  it("con un código válido abre la sesión", async () => {
    const { verifySignInCode, getCurrentAccount } = setup();

    const result = await verifySignInCode.execute({ email: "Ana@Mail.com", code: "123 456" });

    expect(result).toEqual({
      ok: true,
      value: { userId: "user-ana@mail.com", email: "ana@mail.com" },
    });
    expect(await getCurrentAccount.execute()).toEqual({
      userId: "user-ana@mail.com",
      email: "ana@mail.com",
    });
  });

  it("valida email y código a la vez", async () => {
    const { verifySignInCode } = setup();

    const result = await verifySignInCode.execute({ email: "", code: "12" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        issues: [
          { field: "email", code: "REQUIRED_FIELD" },
          { field: "code", code: "INVALID_CODE_FORMAT", meta: { length: 6 } },
        ],
      },
    });
  });

  it("CA-104-04 · devuelve INVALID_CODE si el código no es el correcto", async () => {
    const { verifySignInCode } = setup();

    expect(await verifySignInCode.execute({ email: "ana@mail.com", code: "654321" })).toEqual({
      ok: false,
      error: { code: "INVALID_CODE" },
    });
  });

  it("CA-104-04 · devuelve los fallos del servicio", async () => {
    const { auth, verifySignInCode } = setup();
    auth.failure = "RATE_LIMITED";

    expect(await verifySignInCode.execute({ email: "ana@mail.com", code: "123456" })).toEqual({
      ok: false,
      error: { code: "RATE_LIMITED" },
    });
  });
});

describe("SignOut", () => {
  it("cierra la sesión", async () => {
    const { verifySignInCode, signOut, getCurrentAccount } = setup();
    await verifySignInCode.execute({ email: "ana@mail.com", code: "123456" });

    await signOut.execute();

    expect(await getCurrentAccount.execute()).toBeNull();
  });
});

describe("CompleteSignIn", () => {
  it("con el código del enlace abre la sesión", async () => {
    const auth = new FakeAuthGateway();

    const result = await new CompleteSignIn({ auth }).execute({ linkCode: "link-code" });

    expect(result).toEqual({
      ok: true,
      value: { userId: "user-link", email: "link@mail.com" },
    });
  });

  it("sin código o con uno incorrecto devuelve INVALID_CODE", async () => {
    const auth = new FakeAuthGateway();
    const completeSignIn = new CompleteSignIn({ auth });

    expect(await completeSignIn.execute({ linkCode: " " })).toEqual({
      ok: false,
      error: { code: "INVALID_CODE" },
    });
    expect(await completeSignIn.execute({ linkCode: "otro" })).toEqual({
      ok: false,
      error: { code: "INVALID_CODE" },
    });
  });

  it("devuelve los fallos del servicio", async () => {
    const auth = new FakeAuthGateway();
    auth.failure = "AUTH_UNAVAILABLE";

    expect(await new CompleteSignIn({ auth }).execute({ linkCode: "link-code" })).toEqual({
      ok: false,
      error: { code: "AUTH_UNAVAILABLE" },
    });
  });
});
