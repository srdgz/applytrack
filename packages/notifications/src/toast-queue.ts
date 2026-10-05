export type ToastKind = "success" | "info" | "error";

export interface Toast {
  readonly id: string;
  readonly kind: ToastKind;
  readonly message: string;
}

export type TimerHandle = unknown;

export interface Scheduler {
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
  now(): number;
}

export interface ToastQueueOptions {
  readonly maxVisible?: number;
  readonly durationMs?: number;
  readonly scheduler?: Scheduler;
}

export type ToastListener = (toasts: readonly Toast[]) => void;

export interface ToastQueue {
  show(kind: ToastKind, message: string): string;
  dismiss(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  clear(): void;
  subscribe(listener: ToastListener): () => void;
}

interface Timers {
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

const host = globalThis as unknown as Timers;

export const systemScheduler: Scheduler = {
  setTimeout: (callback, ms) => host.setTimeout(callback, ms),
  clearTimeout: (handle) => {
    host.clearTimeout(handle);
  },
  now: () => Date.now(),
};

export const MAX_VISIBLE_TOASTS = 3;
export const TOAST_DURATION_MS = 5000;

interface Entry {
  readonly toast: Toast;
  timer: TimerHandle;
  running: boolean;
  remaining: number;
  startedAt: number;
}

export const createToastQueue = ({
  maxVisible = MAX_VISIBLE_TOASTS,
  durationMs = TOAST_DURATION_MS,
  scheduler = systemScheduler,
}: ToastQueueOptions = {}): ToastQueue => {
  let entries: Entry[] = [];
  let counter = 0;
  const listeners = new Set<ToastListener>();

  const emit = () => {
    const toasts = entries.map(({ toast }) => toast);
    listeners.forEach((listener) => {
      listener(toasts);
    });
  };

  const stopTimer = (entry: Entry) => {
    if (!entry.running) return;
    scheduler.clearTimeout(entry.timer);
    entry.running = false;
  };

  const startTimer = (entry: Entry) => {
    if (entry.toast.kind === "error") return;
    stopTimer(entry);
    entry.startedAt = scheduler.now();
    entry.timer = scheduler.setTimeout(() => {
      dismiss(entry.toast.id);
    }, entry.remaining);
    entry.running = true;
  };

  const remove = (entry: Entry) => {
    stopTimer(entry);
    entries = entries.filter((candidate) => candidate !== entry);
  };

  const dismiss = (id: string) => {
    const entry = entries.find(({ toast }) => toast.id === id);
    if (!entry) return;
    remove(entry);
    emit();
  };

  const evictOne = () => {
    const victim = entries.find(({ toast }) => toast.kind !== "error") ?? entries[0];
    if (victim) remove(victim);
  };

  const show = (kind: ToastKind, message: string): string => {
    const existing = entries.find(({ toast }) => toast.kind === kind && toast.message === message);
    if (existing) {
      existing.remaining = durationMs;
      startTimer(existing);
      return existing.toast.id;
    }

    while (entries.length >= maxVisible) evictOne();

    counter += 1;
    const entry: Entry = {
      toast: { id: `toast-${String(counter)}`, kind, message },
      timer: undefined,
      running: false,
      remaining: durationMs,
      startedAt: scheduler.now(),
    };
    entries = [...entries, entry];
    startTimer(entry);
    emit();
    return entry.toast.id;
  };

  const pause = (id: string) => {
    const entry = entries.find(({ toast }) => toast.id === id);
    if (!entry?.running) return;
    stopTimer(entry);
    entry.remaining = Math.max(0, entry.remaining - (scheduler.now() - entry.startedAt));
  };

  const resume = (id: string) => {
    const entry = entries.find(({ toast }) => toast.id === id);
    if (!entry || entry.running) return;
    startTimer(entry);
  };

  const clear = () => {
    entries.forEach(stopTimer);
    entries = [];
    emit();
  };

  const subscribe = (listener: ToastListener) => {
    listeners.add(listener);
    listener(entries.map(({ toast }) => toast));
    return () => {
      listeners.delete(listener);
    };
  };

  return { show, dismiss, pause, resume, clear, subscribe };
};
