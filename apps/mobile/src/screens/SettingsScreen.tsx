import type { ThemePreference } from "@applytrack/core";
import { THEME_PREFERENCES } from "@applytrack/core";
import { SUPPORTED_LOCALES } from "@applytrack/i18n";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useAccount, useDemoActions } from "../shell/actions";
import { usePreferences } from "../shell/preferences";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";

const Section = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <View className="gap-3 rounded-lg border border-border bg-surface p-4">
    <Text accessibilityRole="header" className="text-base font-semibold text-ink">
      {title}
    </Text>
    {children}
  </View>
);

const Choice = ({
  label,
  selected,
  role,
  onPress,
  lang,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly role: "radio";
  readonly onPress: () => void;
  readonly lang?: string;
}) => (
  <Pressable
    accessibilityRole={role}
    accessibilityState={{ checked: selected }}
    accessibilityLanguage={lang}
    onPress={onPress}
    className={`min-h-11 flex-1 items-center justify-center rounded px-3 ${
      selected ? "bg-surface" : ""
    }`}
  >
    <Text className={selected ? "font-semibold text-ink" : "text-ink-muted"}>{label}</Text>
  </Pressable>
);

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const { preferences, update } = usePreferences();
  const { account, signOut } = useAccount();
  const { reset, exit } = useDemoActions();

  return (
    <Screen edges={["left", "right"]}>
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {t("settings.title")}
      </Text>

      <Section title={t("settings.language")}>
        <View
          accessibilityRole="radiogroup"
          className="flex-row gap-1 rounded-md bg-surface-muted p-1"
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <Choice
              key={locale}
              role="radio"
              lang={locale}
              label={t(`settings.languageNames.${locale}`)}
              selected={preferences.locale === locale}
              onPress={() => void update({ locale })}
            />
          ))}
        </View>
      </Section>

      <Section title={t("settings.theme")}>
        <View
          accessibilityRole="radiogroup"
          className="flex-row gap-1 rounded-md bg-surface-muted p-1"
        >
          {THEME_PREFERENCES.map((theme: ThemePreference) => (
            <Choice
              key={theme}
              role="radio"
              label={t(`settings.themes.${theme}`)}
              selected={preferences.theme === theme}
              onPress={() => void update({ theme })}
            />
          ))}
        </View>
      </Section>

      {account ? (
        <Section title={t("settings.accountTitle")}>
          <Text className="text-sm text-ink-muted">
            {t("auth.signedInAs", { email: account.email })}
          </Text>
          <Button variant="secondary" label={t("auth.signOut")} onPress={() => void signOut()} />
        </Section>
      ) : (
        <Section title={t("settings.demoTitle")}>
          <Text className="text-sm text-ink-muted">{t("settings.demoDescription")}</Text>
          <View className="flex-row flex-wrap gap-3">
            <Button variant="secondary" label={t("demo.reset")} onPress={reset} />
            <Button variant="secondary" label={t("demo.exit")} onPress={() => void exit()} />
          </View>
        </Section>
      )}
    </Screen>
  );
};
