import type { ApplicationSnapshot } from "@applytrack/core";
import { MemoryKeyValueStore, DemoStorage, DEMO_USER_ID } from "@applytrack/adapter-local";
import { aSnapshot, FixedClock } from "@applytrack/core/testing";
import { fireEvent, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebHistory } from "vue-router";

import { createApplyTrackApp } from "./app";
import { createContainer } from "./di/container";

const mounted: (() => void)[] = [];

const startApp = async (path: string, store = new MemoryKeyValueStore()) => {
  const useCases = createContainer({ store, clock: new FixedClock("2026-10-05T12:00:00.000Z") });
  window.history.replaceState(null, "", "/");
  const { app, router } = createApplyTrackApp({
    useCases,
    history: createWebHistory(),
    locale: "es",
  });
  const container = document.createElement("div");
  document.body.append(container);
  app.mount(container);
  mounted.push(() => {
    app.unmount();
    container.remove();
  });
  await router.replace(path);
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
  vi.unstubAllGlobals();
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
    expect((await screen.findAllByText("Tejo Cloud Labs")).length).toBeGreaterThan(0);
  });

  it("CA-100-21 · con un id inexistente muestra que no se ha encontrado", async () => {
    await startDemoApp("/applications/no-existe/edit");

    expect(await screen.findByText("No se ha encontrado la candidatura.")).toBeTruthy();
  });
});

describe("cambio de estado", () => {
  const enableDrag = () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("pointer: fine"),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
  };

  const desktopCard = (company: string) => {
    const heading = [...document.querySelectorAll("section[data-column] h3")].find(
      (element) => element.textContent.trim() === company,
    );
    const card = heading?.closest("article");
    if (!card) throw new Error(`No existe la tarjeta de ${company}`);
    return card;
  };

  const column = (id: string) => {
    const element = document.querySelector(`section[data-column=${id}]`);
    if (!element) throw new Error(`No existe la columna ${id}`);
    return element;
  };

  const drag = async (company: string, target: string) => {
    const dataTransfer = { setData: () => undefined, effectAllowed: "" };
    await fireEvent.dragStart(desktopCard(company), { dataTransfer });
    await fireEvent.dragOver(column(target), { dataTransfer });
    await fireEvent.drop(column(target), { dataTransfer });
  };

  it("CA-101-08 · el detalle muestra los datos y el historial del más reciente al más antiguo", async () => {
    await startDemoApp("/applications/demo-10");

    expect(await screen.findByRole("heading", { level: 1, name: "Tejo Cloud" })).toBeTruthy();
    expect(screen.getByText(/34\.000\s€ – 38\.000\s€/)).toBeTruthy();
    const entries = [
      ...document.querySelectorAll("#detail-history-title + ol > li > p:first-child"),
    ];
    expect(entries.map((entry) => entry.textContent.trim())).toEqual([
      "De «Entrevistas» a «Oferta»",
      "De «Primer contacto» a «Entrevistas»",
      "De «Aplicada» a «Primer contacto»",
      "Creada en «Aplicada»",
    ]);
  });

  it("CA-101-09 · solo se ofrecen los estados permitidos y los finales no se cambian", async () => {
    const { router } = await startDemoApp("/applications/demo-10");

    await userEvent.click(await screen.findByRole("button", { name: "Cambiar estado" }));
    expect(
      screen.getAllByRole("radio").map((radio) => radio.parentElement?.textContent.trim()),
    ).toEqual(["Aceptada", "Descartada", "Retirada"]);

    await router.push("/applications/demo-11");
    expect(await screen.findByText("Estado final: no admite más cambios.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cambiar estado" })).toBeNull();
  });

  it("CA-101-10 · cambiar el estado con nota actualiza la cabecera y el historial", async () => {
    await startDemoApp("/applications/demo-08");

    const button = await screen.findByRole("button", { name: "Cambiar estado" });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole("radio", { name: "Oferta" }));
    await userEvent.type(screen.getByLabelText("Nota (opcional)"), "Llamada de la CTO");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambio" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cambiar estado" }));
    });
    expect(screen.getByText("Estado cambiado a «Oferta»")).toBeTruthy();
    expect(document.querySelector("main header")?.textContent).toContain("Oferta");
    expect(document.querySelector("#detail-history-title + ol > li")?.textContent).toContain(
      "Llamada de la CTO",
    );
  });

  it("guardar sin elegir estado avisa y no cambia nada", async () => {
    await startDemoApp("/applications/demo-08");

    await userEvent.click(await screen.findByRole("button", { name: "Cambiar estado" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambio" }));

    expect(screen.getByRole("alert").textContent).toContain("Elige el nuevo estado.");
  });

  it("CA-101-11 · el menú «Mover a…» del tablero funciona solo con teclado", async () => {
    await startDemoApp("/board");
    await waitFor(() => {
      expect(columnHeadings()[0]).toBe("Me interesa 2");
    });

    const trigger = screen.getAllByRole("button", { name: "Mover Nimbus Labs a…" }).at(-1);
    if (!trigger) throw new Error("sin menú");
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent.trim()).toBe("Aplicada");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(columnHeadings().slice(0, 2)).toEqual(["Me interesa 1", "Aplicada 4"]);
    });
  });

  it("CA-101-12 · arrastrar a una columna permitida mueve; a una no permitida, avisa", async () => {
    enableDrag();
    await startDemoApp("/board");
    await waitFor(() => {
      expect(desktopCard("Brisa Health").getAttribute("draggable")).toBe("true");
    });

    await drag("Nimbus Labs", "offer");
    expect(await screen.findByText("No se puede pasar de «Me interesa» a «Oferta».")).toBeTruthy();
    expect(columnHeadings()[0]).toBe("Me interesa 2");

    await drag("Brisa Health", "screening");
    await waitFor(() => {
      expect(columnHeadings().slice(1, 3)).toEqual(["Aplicada 2", "Primer contacto 3"]);
    });
  });

  it("CA-101-13 · soltar en «Cerradas» pregunta el estado", async () => {
    enableDrag();
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
    };
    await startDemoApp("/board");
    await waitFor(() => {
      expect(desktopCard("Tejo Cloud").getAttribute("draggable")).toBe("true");
    });

    await drag("Tejo Cloud", "closed");
    expect(await screen.findByText("¿A qué estado mueves Tejo Cloud?")).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Aceptada" }));
    await userEvent.click(screen.getByRole("button", { name: "Mover" }));

    await waitFor(() => {
      expect(columnHeadings().slice(4)).toEqual(["Oferta 0", "Cerradas 5"]);
    });
  });

  it("CA-101-14 · sin puntero preciso las tarjetas no se arrastran, pero tienen menú", async () => {
    await startDemoApp("/board");
    await waitFor(() => {
      expect(columnHeadings()).toHaveLength(6);
    });

    expect(desktopCard("Brisa Health").hasAttribute("draggable")).toBe(false);
    expect(screen.getAllByRole("button", { name: "Mover Brisa Health a…" }).length).toBeGreaterThan(
      0,
    );
  });

  it("CA-101-15 · las tarjetas llevan al detalle y «Editar» al formulario", async () => {
    const { router } = await startDemoApp("/board");
    await waitFor(() => {
      expect(columnHeadings()).toHaveLength(6);
    });

    await userEvent.click(desktopCard("Brisa Health").querySelector("a") as HTMLAnchorElement);
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("application");
    });
    await userEvent.click(await screen.findByRole("link", { name: "Editar" }));
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("application-edit");
    });
  });
});

