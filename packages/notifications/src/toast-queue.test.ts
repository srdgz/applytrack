import { beforeEach, describe, expect, it } from "vitest";

import type { Scheduler, Toast, ToastQueue } from "./toast-queue";
import { createToastQueue, systemScheduler } from "./toast-queue";

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
    for (const [handle, timer] of [...this.timers]) {
      if (timer.at <= this.time) {
        this.timers.delete(handle);
        timer.callback();
      }
    }
  }
}

describe("createToastQueue", () => {
  let scheduler: FakeScheduler;
  let queue: ToastQueue;
  let visible: readonly Toast[];

  const messages = () => visible.map(({ message }) => message);

  beforeEach(() => {
    scheduler = new FakeScheduler();
    queue = createToastQueue({ scheduler });
    queue.subscribe((toasts) => {
      visible = toasts;
    });
  });

  it("CA-107-01 · éxito e información se cierran a los 5 s; los errores no", () => {
    queue.show("success", "Guardada");
    queue.show("info", "Info");
    queue.show("error", "Fallo");

    scheduler.advance(4999);
    expect(messages()).toEqual(["Guardada", "Info", "Fallo"]);

    scheduler.advance(1);
    expect(messages()).toEqual(["Fallo"]);

    scheduler.advance(60_000);
    expect(messages()).toEqual(["Fallo"]);
  });

  it("CA-107-02 · como máximo 3: el cuarto expulsa al más antiguo que se cierra solo", () => {
    queue.show("error", "E1");
    queue.show("success", "S1");
    queue.show("success", "S2");
    queue.show("info", "I1");

    expect(messages()).toEqual(["E1", "S2", "I1"]);
  });

  it("CA-107-02 · si todos son errores, sale el error más antiguo", () => {
    ["E1", "E2", "E3", "E4"].forEach((message) => queue.show("error", message));

    expect(messages()).toEqual(["E2", "E3", "E4"]);
  });

  it("CA-107-03 · un aviso repetido no se duplica y reinicia su tiempo", () => {
    const first = queue.show("success", "Guardada");
    scheduler.advance(4000);

    expect(queue.show("success", "Guardada")).toBe(first);
    expect(messages()).toEqual(["Guardada"]);

    scheduler.advance(4000);
    expect(messages()).toEqual(["Guardada"]);
    scheduler.advance(1000);
    expect(messages()).toEqual([]);
  });

  it("el mismo texto con otro tipo sí es otro aviso", () => {
    queue.show("success", "Hecho");
    queue.show("info", "Hecho");

    expect(visible).toHaveLength(2);
  });

  it("CA-107-04 · pausar detiene el tiempo y reanudar continúa con el que quedaba", () => {
    const id = queue.show("success", "Guardada");
    scheduler.advance(3000);

    queue.pause(id);
    scheduler.advance(60_000);
    expect(messages()).toEqual(["Guardada"]);

    queue.resume(id);
    scheduler.advance(1999);
    expect(messages()).toEqual(["Guardada"]);
    scheduler.advance(1);
    expect(messages()).toEqual([]);
  });

  it("pausar o reanudar un error o un id desconocido no hace nada", () => {
    const error = queue.show("error", "Fallo");

    queue.pause(error);
    queue.resume(error);
    queue.pause("missing");
    queue.resume("missing");
    scheduler.advance(60_000);

    expect(messages()).toEqual(["Fallo"]);
  });

  it("reanudar sin haber pausado no reinicia el tiempo", () => {
    const id = queue.show("success", "Guardada");
    scheduler.advance(3000);

    queue.resume(id);
    scheduler.advance(2000);

    expect(messages()).toEqual([]);
  });

  it("CA-107-05 · cerrar cancela el temporizador y avisa a los suscriptores", () => {
    const calls: number[] = [];
    const unsubscribe = queue.subscribe((toasts) => calls.push(toasts.length));
    const id = queue.show("success", "Guardada");

    queue.dismiss(id);
    queue.dismiss("missing");
    unsubscribe();
    queue.show("info", "Después");
    scheduler.advance(10_000);

    expect(calls).toEqual([0, 1, 0]);
    expect(messages()).toEqual([]);
  });

  it("clear cierra todos los avisos", () => {
    queue.show("error", "E1");
    queue.show("success", "S1");

    queue.clear();
    scheduler.advance(10_000);

    expect(messages()).toEqual([]);
  });

  it("acepta otro tamaño de pila y otra duración", () => {
    const custom = createToastQueue({ scheduler, maxVisible: 1, durationMs: 100 });
    let shown: readonly Toast[] = [];
    custom.subscribe((toasts) => {
      shown = toasts;
    });

    custom.show("info", "A");
    custom.show("info", "B");
    expect(shown.map(({ message }) => message)).toEqual(["B"]);

    scheduler.advance(100);
    expect(shown).toEqual([]);
  });

  it("el planificador del sistema usa los temporizadores globales", async () => {
    const before = systemScheduler.now();
    await new Promise<void>((resolve) => {
      const handle = systemScheduler.setTimeout(resolve, 1);
      expect(handle).toBeDefined();
    });
    systemScheduler.clearTimeout(systemScheduler.setTimeout(() => undefined, 10));

    expect(systemScheduler.now()).toBeGreaterThanOrEqual(before);
  });
});
