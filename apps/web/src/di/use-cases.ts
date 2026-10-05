import type {
  ArchiveApplication,
  CalendarDate,
  ChangeApplicationStatus,
  CreateApplication,
  DeleteApplication,
  ExitDemo,
  GetApplication,
  GetDashboardStats,
  IsDemoActive,
  ListTags,
  ResetDemo,
  SearchApplications,
  StartDemo,
  UnarchiveApplication,
  UpdateApplicationDetails,
  ValidateApplicationDraft,
} from "@applytrack/core";
import type { InjectionKey } from "vue";
import { inject } from "vue";

export interface UseCases {
  readonly isDemoActive: IsDemoActive;
  readonly startDemo: StartDemo;
  readonly resetDemo: ResetDemo;
  readonly exitDemo: ExitDemo;
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
