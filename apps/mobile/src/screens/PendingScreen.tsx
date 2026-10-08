import { COLORS } from "@applytrack/design-tokens";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useIsDark } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";

export const PendingScreen = ({ titleKey }: { readonly titleKey: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const dark = useIsDark();

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          router.back();
        }}
        className="min-h-11 flex-row items-center gap-2 self-start"
      >
        <Icon name="chevronLeft" size={18} color={COLORS[dark ? "dark" : "light"]["ink-muted"]} />
        <Text className="text-sm text-ink-muted">{t("nav.back")}</Text>
      </Pressable>
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t(titleKey)}
      </Text>
      <View className="items-center gap-2 rounded-lg border border-dashed border-border p-8">
        <Text className="text-center text-lg font-semibold text-ink">
          {t("mobile.comingSoonTitle")}
        </Text>
        <Text className="text-center text-base text-ink-muted">
          {t("mobile.comingSoonDescription")}
        </Text>
      </View>
    </Screen>
  );
};
