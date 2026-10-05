import type { ApplicationSnapshot } from "@applytrack/core";

import type { KeyValueStore } from "./key-value-store";
import { datasetSchema, parseSnapshot } from "./snapshot-schema";
import { StorageFullError } from "./storage-full-error";
import { DEMO_KEY } from "./storage-keys";

export interface DemoDataset {
  readonly version: 1;
  readonly locale: string | null;
  readonly seededAt: string | null;
  readonly applications: readonly ApplicationSnapshot[];
}

export type DemoReadResult =
  | { readonly kind: "absent" }
  | { readonly kind: "corrupt" }
  | { readonly kind: "ok"; readonly dataset: DemoDataset };

export type Warn = (message: string) => void;

const emptyDataset: DemoDataset = { version: 1, locale: null, seededAt: null, applications: [] };

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export class DemoStorage {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: KeyValueStore,
    private readonly warn: Warn = () => undefined,
  ) {}

  async read(): Promise<DemoReadResult> {
    const raw = await this.store.getItem(DEMO_KEY);
    if (raw === null) return { kind: "absent" };

    const envelope = datasetSchema.safeParse(parseJson(raw));
    if (!envelope.success) {
      this.warn("ApplyTrack demo data is corrupt or has an unknown version");
      return { kind: "corrupt" };
    }

    const applications: ApplicationSnapshot[] = [];
    envelope.data.applications.forEach((row, index) => {
      const snapshot = parseSnapshot(row);
      if (snapshot) applications.push(snapshot);
      else
        this.warn(
          `ApplyTrack demo data: discarded invalid application at position ${String(index)}`,
        );
    });

    return { kind: "ok", dataset: { ...envelope.data, version: 1, applications } };
  }

  async applications(): Promise<readonly ApplicationSnapshot[]> {
    const result = await this.read();
    return result.kind === "ok" ? result.dataset.applications : [];
  }

  update(change: (dataset: DemoDataset) => DemoDataset): Promise<void> {
    return this.enqueue(async () => {
      const current = await this.read();
      await this.write(change(current.kind === "ok" ? current.dataset : emptyDataset));
    });
  }

  replace(dataset: DemoDataset): Promise<void> {
    return this.enqueue(() => this.write(dataset));
  }

  private async write(dataset: DemoDataset): Promise<void> {
    try {
      await this.store.setItem(DEMO_KEY, JSON.stringify(dataset));
    } catch (cause) {
      throw new StorageFullError(cause);
    }
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }
}
