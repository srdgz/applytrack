import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { bumpDataVersion } from "./useDataVersion";

export const useDemoActions = () => {
  const { resetDemo, exitDemo } = useUseCases();
  const { t, locale } = useI18n();
  const router = useRouter();

  const reset = async (): Promise<boolean> => {
    if (!window.confirm(t("demo.resetConfirm"))) return false;
    await resetDemo.execute(locale.value);
    bumpDataVersion();
    return true;
  };

  const exit = async (): Promise<void> => {
    await exitDemo.execute();
    await router.push({ name: "start" });
  };

  return { reset, exit };
};
