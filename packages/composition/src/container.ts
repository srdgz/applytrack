import type { KeyValueStore, Warn } from "@applytrack/adapter-local";
import {
  DemoSessionProvider,
  DemoStorage,
  LocalApplicationRepository,
  LocalDemoData,
  LocalPreferencesStore,
  SystemClock,
  UuidGenerator,
} from "@applytrack/adapter-local";
import type {
  Account,
  ApplicationRepository,
  AuthGateway,
  Clock,
  IdGenerator,
  PreferencesStore,
  SessionProvider,
} from "@applytrack/core";
import {
  ArchiveApplication,
  ChangeApplicationStatus,
  CompleteSignIn,
  CreateApplication,
  DeleteApplication,
  err,
  ExitDemo,
  GetApplication,
  GetCurrentAccount,
  GetDashboardStats,
  GetPreferences,
  IsDemoActive,
  ListTags,
  RequestSignIn,
  ResetDemo,
  SearchApplications,
  SignOut,
  StartDemo,
  UnarchiveApplication,
  UpdateApplicationDetails,
  UpdatePreferences,
  ValidateApplicationDraft,
  VerifySignInCode,
} from "@applytrack/core";

import type { UseCases } from "./use-cases";

export interface AccountAdapters {
  readonly repository: ApplicationRepository;
  readonly session: SessionProvider;
  readonly profile: PreferencesStore;
}

export interface SignedInAccount {
  readonly account: Account;
  readonly adapters: AccountAdapters;
}

export interface ContainerOptions {
  readonly store: KeyValueStore;
  readonly warn?: Warn;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly auth?: AuthGateway;
  readonly signedIn?: SignedInAccount;
}

const unavailableAuth: AuthGateway = {
  currentAccount: () => Promise.resolve(null),
  requestSignIn: () => Promise.resolve(err("AUTH_UNAVAILABLE")),
  verifyCode: () => Promise.resolve(err("AUTH_UNAVAILABLE")),
  completeSignIn: () => Promise.resolve(err("AUTH_UNAVAILABLE")),
  signOut: () => Promise.resolve(),
};

export const createContainer = ({
  store,
  warn,
  clock = new SystemClock(),
  ids = new UuidGenerator(() => crypto.randomUUID()),
  auth = unavailableAuth,
  signedIn,
}: ContainerOptions): UseCases => {
  const storage = new DemoStorage(store, warn);
  const demo = new LocalDemoData({ store, storage, clock });
  const device = new LocalPreferencesStore(store);
  const repository = signedIn?.adapters.repository ?? new LocalApplicationRepository(storage);
  const session = signedIn?.adapters.session ?? new DemoSessionProvider(store);
  const preferences = { device, ...(signedIn && { profile: signedIn.adapters.profile }) };

  return {
    account: signedIn?.account ?? null,
    accountsEnabled: auth !== unavailableAuth,
    isDemoActive: new IsDemoActive({ demo }),
    startDemo: new StartDemo({ demo }),
    resetDemo: new ResetDemo({ demo }),
    exitDemo: new ExitDemo({ demo }),
    getCurrentAccount: new GetCurrentAccount({ auth }),
    requestSignIn: new RequestSignIn({ auth }),
    verifySignInCode: new VerifySignInCode({ auth }),
    completeSignIn: new CompleteSignIn({ auth }),
    signOut: new SignOut({ auth }),
    getPreferences: new GetPreferences(preferences),
    updatePreferences: new UpdatePreferences(preferences),
    searchApplications: new SearchApplications({ repository, session, clock }),
    listTags: new ListTags({ repository, session }),
    getApplication: new GetApplication({ repository, session }),
    getDashboardStats: new GetDashboardStats({ repository, session, clock }),
    createApplication: new CreateApplication({ repository, session, clock, ids }),
    updateApplicationDetails: new UpdateApplicationDetails({ repository, session, clock }),
    changeApplicationStatus: new ChangeApplicationStatus({ repository, session, clock }),
    archiveApplication: new ArchiveApplication({ repository, session }),
    unarchiveApplication: new UnarchiveApplication({ repository, session }),
    deleteApplication: new DeleteApplication({ repository, session }),
    validateApplicationDraft: new ValidateApplicationDraft({ clock }),
    today: () => clock.today(),
  };
};
