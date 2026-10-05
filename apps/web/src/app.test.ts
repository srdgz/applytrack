import type { ApplicationSnapshot } from "@applytrack/core";
import { MemoryKeyValueStore, DemoStorage, DEMO_USER_ID } from "@applytrack/adapter-local";
import { aSnapshot, FixedClock } from "@applytrack/core/testing";
import { screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryHistory } from "vue-router";

import { createApplyTrackApp } from "./app";
import { createContainer } from "./di/container";

const mounted: (() => void)[] = [];

const startApp = async (path: string, store = new MemoryKeyValueStore()) => {
  const useCases = createContainer({ store, clock: new FixedClock("2026-10-05T12:00:00.000Z") });
  const { app, router } = createApplyTrackApp({
    useCases,
    history: createMemoryHistory(),
    locale: "es",
  });
  const container = document.createElement("div");
  document.body.append(container);
  app.mount(container);
  mounted.push(() => {
    app.unmount();
    container.remove();
  });
  await router.push(path);
  await router.isReady();
  return { router, useCases, store };
};

const columnHeadings = () =>
  [...document.querySelectorAll("section[aria-labelledby^=column-] h2")].map((heading) =>
    [...heading.querySelectorAll("span")].map((part) => part.textContent.trim()).join(" "),
  );

afterEach(() => {
  mounted.splice(0).forEach((unmount) => {
    unmount();
  });
});

describe("web", () => {
  it("sin demo activa, el tablero redirige al inicio", async () => {
    const { router } = await startApp("/board");

    expect(router.currentRoute.value.name).toBe("start");
    expect(await screen.findByRole("button", { name: "Probar sin cuenta" })).toBeTruthy();
  });

  it("CA-102-15 y CA-102-16 · al empezar la demo, el tablero muestra las columnas y las paradas", async () => {
    const { router } = await startApp("/");

    await userEvent.click(await screen.findByRole("button", { name: "Probar sin cuenta" }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("board");
      expect(columnHeadings()).toEqual([
        "Me interesa 2",
        "Aplicada 3",
        "Primer contacto 2",
        "Entrevistas 2",
        "Oferta 1",
        "Cerradas 4",
      ]);
    });
    const desktopBoard = document.querySelector("section[aria-labelledby^=column-]")?.parentElement;
    expect(desktopBoard?.textContent.match(/Parada/g)).toHaveLength(2);
  });

  it("los filtros de la URL se aplican al tablero", async () => {
    const store = new MemoryKeyValueStore();
    await createContainer({ store }).startDemo.execute("es");

    await startApp("/board?status=offer,hired&q=tejo", store);

    await waitFor(() => {
      expect(columnHeadings().at(-1)).toBe("Oferta 1");
    });
  });

  it("CA-102-22 · en la lista, «Cargar más» añade las siguientes sin repetir", async () => {
    const store = new MemoryKeyValueStore();
    const applications: ApplicationSnapshot[] = Array.from({ length: 60 }, (_, index) =>
      aSnapshot({
        id: `app-${String(index).padStart(2, "0")}`,
        ownerId: DEMO_USER_ID,
        company: `Empresa ${String(index)}`,
        updatedAt: new Date(Date.UTC(2026, 8, 1, 12, index)).toISOString(),
      }),
    );
    await new DemoStorage(store).replace({
      version: 1,
      locale: "es",
      seededAt: null,
      applications,
    });
    await store.setItem("applytrack:mode", "demo");

    await startApp("/list", store);

    expect(await screen.findByText("Mostrando 50 de 60")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    expect(await screen.findByText("Mostrando 60 de 60")).toBeTruthy();

    const companies = [...document.querySelectorAll("tbody tr td:first-child a")].map((link) =>
      link.textContent.trim(),
    );
    expect(new Set(companies).size).toBe(60);
    expect(screen.queryByRole("button", { name: "Cargar más" })).toBeNull();
  });
});
