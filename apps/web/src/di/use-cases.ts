import type { UseCases } from "@applytrack/composition";
import type { InjectionKey } from "vue";
import { inject } from "vue";

export type { UseCases } from "@applytrack/composition";

export const USE_CASES: InjectionKey<UseCases> = Symbol("UseCases");

export const useUseCases = (): UseCases => {
  const useCases = inject(USE_CASES);
  if (!useCases) throw new Error("UseCases were not provided");
  return useCases;
};
