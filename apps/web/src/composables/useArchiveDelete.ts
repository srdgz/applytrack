import type { ApplicationSnapshot } from "@applytrack/core";
import type { ShallowRef } from "vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { bumpDataVersion } from "./useDataVersion";
import { useToast } from "./useToast";

export const useArchiveDelete = (application: ShallowRef<ApplicationSnapshot | null>) => {
  const { archiveApplication, unarchiveApplication, deleteApplication } = useUseCases();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();

  let archiveToast: string | undefined;
  const busy = ref(false);
  const error = ref("");

  const run = async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    busy.value = true;
    error.value = "";
    try {
      return await action();
    } catch {
      error.value = t("detail.actionError");
      toast.error(t("notify.failedTitle"), { description: error.value });
      return undefined;
    } finally {
      busy.value = false;
    }
  };

  const setArchived = async (archived: boolean): Promise<boolean> => {
    const current = application.value;
    if (!current) return false;
    const useCase = archived ? archiveApplication : unarchiveApplication;
    const result = await run(() => useCase.execute({ id: current.id }));
    if (!result) return false;
    if (!result.ok) {
      if (result.error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
      error.value = t(`errors.${result.error.code}`);
      toast.error(t("notify.failedTitle"), { description: error.value });
      return false;
    }
    application.value = result.value;
    bumpDataVersion();
    if (archived) {
      archiveToast = toast.action(t("notify.archivedTitle"), {
        description: t("notify.archivedDescription"),
        icon: "archive",
        action: {
          label: t("notify.undo"),
          onPress: () => {
            void setArchived(false);
          },
        },
      });
    } else {
      if (archiveToast !== undefined) toast.dismiss(archiveToast);
      archiveToast = undefined;
      toast.success(t("notify.unarchivedTitle"));
    }
    return true;
  };

  const remove = async (): Promise<boolean> => {
    const current = application.value;
    if (!current) return false;
    const result = await run(() => deleteApplication.execute({ id: current.id }));
    if (!result) return false;
    if (!result.ok) {
      if (result.error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
      error.value = t(`errors.${result.error.code}`);
      toast.error(t("notify.failedTitle"), { description: error.value });
      return false;
    }
    bumpDataVersion();
    toast.success(t("notify.deletedTitle"), { description: current.company, icon: "trash" });
    await router.replace({ name: "board" });
    return true;
  };

  return {
    busy,
    error,
    archive: () => setArchived(true),
    unarchive: () => setArchived(false),
    remove,
  };
};
