import { createContainer } from "@applytrack/composition";
import { FakeAuthGateway, InMemoryPreferencesStore } from "@applytrack/core/testing/doubles";
import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import { Alert } from "react-native";

import { clock, setUpAppTests, spanishStore, startApp as start } from "./testing/render-app";

setUpAppTests();

describe("Ajustes", () => {
  it("CA-109-06 · cambiar el idioma y el tema se aplica y se guarda", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await start("/settings", { store });

    await fireEvent.press(await screen.findByRole("radio", { name: "Oscuro" }));
    await waitFor(async () => {
      expect(await store.getItem("applytrack:theme")).toBe("dark");
    });
    expect(screen.getByRole("radio", { name: "Oscuro" })).toBeChecked();

    await fireEvent.press(screen.getByRole("radio", { name: "English" }));
    expect(await screen.findByRole("header", { name: "Settings" })).toBeOnTheScreen();
    expect(await store.getItem("applytrack:locale")).toBe("en");
  });

  it("CA-109-06 · con cuenta, si el perfil falla avisa de que solo se guardó aquí", async () => {
    const profile = new InMemoryPreferencesStore({ locale: "es", theme: "system" });
    profile.failing = true;
    await start("/settings", { signedIn: true, auth: new FakeAuthGateway(), profile });

    await fireEvent.press(await screen.findByRole("radio", { name: "Claro" }));

    expect(
      await screen.findByText("Guardado en este dispositivo, pero no en tu cuenta"),
    ).toBeOnTheScreen();
  });

  it("CA-109-07 · salir de la demo vuelve al inicio", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await start("/settings", { store });

    const exits = await screen.findAllByRole("button", { name: "Salir" });
    await fireEvent.press(exits[exits.length - 1] as never);

    expect(await screen.findByText("Organiza tu búsqueda de empleo")).toBeOnTheScreen();
    expect(await store.getItem("applytrack:mode")).toBeNull();
  });

  it("reiniciar la demo pide confirmación", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await start("/settings", { store });

    const resets = await screen.findAllByRole("button", { name: "Reiniciar" });
    await fireEvent.press(resets[0] as never);

    expect(alert).toHaveBeenCalledWith("Reiniciar", expect.any(String), expect.any(Array));
  });

  it("CA-109-07 · cerrar sesión vuelve al inicio con un aviso", async () => {
    const auth = new FakeAuthGateway();
    const setup = { signedIn: true, auth };
    const { signOut } = await start("/settings", setup);
    jest.spyOn(auth, "signOut").mockImplementation(() => {
      signOut();
      return Promise.resolve();
    });

    expect(await screen.findByText("Has entrado como ana@mail.com.")).toBeOnTheScreen();
    expect(
      screen.queryByText("Modo demo · los datos solo se guardan en este dispositivo"),
    ).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByText("Has cerrado sesión")).toBeOnTheScreen();
    expect(await screen.findByText("Organiza tu búsqueda de empleo")).toBeOnTheScreen();
  });
});
