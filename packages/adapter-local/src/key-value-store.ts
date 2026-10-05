export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface SyncStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const run = <T>(operation: () => T): Promise<T> =>
  new Promise((resolve) => {
    resolve(operation());
  });

export const fromSyncStorage = (storage: SyncStorage): KeyValueStore => ({
  getItem: (key) => run(() => storage.getItem(key)),
  setItem: (key, value) =>
    run(() => {
      storage.setItem(key, value);
    }),
  removeItem: (key) =>
    run(() => {
      storage.removeItem(key);
    }),
});

export class MemoryKeyValueStore implements KeyValueStore {
  private readonly items = new Map<string, string>();

  failWrites = false;

  getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.items.get(key) ?? null);
  }

  setItem(key: string, value: string): Promise<void> {
    if (this.failWrites) return Promise.reject(new Error("QuotaExceededError"));
    this.items.set(key, value);
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    this.items.delete(key);
    return Promise.resolve();
  }
}
