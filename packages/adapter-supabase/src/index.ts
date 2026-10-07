import type { SupabaseClient } from "@supabase/supabase-js";

import type { Warn } from "./supabase-application-repository";
import { SupabaseApplicationRepository } from "./supabase-application-repository";
import { SupabaseAuthGateway } from "./supabase-auth-gateway";
import { SupabaseProfilePreferencesStore } from "./supabase-profile-preferences-store";
import { SupabaseSessionProvider } from "./supabase-session-provider";

export { toAuthFailure } from "./auth-failure";
export { parseApplicationRow, toSavePayload } from "./rows";
export { SupabaseApplicationRepository } from "./supabase-application-repository";
export type { Warn } from "./supabase-application-repository";
export { SupabaseAuthGateway } from "./supabase-auth-gateway";
export { SupabaseProfilePreferencesStore } from "./supabase-profile-preferences-store";
export { SupabaseSessionProvider } from "./supabase-session-provider";

export const createSupabaseAdapters = (client: SupabaseClient, warn?: Warn) => {
  const session = new SupabaseSessionProvider(client);
  return {
    session,
    auth: new SupabaseAuthGateway(client),
    repository: new SupabaseApplicationRepository(client, warn),
    profile: new SupabaseProfilePreferencesStore(client, session),
  };
};

export type SupabaseAdapters = ReturnType<typeof createSupabaseAdapters>;
