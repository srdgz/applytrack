import type {
  PromiseMessages,
  ToastContent,
  ToastKind,
  ToastQueue,
} from "@applytrack/notifications";
import type { InjectionKey } from "vue";
import { inject } from "vue";

export const TOASTS: InjectionKey<ToastQueue> = Symbol("Toasts");

export const useToastQueue = (): ToastQueue => {
  const queue = inject(TOASTS);
  if (!queue) throw new Error("ToastQueue was not provided");
  return queue;
};

type Extra = Omit<ToastContent, "title">;

export const useToast = () => {
  const queue = useToastQueue();
  const kind =
    (toastKind: ToastKind) =>
    (title: string, extra: Extra = {}) =>
      queue.show(toastKind, { title, ...extra });

  return {
    success: kind("success"),
    info: kind("info"),
    warning: kind("warning"),
    error: kind("error"),
    action: kind("action"),
    icon: kind("icon"),
    promise: <T>(task: Promise<T>, messages: PromiseMessages<T>) => queue.promise(task, messages),
    dismiss: (id: string) => {
      queue.dismiss(id);
    },
  };
};
