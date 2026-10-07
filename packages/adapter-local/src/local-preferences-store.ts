import type { Preferences, PreferencesStore } from "@applytrack/core";
import { parsePreferences } from "@applytrack/core";

import type { KeyValueStore } from "./key-value-store";
import { LOCALE_KEY, THEME_KEY } from "./storage-keys";

export class LocalPreferencesStore implements PreferencesStore {
  constructor(private readonly store: KeyValueStore) {}

  async get(): Promise<Preferences | null> {
    const locale = await this.store.getItem(LOCALE_KEY);
    if (locale === null) return null;
    const theme = (await this.store.getItem(THEME_KEY)) ?? "system";
    return parsePreferences({ locale, theme });
  }

  async save({ locale, theme }: Preferences): Promise<void> {
    await this.store.setItem(LOCALE_KEY, locale);
    await this.store.setItem(THEME_KEY, theme);
  }
}
