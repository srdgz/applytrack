import type { ApplicationSnapshot, ApplicationStatus, FieldIssue } from "@applytrack/core";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { bumpDataVersion } from "./useDataVersion";
import { showToast } from "./useToast";

export type StatusChangeOutcome =
  | { readonly ok: true; readonly application: ApplicationSnapshot }
  | { readonly ok: false; readonly message: string; readonly issues: readonly FieldIssue[] };

export const useStatusChange = () => {
  const { changeApplicationStatus } = useUseCases();
  const { t } = useI18n();
  const router = useRouter();

  const statusName = (status: ApplicationStatus) => t(`status.${status}`);

  const transitionMessage = (from: ApplicationStatus, to: string) =>
    t("errors.INVALID_STATUS_TRANSITION", { from: statusName(from), to });

  const change = async (
    id: string,
    to: ApplicationStatus,
    note?: string,
  ): Promise<StatusChangeOutcome> => {
    const result = await changeApplicationStatus.execute({ id, to, note });
    if (result.ok) {
      bumpDataVersion();
      showToast(t("detail.statusChanged", { to: statusName(to) }));
      return { ok: true, application: result.value };
    }

    const { error } = result;
    if (error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
    if (error.code === "INVALID_STATUS_TRANSITION") {
      return {
        ok: false,
        message: transitionMessage(error.from, statusName(error.to)),
        issues: [],
      };
    }
    if (error.code === "VALIDATION_FAILED") {
      return { ok: false, message: t("errors.VALIDATION_FAILED"), issues: error.issues };
    }
    return { ok: false, message: t(`errors.${error.code}`), issues: [] };
  };

  return { change, statusName, transitionMessage };
};
