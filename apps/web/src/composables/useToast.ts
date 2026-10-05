import type { ToastQueue } from "@applytrack/notifications";
import type { InjectionKey } from "vue";
import { inject } from "vue";

export const TOASTS: InjectionKey<ToastQueue> = Symbol("Toasts");

export const useToastQueue = (): ToastQueue => {
  const queue = inject(TOASTS);
  if (!queue) throw new Error("ToastQueue was not provided");
  return queue;
};

export const useToast = () => {
  const queue = useToastQueue();
  return {
    success: (message: string) => queue.show("success", message),
    info: (message: string) => queue.show("info", message),
    error: (message: string) => queue.show("error", message),
  };
};
