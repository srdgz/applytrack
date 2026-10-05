import type { ToastIconName } from "./icons";

import type { ToastKind } from "./kinds";

export type { ToastKind };

export interface ToastAction {
  readonly label: string;
  readonly onPress: () => void;
}

export interface ToastContent {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ToastIconName;
  readonly action?: ToastAction;
}

export interface Toast extends ToastContent {
  readonly id: string;
  readonly kind: ToastKind;
}

export type TimerHandle = unknown;

export interface Scheduler {
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
  now(): number;
}

export interface PromiseMessages<T> {
  readonly loading: ToastContent;
  readonly success: ToastContent | ((value: T) => ToastContent);
  readonly error: ToastContent | ((reason: unknown) => ToastContent);
}

export interface ToastQueueOptions {
  readonly maxVisible?: number;
  readonly durations?: Partial<Readonly<Record<ToastKind, number | null>>>;
  readonly promiseDelayMs?: number;
  readonly scheduler?: Scheduler;
}

export type ToastListener = (toasts: readonly Toast[]) => void;

export interface ToastQueue {
  show(kind: ToastKind, content: ToastContent): string;
  update(id: string, kind: ToastKind, content: ToastContent): void;
  promise<T>(task: Promise<T>, messages: PromiseMessages<T>): Promise<T>;
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
export const PROMISE_DELAY_MS = 300;

export const TOAST_DURATIONS: Readonly<Record<ToastKind, number | null>> = {
  success: 6000,
  info: 6000,
  icon: 6000,
  warning: 8000,
  error: null,
  action: null,
  loading: null,
};

interface Entry {
  toast: Toast;
  timer: TimerHandle;
  running: boolean;
  remaining: number;
  startedAt: number;
}

const resolveContent = <A>(content: ToastContent | ((arg: A) => ToastContent), arg: A) =>
  typeof content === "function" ? content(arg) : content;

export const createToastQueue = ({
  maxVisible = MAX_VISIBLE_TOASTS,
  durations = {},
  promiseDelayMs = PROMISE_DELAY_MS,
  scheduler = systemScheduler,
}: ToastQueueOptions = {}): ToastQueue => {
  const durationOf = (kind: ToastKind): number | null =>
    kind in durations ? (durations[kind] ?? null) : TOAST_DURATIONS[kind];

  let entries: Entry[] = [];
  let counter = 0;
  const listeners = new Set<ToastListener>();

  const emit = () => {
    const toasts = entries.map(({ toast }) => toast);
    listeners.forEach((listener) => {
      listener(toasts);
    });
  };

  const find = (id: string) => entries.find(({ toast }) => toast.id === id);

  const stopTimer = (entry: Entry) => {
    if (!entry.running) return;
    scheduler.clearTimeout(entry.timer);
    entry.running = false;
  };

  const startTimer = (entry: Entry) => {
    stopTimer(entry);
    if (durationOf(entry.toast.kind) === null) return;
    entry.startedAt = scheduler.now();
    entry.timer = scheduler.setTimeout(() => {
      dismiss(entry.toast.id);
    }, entry.remaining);
    entry.running = true;
  };

  const resetTimer = (entry: Entry) => {
    entry.remaining = durationOf(entry.toast.kind) ?? 0;
    startTimer(entry);
  };

  const remove = (entry: Entry) => {
    stopTimer(entry);
    entries = entries.filter((candidate) => candidate !== entry);
  };

  const dismiss = (id: string) => {
    const entry = find(id);
    if (!entry) return;
    remove(entry);
    emit();
  };

  const evictOldest = () => {
    const oldestFirst = [...entries].reverse();
    const victim =
      oldestFirst.find(({ toast }) => durationOf(toast.kind) !== null) ?? oldestFirst[0];
    if (victim) remove(victim);
  };

  const build = (id: string, kind: ToastKind, content: ToastContent): Toast => {
    const { action } = content;
    return {
      ...content,
      ...(action && {
        action: {
          label: action.label,
          onPress: () => {
            dismiss(id);
            action.onPress();
          },
        },
      }),
      id,
      kind,
    };
  };

  const update = (id: string, kind: ToastKind, content: ToastContent) => {
    const entry = find(id);
    if (!entry) return;
    entry.toast = build(id, kind, content);
    resetTimer(entry);
    emit();
  };

  const show = (kind: ToastKind, content: ToastContent): string => {
    const existing = entries.find(
      ({ toast }) => toast.kind === kind && toast.title === content.title,
    );
    if (existing) {
      update(existing.toast.id, kind, content);
      return existing.toast.id;
    }

    while (entries.length >= maxVisible) evictOldest();

    counter += 1;
    const id = `toast-${String(counter)}`;
    const entry: Entry = {
      toast: build(id, kind, content),
      timer: undefined,
      running: false,
      remaining: 0,
      startedAt: scheduler.now(),
    };
    entries = [entry, ...entries];
    resetTimer(entry);
    emit();
    return id;
  };

  const promise = <T>(task: Promise<T>, messages: PromiseMessages<T>): Promise<T> => {
    let id: string | undefined;
    let settled = false;
    const delay = scheduler.setTimeout(() => {
      if (!settled) id = show("loading", messages.loading);
    }, promiseDelayMs);

    const finish = (kind: ToastKind, content: ToastContent) => {
      settled = true;
      scheduler.clearTimeout(delay);
      if (id !== undefined && find(id)) update(id, kind, content);
      else show(kind, content);
    };

    return task.then(
      (value) => {
        finish("success", resolveContent(messages.success, value));
        return value;
      },
      (reason: unknown) => {
        finish("error", resolveContent(messages.error, reason));
        throw reason;
      },
    );
  };

  const pause = (id: string) => {
    const entry = find(id);
    if (!entry?.running) return;
    stopTimer(entry);
    entry.remaining = Math.max(0, entry.remaining - (scheduler.now() - entry.startedAt));
  };

  const resume = (id: string) => {
    const entry = find(id);
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

  return { show, update, promise, dismiss, pause, resume, clear, subscribe };
};
