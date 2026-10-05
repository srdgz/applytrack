import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { bumpDataVersion } from "./useDataVersion";
import { useToast } from "./useToast";

export const useDemoActions = () => {
  const { resetDemo, exitDemo } = useUseCases();
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();

  const reset = async (): Promise<boolean> => {
    if (!window.confirm(t("demo.resetConfirm"))) return false;
    try {
      await toast.promise(resetDemo.execute(locale.value), {
        loading: { title: t("notify.restoringTitle"), icon: "refresh" },
        success: { title: t("notify.restoredTitle") },
        error: { title: t("notify.failedTitle") },
      });
    } catch {
      return false;
    }
    bumpDataVersion();
    return true;
  };

  const exit = async (): Promise<void> => {
    await exitDemo.execute();
    await router.push({ name: "start" });
  };

  return { reset, exit };
};
