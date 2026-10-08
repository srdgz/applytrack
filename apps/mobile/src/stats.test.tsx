import { createContainer } from "@applytrack/composition";
import { Application } from "@applytrack/core";
import { aSnapshot, InMemoryApplicationRepository } from "@applytrack/core/testing/doubles";
import { fireEvent, screen } from "expo-router/testing-library";

import { clock, pathname, setUpAppTests, spanishStore, startApp } from "./testing/render-app";

setUpAppTests();

const startDemo = async () => {
  const store = await spanishStore();
  await createContainer({ store, clock }).startDemo.execute("es");
  return startApp("/stats", { store });
};

const normalize = (text: string) => text.replace(/\s/g, " ");

describe("Estadísticas", () => {
  it("CA-113-01 · el resumen muestra las mismas cifras que la web", async () => {
    await startDemo();

    const active = await screen.findByLabelText(/^Candidaturas activas: 10\. 5 cerradas$/);
    expect(active).toBeOnTheScreen();
    const response = screen.getByLabelText(/^Tasa de respuesta:/);
    expect(normalize(String(response.props.accessibilityLabel))).toBe(
      "Tasa de respuesta: 69 %. 9 de 13",
    );
    expect(
      normalize(String(screen.getByLabelText(/^Tasa de entrevista:/).props.accessibilityLabel)),
    ).toBe("Tasa de entrevista: 38 %. 5 de 13");
    expect(screen.getByLabelText(/^Ofertas: 2\./)).toBeOnTheScreen();
    expect(screen.getByText("7 días")).toBeOnTheScreen();
  });

  it("CA-113-02 · cada barra se anuncia con su texto completo", async () => {
    await startDemo();
    await screen.findByText("Enviadas por semana");

    expect(screen.getAllByLabelText(/^Semana del /)).toHaveLength(8);
    expect(screen.getByLabelText("Aplicada: 3")).toBeOnTheScreen();
    expect(screen.getByLabelText("Me interesa: 2")).toBeOnTheScreen();
  });

  it("CA-113-03 · las paradas aparecen en orden y abren su detalle", async () => {
    await startDemo();

    const stale = await screen.findAllByRole("button", { name: /días sin cambios$/ });
    expect(stale.map((item) => String(item.props.accessibilityLabel).split(",")[0])).toEqual([
      "Lince Software",
      "Olivo Fintech",
    ]);

    await fireEvent.press(stale[0] as never);
    expect(await screen.findByRole("header", { name: "Lince Software" })).toBeOnTheScreen();
    expect(pathname()).toMatch(/^\/applications\/[^/]+$/);
  });

  it("CA-113-04 · sin candidaturas muestra el mensaje vacío", async () => {
    await startApp("/stats", { signedIn: true });

    expect(await screen.findByText("Todavía no hay datos")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Añadir candidatura" }));
    expect(pathname()).toBe("/applications/new");
  });

  it("CA-113-04 · sin enviadas, las tasas muestran «—»", async () => {
    const repository = new InMemoryApplicationRepository();
    await repository.save(
      Application.restore(aSnapshot({ id: "w-1", ownerId: "user-ana", status: "wishlist" })),
    );
    await startApp("/stats", { signedIn: true, repository });

    expect(
      await screen.findByLabelText(
        "Tasa de respuesta: —. Todavía no has enviado ninguna candidatura.",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText("Ninguna candidatura parada. ¡Bien!")).toBeOnTheScreen();
  });
});
