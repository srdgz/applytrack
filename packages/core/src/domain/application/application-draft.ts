export interface SalaryDraft {
  min?: number | undefined;
  max?: number | undefined;
  currency?: string | undefined;
}

export interface ApplicationDetailsDraft {
  company: string;
  position: string;
  source: string;
  workMode: string;
  jobUrl?: string | undefined;
  location?: string | undefined;
  salary?: SalaryDraft | undefined;
  appliedAt?: string | undefined;
  tags?: readonly string[] | undefined;
  notes?: string | undefined;
}

export interface ApplicationDraft extends ApplicationDetailsDraft {
  status: string;
}
