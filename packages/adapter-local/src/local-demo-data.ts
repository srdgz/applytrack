import type { Clock, DemoData } from "@applytrack/core";

import type { DemoDataset, DemoStorage } from "./demo-storage";
import type { KeyValueStore } from "./key-value-store";
import { buildSeed, resolveSeedLocale } from "./seed/build-seed";
import { DEMO_MODE, MODE_KEY } from "./storage-keys";

export interface LocalDemoDataDeps {
  readonly store: KeyValueStore;
  readonly storage: DemoStorage;
  readonly clock: Clock;
}

export class LocalDemoData implements DemoData {
  constructor(private readonly deps: LocalDemoDataDeps) {}

  async isActive(): Promise<boolean> {
    return (await this.deps.store.getItem(MODE_KEY)) === DEMO_MODE;
  }

  async start(contentLocale: string): Promise<void> {
    await this.deps.store.setItem(MODE_KEY, DEMO_MODE);
    const current = await this.deps.storage.read();
    if (current.kind !== "ok") await this.deps.storage.replace(this.seed(contentLocale));
  }

  reset(contentLocale: string): Promise<void> {
    return this.deps.storage.replace(this.seed(contentLocale));
  }

  exit(): Promise<void> {
    return this.deps.store.removeItem(MODE_KEY);
  }

  private seed(contentLocale: string): DemoDataset {
    const now = this.deps.clock.now();
    const locale = resolveSeedLocale(contentLocale);
    return {
      version: 1,
      locale,
      seededAt: now.toISOString(),
      applications: buildSeed(locale, now),
    };
  }
}
