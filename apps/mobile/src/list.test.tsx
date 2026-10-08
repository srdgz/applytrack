import { createContainer } from "@applytrack/composition";
import { Application } from "@applytrack/core";
import { aSnapshot, InMemoryApplicationRepository } from "@applytrack/core/testing/doubles";
import { act, fireEvent, screen, waitFor } from "expo-router/testing-library";

import { clock, setUpAppTests, spanishStore, startApp } from "./testing/render-app";

setUpAppTests();

const repositoryWith = async (count: number) => {
  const repository = new InMemoryApplicationRepository();
  for (let index = 0; index < count; index += 1) {
    const day = String(1 + (index % 28)).padStart(2, "0");
    await repository.save(
      Application.restore(
        aSnapshot({
          id: `app-${String(index).padStart(3, "0")}`,
          ownerId: "user-ana",
          company: `Empresa ${String(index).padStart(3, "0")}`,
          status: "applied",
          updatedAt: `2026-09-${day}T09:00:00.000Z`,
        }),
      ),
    );
  }
  return repository;
};

const scrollToEnd = async () => {
  const list = screen.getByTestId("applications-list");
  await act(async () => {
    await (list.props as { onEndReached: () => Promise<void> }).onEndReached();
  });
};

class FailingRepository extends InMemoryApplicationRepository {
  failing = true;

  override search(...args: Parameters<InMemoryApplicationRepository["search"]>) {
    return this.failing ? Promise.reject(new Error("offline")) : super.search(...args);
  }
}

describe("Lista", () => {
  it("muestra el estado de cada tarjeta y marca las paradas", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await startApp("/list", { store });

    expect(await screen.findByText("Mostrando 14 de 14")).toBeOnTheScreen();
    const stale = screen.getAllByRole("button", { name: /Parada/ });
    expect(stale.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Parada").length).toBe(stale.length);
  });

  it("CA-110-06 · ordenar por empresa cambia el orden", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await startApp("/list", { store });
    await screen.findByText("Mostrando 14 de 14");

    await fireEvent.press(screen.getByRole("button", { name: "Ordenar" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Empresa" }));
    expect(screen.getByRole("radio", { name: "Ascendente" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Listo" }));

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Estado:/ })[0]).toHaveAccessibleName(
        /^Atlas Retail Tech/,
      );
    });
    expect(screen.getByRole("button", { name: "Ordenar" })).toBeOnTheScreen();
  });

  it("la cabecera de la tabla ordena al pulsarla y la segunda vez invierte el orden", async () => {
    const store = await spanishStore();
    await createContainer({ store, clock }).startDemo.execute("es");
    await startApp("/list", { store });
    await screen.findByText("Mostrando 14 de 14");

    const header = screen.getByRole("button", { name: "Ordenar por Empresa y puesto" });
    await fireEvent.press(header);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Estado:/ })[0]).toHaveAccessibleName(
        /^Atlas Retail Tech/,
      );
    });
    expect(screen.getByText("Empresa y puesto ↑")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Ordenar por Empresa y puesto" }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Estado:/ })[0]).toHaveAccessibleName(
        /^Tejo Cloud/,
      );
    });
  });

  it("CA-110-06 · carga de 50 en 50 sin repetir ninguna", async () => {
    await startApp("/list", { signedIn: true, repository: await repositoryWith(60) });

    expect(await screen.findByText("Mostrando 50 de 60")).toBeOnTheScreen();

    await scrollToEnd();

    expect(await screen.findByText("Mostrando 60 de 60")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Cargar más" })).toBeNull();
  });

  it("el botón «Cargar más» del pie también carga las siguientes", async () => {
    await startApp("/list", { signedIn: true, repository: await repositoryWith(55) });

    await fireEvent.press(await screen.findByRole("button", { name: "Cargar más" }));

    expect(await screen.findByText("Mostrando 55 de 55")).toBeOnTheScreen();
  });

  it("con un error ofrece reintentar", async () => {
    const repository = new FailingRepository();
    await startApp("/list", { signedIn: true, repository });

    expect(await screen.findByText("Algo ha ido mal")).toBeOnTheScreen();
    repository.failing = false;
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Todavía no tienes candidaturas")).toBeOnTheScreen();
  });
});
