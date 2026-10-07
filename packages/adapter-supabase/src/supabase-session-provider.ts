import type { SessionProvider, UserId } from "@applytrack/core";
import { toUserId } from "@applytrack/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseSessionProvider implements SessionProvider {
  constructor(private readonly client: SupabaseClient) {}

  async currentUser(): Promise<UserId | null> {
    const { data } = await this.client.auth.getSession();
    const id = data.session?.user.id;
    return id === undefined ? null : toUserId(id);
  }
}
