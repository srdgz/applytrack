import type { InjectionKey } from "vue";
import { inject } from "vue";

export type HardNavigate = (path: string) => void;

export const HARD_NAVIGATE: InjectionKey<HardNavigate> = Symbol("HardNavigate");

export const browserNavigate: HardNavigate = (path) => {
  window.location.assign(path);
};

export const useHardNavigation = (): HardNavigate => inject(HARD_NAVIGATE, browserNavigate);
