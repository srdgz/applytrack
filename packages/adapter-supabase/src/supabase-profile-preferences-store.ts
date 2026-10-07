import type { Preferences, PreferencesStore, SessionProvider } from "@applytrack/core";
import { parsePreferences } from "@applytrack/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseProfilePreferencesStore implements PreferencesStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly session: SessionProvider,
  ) {}

  async get(): Promise<Preferences | null> {
    const userId = await this.session.currentUser();
    if (userId === null) return null;

    const { data, error } = await this.client
      .from("profiles")
      .select("locale, theme")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return parsePreferences(data);
  }

  async save({ locale, theme }: Preferences): Promise<void> {
    const userId = await this.session.currentUser();
    if (userId === null) throw new Error("No session");

    const { error } = await this.client
      .from("profiles")
      .upsert({ user_id: userId, locale, theme, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }
}
