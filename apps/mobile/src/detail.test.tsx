import { createContainer } from "@applytrack/composition";
import type { AlertButton } from "react-native";
import { Alert, Linking } from "react-native";
import { fireEvent, screen, waitFor } from "expo-router/testing-library";

import { clock, pathname, setUpAppTests, spanishStore, startApp } from "./testing/render-app";

setUpAppTests();

const startDemo = async (path: string) => {
  const store = await spanishStore();
  await createContainer({ store, clock }).startDemo.execute("es");
  return startApp(path, { store });
};

const openFromList = async (company: string) => {
  await startDemo("/list");
  await fireEvent.press(await screen.findByRole("button", { name: new RegExp(`^${company}`) }));
  return screen.findByRole("header", { name: company });
};

const historyTexts = () =>
  screen
    .getAllByText(/^(De «|Creada en «)/)
    .map((text) => String((text.props as { children: unknown }).children));

describe("Detalle", () => {
  it("CA-111-02 · muestra los datos sin los vacíos y el historial del más reciente al más antiguo", async () => {
    await openFromList("Kraken Games");

    expect(screen.getByText("Desarrollo de Interfaces")).toBeOnTheScreen();
    expect(screen.getByText("Remoto (Europa)")).toBeOnTheScreen();
    expect(screen.getByText("LinkedIn")).toBeOnTheScreen();
    expect(screen.getByText(/Prueba técnica entregada/)).toBeOnTheScreen();
    expect(screen.queryByText("Salario")).toBeNull();
    expect(historyTexts()).toEqual([
      "De «Primer contacto» a «Entrevistas»",
      "De «Aplicada» a «Primer contacto»",
      "Creada en «Aplicada»",
    ]);
  });

  it("CA-111-09 · el enlace a la oferta se abre en el navegador", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await openFromList("Kraken Games");

    await fireEvent.press(screen.getByRole("link", { name: "Ver la oferta" }));

    expect(open).toHaveBeenCalledWith("https://kraken-games.example/careers/ui-developer");
  });

  it("CA-111-03 · solo ofrece los estados permitidos", async () => {
    await openFromList("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Cambiar estado" }));

    await screen.findByRole("header", { name: "Cambiar estado de Nimbus Labs" });
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Aplicada" })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Retirada" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Guardar cambio" })).toBeDisabled();
  });

  it("CA-111-04 · cambiar el estado con nota actualiza el detalle y el historial", async () => {
    await openFromList("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Cambiar estado" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Aplicada" }));
    await fireEvent.changeText(screen.getByLabelText("Nota (opcional)"), "Enviado el CV");
    expect(screen.getByText("13 / 500")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Guardar cambio" }));

    expect(await screen.findByText("Nimbus Labs pasa a «Aplicada».")).toBeOnTheScreen();
    await waitFor(() => {
      expect(historyTexts()[0]).toBe("De «Me interesa» a «Aplicada»");
    });
    expect(screen.getByText("Enviado el CV")).toBeOnTheScreen();
  });

  it("CA-111-03 · en un estado final no se puede cambiar", async () => {
    await openFromList("Cobalto Systems");

    expect(screen.getByText("Estado final: no admite más cambios.")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Cambiar estado" })).toBeNull();
  });

  it("CA-111-06 · archivar muestra el aviso y desarchivar lo quita", async () => {
    await openFromList("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Archivar" }));

    expect(
      await screen.findByText(
        "Esta candidatura está archivada: no aparece en el tablero ni en la lista.",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText("Candidatura archivada")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Desarchivar" }));

    await waitFor(() => {
      expect(screen.queryByText(/Esta candidatura está archivada/)).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Archivar" })).toBeOnTheScreen();
  });

  it("CA-111-07 · eliminar pide confirmación; cancelar no borra y confirmar vuelve al tablero", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await openFromList("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Eliminar" }));
    expect(alert).toHaveBeenCalledWith(
      "¿Eliminar la candidatura de Nimbus Labs?",
      "Se borrarán sus datos y su historial. Esta acción no se puede deshacer.",
      expect.any(Array),
    );
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    expect(buttons.map(({ text, style }) => [text, style])).toEqual([
      ["Cancelar", "cancel"],
      ["Eliminar definitivamente", "destructive"],
    ]);

    await waitFor(async () => {
      await Promise.resolve(buttons[1]?.onPress?.());
      expect(pathname()).toBe("/board");
    });
    expect(await screen.findByText("Candidatura eliminada")).toBeOnTheScreen();
    expect(screen.queryByText("Nimbus Labs")).toBeNull();
  });

  it("CA-111-08 · una candidatura que no existe lo explica", async () => {
    await startDemo("/applications/no-existe");

    expect(await screen.findByText("No se ha encontrado la candidatura.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Volver al tablero" }));
    expect(pathname()).toBe("/board");
  });

  it("«Editar» abre su ruta", async () => {
    await openFromList("Nimbus Labs");

    await fireEvent.press(screen.getByRole("button", { name: "Editar" }));

    expect(pathname()).toMatch(/^\/applications\/.+\/edit$/);
  });
});
