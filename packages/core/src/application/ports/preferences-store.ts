import type { Preferences } from "../../domain/preferences/preferences";

export interface PreferencesStore {
  get(): Promise<Preferences | null>;
  save(preferences: Preferences): Promise<void>;
}
