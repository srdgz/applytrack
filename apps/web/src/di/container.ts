import type { KeyValueStore, Warn } from "@applytrack/adapter-local";
import {
  DemoSessionProvider,
  DemoStorage,
  LocalApplicationRepository,
  LocalDemoData,
  SystemClock,
  UuidGenerator,
} from "@applytrack/adapter-local";
import type { Clock, IdGenerator } from "@applytrack/core";
import {
  ChangeApplicationStatus,
  CreateApplication,
  ExitDemo,
  GetApplication,
  GetDashboardStats,
  IsDemoActive,
  ListTags,
  ResetDemo,
  SearchApplications,
  StartDemo,
  UpdateApplicationDetails,
  ValidateApplicationDraft,
} from "@applytrack/core";

import type { UseCases } from "./use-cases";

export interface ContainerOptions {
  readonly store: KeyValueStore;
  readonly warn?: Warn;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export const createContainer = ({
  store,
  warn,
  clock = new SystemClock(),
  ids = new UuidGenerator(() => crypto.randomUUID()),
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
    getApplication: new GetApplication({ repository, session }),
    getDashboardStats: new GetDashboardStats({ repository, session, clock }),
    createApplication: new CreateApplication({ repository, session, clock, ids }),
    updateApplicationDetails: new UpdateApplicationDetails({ repository, session, clock }),
    changeApplicationStatus: new ChangeApplicationStatus({ repository, session, clock }),
    validateApplicationDraft: new ValidateApplicationDraft({ clock }),
    today: () => clock.today(),
  };
};
