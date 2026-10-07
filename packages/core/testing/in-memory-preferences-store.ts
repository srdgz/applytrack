import type { Preferences, PreferencesStore } from "../src";

export class InMemoryPreferencesStore implements PreferencesStore {
  failing = false;
  saves = 0;

  constructor(private preferences: Preferences | null = null) {}

  get(): Promise<Preferences | null> {
    if (this.failing) return Promise.reject(new Error("unavailable"));
    return Promise.resolve(this.preferences);
  }

  save(preferences: Preferences): Promise<void> {
    if (this.failing) return Promise.reject(new Error("unavailable"));
    this.preferences = preferences;
    this.saves += 1;
    return Promise.resolve();
  }

  peek(): Preferences | null {
    return this.preferences;
  }
}
