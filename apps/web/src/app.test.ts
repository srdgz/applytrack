import type { ApplicationSnapshot } from "@applytrack/core";
import { MemoryKeyValueStore, DemoStorage, DEMO_USER_ID } from "@applytrack/adapter-local";
import { aSnapshot, FixedClock } from "@applytrack/core/testing";
import { fireEvent, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

const startDemoApp = async (path: string) => {
  const store = new MemoryKeyValueStore();
  await createContainer({
    store,
    clock: new FixedClock("2026-10-05T12:00:00.000Z"),
  }).startDemo.execute("es");
  return startApp(path, store);
};

const field = (id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No existe #${id}`);
  return element as HTMLInputElement;
};

afterEach(() => {
  vi.restoreAllMocks();
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

  it("la barra lateral se contrae y se expande y recuerda la preferencia", async () => {
    window.localStorage.removeItem("applytrack:sidebar");
    const store = new MemoryKeyValueStore();
    await createContainer({ store }).startDemo.execute("es");
    await startApp("/board", store);

    const toggle = await screen.findByRole("button", { name: "Expandir menú" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelectorAll("#sidebar [aria-hidden=true].invisible")).toHaveLength(4);

    await userEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: "Contraer menú" }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(window.localStorage.getItem("applytrack:sidebar")).toBe("expanded");
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

describe("formulario de candidatura", () => {
  const fillRequired = async () => {
    await userEvent.type(field("field-company"), "Nueva Empresa");
    await userEvent.type(field("field-position"), "Desarrollo Vue");
    await userEvent.selectOptions(field("field-source"), "referral");
    await userEvent.selectOptions(field("field-workMode"), "remote");
  };

  it("CA-100-16 · crear una candidatura la muestra en «Me interesa» y avisa", async () => {
    const { router } = await startDemoApp("/board");
    await router.push("/applications/new");

    await fillRequired();
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("board");
      expect(columnHeadings()[0]).toBe("Me interesa 3");
    });
    expect(screen.getByText("Candidatura guardada")).toBeTruthy();
    expect(screen.getAllByText("Nueva Empresa").length).toBeGreaterThan(0);
  });

  it("CA-100-17 · la fecha de candidatura aparece con «Aplicada» y se rellena con hoy", async () => {
    await startDemoApp("/applications/new");
    expect(document.getElementById("field-appliedAt")).toBeNull();

    await userEvent.click(screen.getByRole("radio", { name: "Aplicada" }));
    expect(field("field-appliedAt").value).toBe("2026-10-05");
    expect(field("field-appliedAt").max).toBe("2026-10-05");

    await userEvent.click(screen.getByRole("radio", { name: "Me interesa" }));
    expect(document.getElementById("field-appliedAt")).toBeNull();
  });

  it("CA-100-18 · guardar con errores no guarda, marca los campos y enfoca el primero", async () => {
    const { useCases } = await startDemoApp("/applications/new");
    const create = vi.spyOn(useCases.createApplication, "execute");

    await userEvent.type(field("field-salaryMin"), "50000");
    await userEvent.type(field("field-salaryMax"), "40000");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(create).not.toHaveBeenCalled();
    expect(field("field-company").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement?.id).toBe("field-company");
    expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(2);
    expect(screen.getAllByText("Elige una opción de la lista.")).toHaveLength(2);
    expect(screen.getByText(/El salario mínimo no puede ser mayor/)).toBeTruthy();
  });

  it("un campo muestra su error al salir de él, no antes", async () => {
    await startDemoApp("/applications/new");

    await userEvent.click(field("field-company"));
    expect(screen.queryByText("Este campo es obligatorio.")).toBeNull();
    await userEvent.tab();

    expect(screen.getByText("Este campo es obligatorio.")).toBeTruthy();
  });

  it("CA-100-19 · las etiquetas se gestionan con el teclado", async () => {
    await startDemoApp("/applications/new");
    const input = field("field-tags");

    await userEvent.type(input, "Vue{Enter}Pinia,TypeScript{Enter}");
    expect(screen.getByText("3 de 10", { exact: false })).toBeTruthy();

    await userEvent.type(input, "{Backspace}");
    expect(screen.queryByRole("button", { name: "Quitar etiqueta TypeScript" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Quitar etiqueta Vue" }));
    expect(
      screen
        .getAllByRole("button", { name: /Quitar etiqueta/ })
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Quitar etiqueta Pinia"]);
  });

  it("CA-100-20 · salir con cambios pide confirmación; sin cambios, no", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { router } = await startDemoApp("/applications/new");

    await router.push("/board");
    expect(confirm).not.toHaveBeenCalled();

    await router.push("/applications/new");
    await userEvent.type(field("field-company"), "Algo");
    await router.push("/board");

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.name).toBe("application-new");
  });

  it("CA-100-21 · editar carga los valores guardados y guarda los cambios", async () => {
    const { router } = await startDemoApp("/board");
    await router.push("/applications/demo-10/edit");

    await waitFor(() => {
      expect(field("field-company").value).toBe("Tejo Cloud");
    });
    expect(field("field-salaryMin").value).toBe("34000");
    expect(screen.getByText("Oferta", { selector: "span" })).toBeTruthy();
    expect(document.querySelector("input[name=status]")).toBeNull();

    await fireEvent.update(field("field-company"), "Tejo Cloud Labs");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("board");
    });
    expect(screen.getAllByText("Tejo Cloud Labs").length).toBeGreaterThan(0);
  });

  it("CA-100-21 · con un id inexistente muestra que no se ha encontrado", async () => {
    await startDemoApp("/applications/no-existe/edit");

    expect(await screen.findByText("No se ha encontrado la candidatura.")).toBeTruthy();
  });
});
