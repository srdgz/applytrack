import type {
  ExitDemo,
  IsDemoActive,
  ListTags,
  ResetDemo,
  SearchApplications,
  StartDemo,
} from "@applytrack/core";
import type { InjectionKey } from "vue";
import { inject } from "vue";

export interface UseCases {
  readonly isDemoActive: IsDemoActive;
  readonly startDemo: StartDemo;
  readonly resetDemo: ResetDemo;
  readonly exitDemo: ExitDemo;
  readonly searchApplications: SearchApplications;
  readonly listTags: ListTags;
}

export const USE_CASES: InjectionKey<UseCases> = Symbol("UseCases");

export const useUseCases = (): UseCases => {
  const useCases = inject(USE_CASES);
  if (!useCases) throw new Error("UseCases were not provided");
  return useCases;
};
