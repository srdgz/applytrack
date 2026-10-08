import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { useSession } from "../shell/session";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";

export const AuthCallbackScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { useCases, restart } = useSession();
  const params = useLocalSearchParams<{ code?: string }>();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const result = await useCases.completeSignIn.execute({ linkCode: params.code ?? "" });
      if (result.ok) restart({ kind: "signedIn", email: result.value.email });
      else setFailed(true);
    })();
  }, [params.code, restart, useCases]);

  if (!failed) {
    return (
      <Screen centered>
        <View className="items-center gap-3" accessibilityLiveRegion="polite">
          <ActivityIndicator />
          <Text className="text-ink-muted">{t("auth.callbackTitle")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered>
      <View className="gap-4 rounded-lg border border-border bg-surface p-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
          {t("auth.callbackFailedTitle")}
        </Text>
        <Text className="text-base text-ink-muted">{t("auth.callbackFailedDescription")}</Text>
        <Button
          label={t("auth.tryAgain")}
          onPress={() => {
            router.replace("/sign-in");
          }}
        />
      </View>
    </Screen>
  );
};