describe("botón Volver", () => {
  it("vuelve a la pantalla anterior si se llegó navegando", async () => {
    const { router } = await startDemoApp("/list");
    await router.push("/applications/demo-03");

    await userEvent.click(await screen.findByRole("button", { name: "Volver" }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("list");
    });
  });

  it("entrando directamente, desde «Nueva candidatura» va al tablero", async () => {
    const { router } = await startDemoApp("/applications/new");

    await userEvent.click(screen.getByRole("button", { name: "Volver" }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("board");
    });
  });

  it("entrando directamente, desde editar va al detalle de esa candidatura", async () => {
    const { router } = await startDemoApp("/applications/demo-03/edit");

    await userEvent.click(await screen.findByRole("button", { name: "Volver" }));

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe("/applications/demo-03");
    });
  });
});

describe("estadísticas", () => {
  const tile = (label: string) => {
    const term = [...document.querySelectorAll("dt")].find(
      (element) => element.textContent.trim() === label,
    );
    return [...(term?.parentElement?.querySelectorAll("dd") ?? [])].map((dd) =>
      dd.textContent.trim(),
    );
  };

  const storeWith = async (applications: ApplicationSnapshot[]) => {
    const store = new MemoryKeyValueStore();
    await new DemoStorage(store).replace({
      version: 1,
      locale: "es",
      seededAt: null,
      applications,
    });
    await store.setItem("applytrack:mode", "demo");
    return store;
  };

  it("CA-105-09 · con los datos de ejemplo, la tasa de respuesta es 69 % · 9 de 13", async () => {
    await startDemoApp("/stats");

    await screen.findByText("Tasa de respuesta");
    const [value, detail] = tile("Tasa de respuesta");
    expect(value).toMatch(/^69\s%$/);
    expect(detail).toBe("9 de 13");
    expect(tile("Candidaturas activas")).toEqual(["10", "5 cerradas"]);
  });

  it("CA-105-10 · los gráficos se leen como listas con su valor escrito", async () => {
    await startDemoApp("/stats");
    await screen.findByText("Enviadas por semana");

    const weeks = [...document.querySelectorAll("#stats-weekly + ol > li")];
    expect(weeks).toHaveLength(8);
    expect(
      weeks.every((week) =>
        /Semana del .+: /.test(week.querySelector(".sr-only")?.textContent ?? ""),
      ),
    ).toBe(true);
    expect(
      document.querySelectorAll("#stats-weekly + ol [aria-hidden=true] .bg-accent"),
    ).toHaveLength(8);

    const interviewing = [...document.querySelectorAll("#stats-status ~ div dt")].find(
      (term) => term.textContent.trim() === "Entrevistas",
    );
    expect(interviewing?.parentElement?.querySelector("dd")?.textContent.trim()).toBe("2");
  });

  it("CA-105-11 · las candidaturas paradas enlazan a su detalle", async () => {
    await startDemoApp("/stats");

    const lince = await screen.findByRole("link", { name: "Lince Software" });
    expect(lince.getAttribute("href")).toBe("/applications/demo-04");
    expect(screen.getByRole("link", { name: "Olivo Fintech" }).getAttribute("href")).toBe(
      "/applications/demo-07",
    );
  });

  it("CA-105-12 · sin candidaturas muestra el mensaje vacío", async () => {
    await startApp("/stats", await storeWith([]));

    expect(await screen.findByText("Todavía no hay datos")).toBeTruthy();
  });

  it("CA-105-12 · sin enviadas, las tasas muestran «—»", async () => {
    await startApp(
      "/stats",
      await storeWith([aSnapshot({ id: "wish", ownerId: DEMO_USER_ID, status: "wishlist" })]),
    );

    await screen.findByText("Tasa de respuesta");
    expect(tile("Tasa de respuesta")).toEqual(["—", "Todavía no has enviado ninguna candidatura."]);
    expect(screen.getByText("Todavía no hay respuestas.")).toBeTruthy();
  });
});
