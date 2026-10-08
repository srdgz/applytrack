import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useToast } from "../notifications/ToastProvider";
import { useSession } from "./session";

export const useDemoActions = () => {
  const { useCases, setMode } = useSession();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const start = async (): Promise<void> => {
    await useCases.startDemo.execute(i18n.language);
    setMode("demo");
    toast.icon(t("notify.demoStartedTitle"), {
      description: t("notify.demoStartedDescription"),
      icon: "sparkles",
    });
    router.replace("/board");
  };

  const reset = (): void => {
    Alert.alert(t("demo.reset"), t("demo.resetConfirm"), [
      { text: t("mobile.cancel"), style: "cancel" },
      {
        text: t("demo.reset"),
        style: "destructive",
        onPress: () => {
          void toast
            .promise(useCases.resetDemo.execute(i18n.language), {
              loading: { title: t("notify.restoringTitle"), icon: "refresh" },
              success: { title: t("notify.restoredTitle") },
              error: { title: t("notify.failedTitle") },
            })
            .catch(() => undefined);
        },
      },
    ]);
  };

  const exit = async (): Promise<void> => {
    await useCases.exitDemo.execute();
    setMode("guest");
    router.replace("/");
  };

  return { start, reset, exit };
};

export const useAccount = () => {
  const { useCases, restart } = useSession();
  const signOut = async (): Promise<void> => {
    await useCases.signOut.execute();
    restart({ kind: "signedOut" });
  };

  return { account: useCases.account, signOut };
};
