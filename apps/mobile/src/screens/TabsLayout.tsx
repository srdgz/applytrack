import { COLORS } from "@applytrack/design-tokens";
import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDemoActions } from "../shell/actions";
import { useSession } from "../shell/session";
import { useIsDark } from "../theme/theme";
import type { IconName } from "../ui/Icon";
import { Icon } from "../ui/Icon";

const tabs: readonly { name: string; icon: IconName; label: string }[] = [
  { name: "board", icon: "board", label: "nav.board" },
  { name: "list", icon: "list", label: "nav.list" },
  { name: "stats", icon: "chart", label: "nav.stats" },
  { name: "settings", icon: "settings", label: "nav.settings" },
];

const DemoBanner = () => {
  const { t } = useTranslation();
  const { reset, exit } = useDemoActions();

  return (
    <View accessibilityLabel={t("settings.demoTitle")} className="gap-1 bg-accent-soft px-4 py-2">
      <Text className="text-center text-sm text-ink">{t("demo.banner")}</Text>
      <View className="flex-row justify-center gap-6">
        <Pressable accessibilityRole="button" onPress={reset} className="min-h-11 justify-center">
          <Text className="text-sm font-medium text-ink underline">{t("demo.reset")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void exit()}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-medium text-ink underline">{t("demo.exit")}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const TabsLayout = () => {
  const { t } = useTranslation();
  const { mode } = useSession();
  const dark = useIsDark();
  const colors = COLORS[dark ? "dark" : "light"];

  if (mode === "guest") return <Redirect href="/" />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      {mode === "demo" && <DemoBanner />}
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors["ink-muted"],
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarItemStyle: { minHeight: 48 },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: t(tab.label),
              tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color} />,
            }}
          />
        ))}
      </Tabs>
    </SafeAreaView>
  );
};
