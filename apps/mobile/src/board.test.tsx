import { createContainer } from "@applytrack/composition";
import { fireEvent, screen, waitFor, within } from "expo-router/testing-library";

import { clock, pathname, setUpAppTests, spanishStore, startApp } from "./testing/render-app";

setUpAppTests();

const startDemo = async (path = "/board") => {
  const store = await spanishStore();
  await createContainer({ store, clock }).startDemo.execute("es");
  return startApp(path, { store });
};

const tabCounts = () =>
  screen.getAllByRole("tab").map((tab) =>
    within(tab)
      .getAllByText(/.+/)
      .map((text) => String(text.props.children)),
  );

describe("Tablero", () => {
  it("CA-110-02 · muestra las 6 columnas con su número y abre en la primera con datos", async () => {
    await startDemo();

    expect(await screen.findByText("Nimbus Labs")).toBeOnTheScreen();
    expect(tabCounts()).toEqual([
      ["Me interesa", "2"],
      ["Aplicada", "3"],
      ["Primer contacto", "2"],
      ["Entrevistas", "2"],
      ["Oferta", "1"],
      ["Cerradas", "4"],
    ]);
    expect(screen.getAllByRole("tab")[0]).toBeSelected();
  });

  it("cambiar de pestaña muestra sus tarjetas, con el estado en «Cerradas»", async () => {
    await startDemo();
    await screen.findByText("Nimbus Labs");

    await fireEvent.press(screen.getByRole("tab", { name: /^Cerradas/ }));

    expect(await screen.findByText("Delta Commerce")).toBeOnTheScreen();
    expect(screen.queryByText("Nimbus Labs")).toBeNull();
    expect(screen.getByText("Sin respuesta")).toBeOnTheScreen();
    expect(screen.getByRole("tab", { name: /^Cerradas/ })).toBeSelected();
  });

  it("CA-110-05 · la búsqueda no distingue tildes y se mantiene en la lista", async () => {
    await startDemo();
    await screen.findByText("Nimbus Labs");

    await fireEvent.changeText(screen.getByLabelText("Buscar"), "nordica");

    expect(await screen.findByText("Nórdica Media")).toBeOnTheScreen();
    expect(screen.getAllByRole("tab")).toHaveLength(6);
    expect(screen.getByRole("tab", { name: /^Cerradas/ })).toBeSelected();

    await fireEvent.press(screen.getByText("Lista"));
    expect(await screen.findByText("Mostrando 1 de 1")).toBeOnTheScreen();
  });

  it("CA-110-05 · los filtros reducen las columnas y «Quitar filtros» las recupera", async () => {
    await startDemo();
    await screen.findByText("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Filtros" }));
    await fireEvent.press(await screen.findByRole("checkbox", { name: "Oferta" }));
    expect(screen.getByRole("checkbox", { name: "Oferta" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Listo" }));

    expect(await screen.findByRole("button", { name: "Filtros (1)" })).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getAllByRole("tab")).toHaveLength(1);
    });

    await fireEvent.press(screen.getByRole("button", { name: "Filtros (1)" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Quitar 1 filtro" }));
    await fireEvent.press(screen.getByRole("button", { name: "Listo" }));

    await waitFor(() => {
      expect(screen.getAllByRole("tab")).toHaveLength(6);
    });
  });

  it("sin resultados con filtros ofrece quitarlos", async () => {
    await startDemo();
    await screen.findByText("Nimbus Labs");

    await fireEvent.changeText(screen.getByLabelText("Buscar"), "no existe");

    await fireEvent.press(await screen.findByRole("button", { name: "Quitar filtros" }));
    expect(await screen.findByText("Nimbus Labs")).toBeOnTheScreen();
  });

  it("pulsar una tarjeta o el botón flotante abre su ruta", async () => {
    await startDemo();

    await fireEvent.press(await screen.findByRole("button", { name: /^Nimbus Labs/ }));
    expect(pathname()).toMatch(/^\/applications\/.+/);
    expect(await screen.findByText("Disponible pronto")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Volver" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Nueva candidatura" }));
    expect(pathname()).toBe("/applications/new");
  });

  it("sin candidaturas da la bienvenida", async () => {
    await startApp("/board", { signedIn: true });

    expect(await screen.findByText("Todavía no tienes candidaturas")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Añadir candidatura" }));
    expect(pathname()).toBe("/applications/new");
  });
});
