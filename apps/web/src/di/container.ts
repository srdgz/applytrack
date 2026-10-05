import type { KeyValueStore, Warn } from "@applytrack/adapter-local";
import {
  DemoSessionProvider,
  DemoStorage,
  LocalApplicationRepository,
  LocalDemoData,
  SystemClock,
} from "@applytrack/adapter-local";
import type { Clock } from "@applytrack/core";
import {
  ExitDemo,
  IsDemoActive,
  ListTags,
  ResetDemo,
  SearchApplications,
  StartDemo,
} from "@applytrack/core";

import type { UseCases } from "./use-cases";

export interface ContainerOptions {
  readonly store: KeyValueStore;
  readonly warn?: Warn;
  readonly clock?: Clock;
}

export const createContainer = ({
  store,
  warn,
  clock = new SystemClock(),
}: ContainerOptions): UseCases => {
  const storage = new DemoStorage(store, warn);
  const repository = new LocalApplicationRepository(storage);
  const session = new DemoSessionProvider(store);
  const demo = new LocalDemoData({ store, storage, clock });

  return {
    isDemoActive: new IsDemoActive({ demo }),
    startDemo: new StartDemo({ demo }),
    resetDemo: new ResetDemo({ demo }),
    exitDemo: new ExitDemo({ demo }),
    searchApplications: new SearchApplications({ repository, session, clock }),
    listTags: new ListTags({ repository, session }),
  };
};
