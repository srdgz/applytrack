import type { Preferences } from "@applytrack/core";

import type { UseCases } from "./use-cases";

export type SessionMode = "guest" | "demo" | "account";

export interface Booted {
  readonly useCases: UseCases;
  readonly preferences: Preferences;
  readonly mode: SessionMode;
}

export type Boot = (fallback: Preferences) => Promise<Booted>;

export const resolveBooted = async (useCases: UseCases, fallback: Preferences): Promise<Booted> => {
  const [preferences, demoActive] = await Promise.all([
    useCases.getPreferences.execute({ fallback }),
    useCases.isDemoActive.execute(),
  ]);
  const mode = useCases.account ? "account" : demoActive ? "demo" : "guest";
  return { useCases, preferences, mode };
};
