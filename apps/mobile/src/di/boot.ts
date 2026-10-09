import "react-native-url-polyfill/auto";

import type { KeyValueStore } from "@applytrack/adapter-local";
import { UuidGenerator } from "@applytrack/adapter-local";
import { createSupabaseAdapters } from "@applytrack/adapter-supabase";
import type { UseCases } from "@applytrack/composition";
import { createContainer } from "@applytrack/composition";
import type { Preferences } from "@applytrack/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "expo-crypto";

import type { Booted } from "./booted";
import { resolveBooted } from "./booted";

export const ids = new UuidGenerator(() => randomUUID());

const warn = (message: string) => {
  console.warn(message);
};

export const asyncStorageStore: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const readSupabaseConfig = (env: Partial<Record<string, string>>) => {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && publishableKey ? { url, publishableKey } : null;
};

const loadUseCases = async (store: KeyValueStore): Promise<UseCases> => {
  const config = readSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY as
      string | undefined,
  });
  if (!config) return createContainer({ store, warn, ids });

  const client = createClient(config.url, config.publishableKey, {
    auth: {
      flowType: "pkce",
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  const adapters = createSupabaseAdapters(client, warn);
  const account = await adapters.auth.currentAccount().catch(() => null);

  return createContainer({
    store,
    warn,
    ids,
    auth: adapters.auth,
    ...(account && { signedIn: { account, adapters } }),
  });
};

export const boot = async (fallback: Preferences): Promise<Booted> =>
  resolveBooted(await loadUseCases(asyncStorageStore), fallback);
