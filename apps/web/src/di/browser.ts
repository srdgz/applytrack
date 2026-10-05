import { fromSyncStorage } from "@applytrack/adapter-local";

import { createContainer } from "./container";
import type { UseCases } from "./use-cases";

export const createBrowserContainer = (): UseCases =>
  createContainer({
    store: fromSyncStorage(window.localStorage),
    warn: (message) => {
      console.warn(message);
    },
  });
