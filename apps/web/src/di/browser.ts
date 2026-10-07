import { fromSyncStorage } from "@applytrack/adapter-local";
import { createSupabaseAdapters } from "@applytrack/adapter-supabase";
import { createClient } from "@supabase/supabase-js";

import { createContainer } from "./container";
import type { UseCases } from "./use-cases";

const warn = (message: string) => {
  console.warn(message);
};

export const readSupabaseConfig = (env: Partial<Record<string, string>>) => {
  const url = env.VITE_SUPABASE_URL?.trim();
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && publishableKey ? { url, publishableKey } : null;
};

export const createBrowserContainer = async (): Promise<UseCases> => {
  const store = fromSyncStorage(window.localStorage);
  const config = readSupabaseConfig(import.meta.env);
  if (!config) return createContainer({ store, warn });

  const client = createClient(config.url, config.publishableKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });
  const adapters = createSupabaseAdapters(client, warn);
  const account = await adapters.auth.currentAccount().catch(() => null);

  if (account) {
    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.assign("/");
    });
  }

  return createContainer({
    store,
    warn,
    auth: adapters.auth,
    ...(account && { signedIn: { account, adapters } }),
  });
};
