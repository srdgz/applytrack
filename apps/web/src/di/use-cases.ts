import type {
  Account,
  ArchiveApplication,
  CalendarDate,
  ChangeApplicationStatus,
  CreateApplication,
  DeleteApplication,
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
import type { InjectionKey } from "vue";
import { inject } from "vue";

export interface UseCases {
  readonly account: Account | null;
  readonly accountsEnabled: boolean;
  readonly isDemoActive: IsDemoActive;
  readonly startDemo: StartDemo;
  readonly resetDemo: ResetDemo;
  readonly exitDemo: ExitDemo;
  readonly getCurrentAccount: GetCurrentAccount;
  readonly requestSignIn: RequestSignIn;
  readonly verifySignInCode: VerifySignInCode;
  readonly signOut: SignOut;
  readonly getPreferences: GetPreferences;
  readonly updatePreferences: UpdatePreferences;
  readonly searchApplications: SearchApplications;
  readonly listTags: ListTags;
  readonly getApplication: GetApplication;
  readonly getDashboardStats: GetDashboardStats;
  readonly createApplication: CreateApplication;
  readonly updateApplicationDetails: UpdateApplicationDetails;
  readonly changeApplicationStatus: ChangeApplicationStatus;
  readonly archiveApplication: ArchiveApplication;
  readonly unarchiveApplication: UnarchiveApplication;
  readonly deleteApplication: DeleteApplication;
  readonly validateApplicationDraft: ValidateApplicationDraft;
  readonly today: () => CalendarDate;
}

export const USE_CASES: InjectionKey<UseCases> = Symbol("UseCases");

export const useUseCases = (): UseCases => {
  const useCases = inject(USE_CASES);
  if (!useCases) throw new Error("UseCases were not provided");
  return useCases;
};
