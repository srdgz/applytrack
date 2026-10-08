import { createContainer } from "@applytrack/composition";
import { act, fireEvent, screen, waitFor, within } from "expo-router/testing-library";
import type { AlertButton } from "react-native";
import { Alert } from "react-native";

import { clock, pathname, setUpAppTests, spanishStore, startApp } from "./testing/render-app";

setUpAppTests();

const startDemo = async (path: string) => {
  const store = await spanishStore();
  await createContainer({ store, clock }).startDemo.execute("es");
  return startApp(path, { store });
};

const openNewForm = async () => {
  await startDemo("/board");
  await fireEvent.press(await screen.findByRole("button", { name: "Nueva candidatura" }));
  await screen.findByRole("header", { name: "Nueva candidatura" });
};

const fillRequired = async () => {
  await fireEvent.changeText(screen.getByLabelText("Empresa"), "Acme");
  await fireEvent.changeText(screen.getByLabelText("Puesto"), "Frontend Developer");
  await fireEvent.press(screen.getByRole("radio", { name: "LinkedIn" }));
  await fireEvent.press(screen.getByRole("radio", { name: "Remoto" }));
};

const firstTabCount = () =>
  within(screen.getAllByRole("tab")[0] as never)
    .getAllByText(/.+/)
    .map((text) => String((text.props as { children: unknown }).children));

describe("Formulario", () => {
  it("CA-112-02 · crear con los obligatorios la añade a «Me interesa» y vuelve", async () => {
    await openNewForm();
    expect(screen.getByRole("radio", { name: "Me interesa" })).toBeChecked();

    await fillRequired();
    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Candidatura guardada")).toBeOnTheScreen();
    expect(pathname()).toBe("/board");
    await waitFor(() => {
      expect(firstTabCount()).toEqual(["Me interesa", "3"]);
    });
    expect(screen.getByText("Acme")).toBeOnTheScreen();
  });

  it("CA-112-03 · «Aplicada» muestra la fecha de hoy y «Me interesa» la oculta", async () => {
    await openNewForm();
    expect(screen.queryByText("Fecha de candidatura")).toBeNull();

    await fireEvent.press(screen.getByRole("radio", { name: "Aplicada" }));

    expect(
      screen.getByRole("button", { name: "Fecha de candidatura: 5 oct 2026" }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Quitar fecha" }));
    expect(
      screen.getByRole("button", { name: "Fecha de candidatura: Elegir fecha" }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("radio", { name: "Me interesa" }));
    expect(screen.queryByText("Fecha de candidatura")).toBeNull();
  });

  it("CA-112-04 · guardar con errores no guarda y los muestra bajo cada campo", async () => {
    await openNewForm();

    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(2);
    expect(pathname()).toBe("/applications/new");

    await fireEvent.changeText(screen.getByLabelText("Empresa"), "Acme");
    await waitFor(() => {
      expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("CA-112-05 · las etiquetas se añaden con coma y con enviar, se quitan y avisan si se repiten", async () => {
    await openNewForm();
    const input = screen.getByLabelText("Etiquetas");

    await fireEvent.changeText(input, "Vue,");
    expect(screen.getByText("Vue")).toBeOnTheScreen();
    await fireEvent.changeText(input, "React");
    await fireEvent(input, "submitEditing");
    expect(screen.getByText(/2 de 10/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Quitar etiqueta Vue" }));
    expect(screen.queryByText("Vue")).toBeNull();

    await fireEvent.changeText(input, "react,");
    expect(await screen.findByText("La etiqueta «react» está repetida.")).toBeOnTheScreen();
  });

  it("el salario se muestra con formato", async () => {
    await openNewForm();

    await fireEvent.changeText(screen.getByLabelText("Mínimo"), "35000");
    await fireEvent.changeText(screen.getByLabelText("Máximo"), "40000");

    expect(screen.getByText(/35\.000.*40\.000/)).toBeOnTheScreen();
  });

  it("CA-112-07 · salir con cambios pide confirmación y «Descartar» sale", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await openNewForm();

    await fireEvent.changeText(screen.getByLabelText("Empresa"), "Acme");
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(alert).toHaveBeenCalledWith(
      "Cambios sin guardar",
      expect.any(String),
      expect.any(Array),
    );
    expect(pathname()).toBe("/applications/new");

    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    expect(buttons.map(({ text }) => text)).toEqual(["Seguir editando", "Descartar"]);
    await act(async () => {
      await Promise.resolve(buttons[1]?.onPress?.());
    });
    await waitFor(() => {
      expect(pathname()).toBe("/board");
    });
  });

  it("CA-112-07 · sin cambios sale sin preguntar", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await openNewForm();

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(pathname()).toBe("/board");
    });
    expect(alert).not.toHaveBeenCalled();
  });
});

describe("Editar", () => {
  it("CA-112-06 · carga los valores, no deja cambiar el estado y guarda en el detalle", async () => {
    await startDemo("/list");
    await fireEvent.press(await screen.findByRole("button", { name: /^Kraken Games/ }));
    await fireEvent.press(await screen.findByRole("button", { name: "Editar" }));

    await screen.findByRole("header", { name: "Editar candidatura" });
    expect(screen.getByLabelText("Empresa").props.value).toBe("Kraken Games");
    expect(
      screen.getByText("El estado se cambia desde el detalle de la candidatura."),
    ).toBeOnTheScreen();
    expect(screen.queryByRole("radio", { name: "Me interesa" })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Notas"), "Segunda entrevista el lunes");
    await fireEvent.press(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Cambios guardados")).toBeOnTheScreen();
    expect(await screen.findByText("Segunda entrevista el lunes")).toBeOnTheScreen();
    expect(pathname()).toMatch(/^\/applications\/[^/]+$/);
  });

  it("con un id que no existe lo explica", async () => {
    await startDemo("/applications/no-existe/edit");

    expect(await screen.findByText("No se ha encontrado la candidatura.")).toBeOnTheScreen();
  });
});
