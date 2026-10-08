import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useDemoActions } from "../shell/actions";
import { useSession } from "../shell/session";
import { AppLogo } from "../brand/AppLogo";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";

export const StartScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode, useCases } = useSession();
  const { start } = useDemoActions();
  const [starting, setStarting] = useState(false);

  if (mode !== "guest") return <Redirect href="/board" />;

  const tryDemo = async () => {
    setStarting(true);
    try {
      await start();
    } finally {
      setStarting(false);
    }
  };

  return (
    <Screen centered>
      <View className="items-center gap-4">
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <AppLogo size={72} />
        </View>
        <Text className="text-lg font-bold text-ink">{t("app.name")}</Text>
        <Text accessibilityRole="header" className="text-center text-3xl font-bold text-ink">
          {t("start.title")}
        </Text>
        <Text className="text-center text-base text-ink-muted">{t("start.description")}</Text>
      </View>

      <View className="gap-3">
        <Button
          label={starting ? t("start.starting") : t("start.tryDemo")}
          busy={starting}
          onPress={() => void tryDemo()}
        />
        <Button
          label={t("start.signIn")}
          variant="secondary"
          disabled={!useCases.accountsEnabled}
          onPress={() => {
            router.push("/sign-in");
          }}
        />
        <Text className="text-center text-sm text-ink-muted">{t("start.tryDemoHint")}</Text>
        {!useCases.accountsEnabled && (
          <Text className="text-center text-xs text-ink-muted">{t("start.signInUnavailable")}</Text>
        )}
      </View>
    </Screen>
  );
};
