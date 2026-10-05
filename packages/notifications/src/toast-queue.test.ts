import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_TOAST_ICONS, iconFor, TOAST_COLORS, TOAST_ICONS } from "./icons";
import type { Scheduler, Toast, ToastKind, ToastQueue } from "./toast-queue";
import { createToastQueue, systemScheduler, TOAST_DURATIONS } from "./toast-queue";

class FakeScheduler implements Scheduler {
  private time = 0;
  private timers = new Map<number, { at: number; callback: () => void }>();
  private next = 0;

  setTimeout(callback: () => void, ms: number): number {
    this.next += 1;
    this.timers.set(this.next, { at: this.time + ms, callback });
    return this.next;
  }

  clearTimeout(handle: unknown): void {
    this.timers.delete(handle as number);
  }

  now(): number {
    return this.time;
  }

  advance(ms: number): void {
    this.time += ms;
    for (const [handle, timer] of [...this.timers].sort(([, a], [, b]) => a.at - b.at)) {
      if (timer.at <= this.time && this.timers.has(handle)) {
        this.timers.delete(handle);
        timer.callback();
      }
    }
  }
}

const flush = () =>
  new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });

describe("createToastQueue", () => {
  let scheduler: FakeScheduler;
  let queue: ToastQueue;
  let visible: readonly Toast[];

  const titles = () => visible.map(({ title }) => title);

  beforeEach(() => {
    scheduler = new FakeScheduler();
    queue = createToastQueue({ scheduler });
    queue.subscribe((toasts) => {
      visible = toasts;
    });
  });

  it.each([
    ["success", 6000],
    ["info", 6000],
    ["icon", 6000],
    ["warning", 8000],
  ] as const)("CA-107-01 · %s se cierra solo a los %i ms", (kind, ms) => {
    queue.show(kind, { title: kind });

    scheduler.advance(ms - 1);
    expect(titles()).toEqual([kind]);
    scheduler.advance(1);
    expect(titles()).toEqual([]);
  });

  it.each(["error", "action", "loading"] as const)("CA-107-01 · %s no se cierra solo", (kind) => {
    queue.show(kind, { title: kind });

    scheduler.advance(600_000);

    expect(titles()).toEqual([kind]);
  });

  it("los más recientes van primero", () => {
    queue.show("info", { title: "A" });
    queue.show("info", { title: "B" });

    expect(titles()).toEqual(["B", "A"]);
  });

  it("CA-107-02 · como máximo 3: sale el más antiguo de los que se cierran solos", () => {
    queue.show("success", { title: "S1" });
    queue.show("error", { title: "E1" });
    queue.show("success", { title: "S2" });
    queue.show("info", { title: "I1" });

    expect(titles()).toEqual(["I1", "S2", "E1"]);
  });

  it("CA-107-02 · si ninguno se cierra solo, sale el más antiguo", () => {
    ["E1", "E2", "E3", "E4"].forEach((title) => queue.show("error", { title }));

    expect(titles()).toEqual(["E4", "E3", "E2"]);
  });

  it("CA-107-03 · un aviso repetido no se duplica, actualiza su contenido y reinicia su tiempo", () => {
    const first = queue.show("success", { title: "Guardada", description: "Uno" });
    scheduler.advance(5000);

    expect(queue.show("success", { title: "Guardada", description: "Dos" })).toBe(first);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.description).toBe("Dos");

    scheduler.advance(5999);
    expect(titles()).toEqual(["Guardada"]);
    scheduler.advance(1);
    expect(titles()).toEqual([]);
  });

  it("CA-107-04 · pausar conserva el tiempo restante", () => {
    const id = queue.show("success", { title: "Guardada" });
    scheduler.advance(4000);

    queue.pause(id);
    queue.pause(id);
    scheduler.advance(60_000);
    expect(titles()).toEqual(["Guardada"]);

    queue.resume(id);
    queue.resume(id);
    scheduler.advance(1999);
    expect(titles()).toEqual(["Guardada"]);
    scheduler.advance(1);
    expect(titles()).toEqual([]);
  });

  it("pausar o reanudar un aviso que no se cierra solo o desconocido no hace nada", () => {
    const id = queue.show("error", { title: "Fallo" });

    queue.pause(id);
    queue.resume(id);
    queue.pause("missing");
    queue.resume("missing");
    scheduler.advance(600_000);

    expect(titles()).toEqual(["Fallo"]);
  });

  it("CA-107-05 · update cambia tipo y contenido y aplica el tiempo del nuevo tipo", () => {
    const id = queue.show("loading", { title: "Cargando" });

    queue.update(id, "success", { title: "Listo", description: "Hecho" });
    queue.update("missing", "error", { title: "Nada" });

    expect(visible).toEqual([{ id, kind: "success", title: "Listo", description: "Hecho" }]);
    scheduler.advance(6000);
    expect(titles()).toEqual([]);
  });

  it("CA-107-06 · promise muestra la carga y la transforma en éxito en el mismo aviso", async () => {
    let resolve: (value: string) => void = () => undefined;
    const task = new Promise<string>((done) => {
      resolve = done;
    });

    const result = queue.promise(task, {
      loading: { title: "Restaurando" },
      success: (value) => ({ title: `Listo ${value}` }),
      error: { title: "Fallo" },
    });
    scheduler.advance(300);
    const loading = visible[0];
    expect(loading?.kind).toBe("loading");

    resolve("ok");
    expect(await result).toBe("ok");
    expect(visible).toEqual([{ id: loading?.id, kind: "success", title: "Listo ok" }]);
  });

  it("CA-107-06 · si la promesa falla, se transforma en error y rechaza igual", async () => {
    let reject: (reason: Error) => void = () => undefined;
    const task = new Promise<string>((_, fail) => {
      reject = fail;
    });

    const result = queue.promise(task, {
      loading: { title: "Restaurando" },
      success: { title: "Listo" },
      error: (reason) => ({ title: "Fallo", description: (reason as Error).message }),
    });
    scheduler.advance(300);
    reject(new Error("sin espacio"));

    await expect(result).rejects.toThrow("sin espacio");
    expect(visible.map(({ kind, description }) => [kind, description])).toEqual([
      ["error", "sin espacio"],
    ]);
  });

  it("CA-107-06 · si termina antes de 300 ms, solo se ve el resultado", async () => {
    const seen: ToastKind[][] = [];
    queue.subscribe((toasts) => seen.push(toasts.map(({ kind }) => kind)));

    await queue.promise(Promise.resolve(1), {
      loading: { title: "Cargando" },
      success: { title: "Listo" },
      error: { title: "Fallo" },
    });
    await flush();
    scheduler.advance(300);

    expect(seen.flat()).not.toContain("loading");
    expect(titles()).toEqual(["Listo"]);
  });

  it("si la carga se cerró antes de terminar, el resultado aparece como aviso nuevo", async () => {
    let resolve: () => void = () => undefined;
    const task = new Promise<void>((done) => {
      resolve = done;
    });
    const result = queue.promise(task, {
      loading: { title: "Cargando" },
      success: { title: "Listo" },
      error: { title: "Fallo" },
    });
    scheduler.advance(300);
    queue.dismiss(visible[0]?.id ?? "");

    resolve();
    await result;

    expect(titles()).toEqual(["Listo"]);
  });

  it("la acción cierra el aviso y ejecuta su función", () => {
    const calls: string[] = [];
    queue.show("action", {
      title: "Archivada",
      action: { label: "Deshacer", onPress: () => calls.push("undo") },
    });

    visible[0]?.action?.onPress();

    expect(calls).toEqual(["undo"]);
    expect(titles()).toEqual([]);
  });

  it("dismiss, clear y darse de baja funcionan", () => {
    const calls: number[] = [];
    const unsubscribe = queue.subscribe((toasts) => calls.push(toasts.length));
    const id = queue.show("success", { title: "A" });
    queue.show("error", { title: "B" });

    queue.dismiss(id);
    queue.dismiss("missing");
    queue.clear();
    unsubscribe();
    queue.show("info", { title: "Después" });

    expect(calls).toEqual([0, 1, 2, 1, 0]);
  });

  it("acepta duraciones y tamaño de pila propios", () => {
    const custom = createToastQueue({ scheduler, maxVisible: 1, durations: { error: 100 } });
    let shown: readonly Toast[] = [];
    custom.subscribe((toasts) => {
      shown = toasts;
    });

    custom.show("info", { title: "A" });
    custom.show("error", { title: "B" });
    expect(shown.map(({ title }) => title)).toEqual(["B"]);

    scheduler.advance(100);
    expect(shown).toEqual([]);
  });

  it("el planificador del sistema usa los temporizadores globales", async () => {
    const before = systemScheduler.now();
    await new Promise<void>((resolve) => {
      systemScheduler.setTimeout(resolve, 1);
    });
    systemScheduler.clearTimeout(systemScheduler.setTimeout(() => undefined, 10));

    expect(systemScheduler.now()).toBeGreaterThanOrEqual(before);
  });
});

describe("iconos y colores", () => {
  it("cada tipo tiene icono, color y duración", () => {
    for (const kind of Object.keys(TOAST_DURATIONS) as ToastKind[]) {
      expect(TOAST_ICONS[DEFAULT_TOAST_ICONS[kind]].length).toBeGreaterThan(0);
      expect(TOAST_COLORS[kind]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("usa el icono propio si lo hay", () => {
    expect(iconFor({ kind: "icon", icon: "rocket" })).toBe("rocket");
    expect(iconFor({ kind: "success" })).toBe("check");
  });
});
