import type {
  Account,
  ArchiveApplication,
  CalendarDate,
  ChangeApplicationStatus,
  CompleteSignIn,
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
  readonly completeSignIn: CompleteSignIn;
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
