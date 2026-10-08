import { createContainer } from "@applytrack/composition";
import { FakeAuthGateway } from "@applytrack/core/testing/doubles";
import { fireEvent, screen } from "expo-router/testing-library";

import {
  clock,
  pathname,
  setUpAppTests,
  spanishStore,
  startApp as start,
} from "./testing/render-app";

setUpAppTests();

describe("Inicio", () => {
  it("sin Supabase, «Entrar» está desactivado y se explica", async () => {
    await start("/");

    expect(await screen.findByText("Organiza tu búsqueda de empleo")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
    expect(
      screen.getByText("Las cuentas no están configuradas en este entorno."),
    ).toBeOnTheScreen();
  });

  it("CA-109-03 · «Probar sin cuenta» abre el tablero con el aviso de demo y se mantiene", async () => {
    const { store } = await start("/");

    await fireEvent.press(await screen.findByRole("button", { name: "Probar sin cuenta" }));

    expect(await screen.findByText("Disponible pronto")).toBeOnTheScreen();
    expect(
      screen.getByText("Modo demo · los datos solo se guardan en este dispositivo"),
    ).toBeOnTheScreen();
    expect(pathname()).toBe("/board");
    expect(await store.getItem("applytrack:mode")).toBe("demo");
  });

  it("CA-109-03 · al volver a abrir la app sigue en la demo", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");

    await start("/", { store });

    expect(await screen.findByText("Disponible pronto")).toBeOnTheScreen();
    expect(pathname()).toBe("/board");
  });

  it("sin sesión ni demo, las pestañas llevan al inicio", async () => {
    await start("/settings");

    expect(await screen.findByText("Organiza tu búsqueda de empleo")).toBeOnTheScreen();
    expect(pathname()).toBe("/");
  });
});

describe("Entrar", () => {
  it("CA-109-04 · valida el email y pasa a «Revisa tu correo» con el reenvío bloqueado", async () => {
    const auth = new FakeAuthGateway();
    await start("/sign-in", { auth });

    const email = await screen.findByLabelText("Email");
    await fireEvent.changeText(email, "ana@");
    await fireEvent.press(screen.getByRole("button", { name: "Enviarme el enlace" }));
    expect(
      await screen.findByText("Introduce un email válido, como nombre@ejemplo.com."),
    ).toBeOnTheScreen();
    expect(auth.requests).toEqual([]);

    await fireEvent.changeText(email, "Ana@Mail.com");
    await fireEvent.press(screen.getByRole("button", { name: "Enviarme el enlace" }));

    expect(
      await screen.findByText(
        "Te hemos enviado un enlace a ana@mail.com. Ábrelo en este teléfono para entrar.",
      ),
    ).toBeOnTheScreen();
    expect(auth.requests[0]?.redirectTo).toContain("auth/callback");
    expect(screen.getByRole("button", { name: "Puedes reenviarlo en 60 s" })).toBeDisabled();
  });

  it("CA-109-05 · el enlace correcto abre la sesión y vuelve a componer la app", async () => {
    const auth = new FakeAuthGateway();
    const complete = auth.completeSignIn.bind(auth);
    const signedIn = { value: false };
    jest.spyOn(auth, "completeSignIn").mockImplementation(async (code) => {
      const result = await complete(code);
      if (result.ok) signedIn.value = true;
      return result;
    });

    await start("/auth/callback?code=link-code", { auth, onBoot: () => signedIn.value });

    expect(await screen.findByText("Has entrado como link@mail.com")).toBeOnTheScreen();
    expect(pathname()).toBe("/board");
  });

  it("CA-109-05 · con un enlace caducado explica el fallo y ofrece volver a entrar", async () => {
    await start("/auth/callback?code=caducado", { auth: new FakeAuthGateway() });

    expect(await screen.findByText("No se ha podido entrar con este enlace")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Volver a entrar" }));
    expect(pathname()).toBe("/sign-in");
  });
});
