import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Screen } from "../ui/Screen";

export const ComingSoonScreen = ({ titleKey }: { readonly titleKey: string }) => {
  const { t } = useTranslation();

  return (
    <Screen edges={["left", "right"]}>
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
