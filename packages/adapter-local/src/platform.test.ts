import { describe, expect, it } from "vitest";

import type { SyncStorage } from "./key-value-store";
import { fromSyncStorage } from "./key-value-store";
import { SystemClock } from "./system-clock";
import { UuidGenerator } from "./uuid-generator";

class FakeLocalStorage implements SyncStorage {
  readonly items = new Map<string, string>();
  full = false;

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.full) throw new Error("QuotaExceededError");
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

describe("fromSyncStorage", () => {
  it("expone un almacén síncrono como asíncrono", async () => {
    const storage = new FakeLocalStorage();
    const store = fromSyncStorage(storage);

    await store.setItem("k", "v");
    expect(await store.getItem("k")).toBe("v");

    await store.removeItem("k");
    expect(await store.getItem("k")).toBeNull();
  });

  it("convierte los errores de escritura en promesas rechazadas", async () => {
    const storage = new FakeLocalStorage();
    storage.full = true;

    await expect(fromSyncStorage(storage).setItem("k", "v")).rejects.toThrow("QuotaExceededError");
  });
});

describe("SystemClock", () => {
  it("devuelve la hora actual y el día de hoy", () => {
    const clock = new SystemClock();
    const before = Date.now();

    expect(clock.now().getTime()).toBeGreaterThanOrEqual(before);
    expect(clock.today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("UuidGenerator", () => {
  it("usa la función que recibe para generar ids", () => {
    let counter = 0;
    const ids = new UuidGenerator(() => `uuid-${String((counter += 1))}`);

    expect([ids.next(), ids.next()]).toEqual(["uuid-1", "uuid-2"]);
  });
});
