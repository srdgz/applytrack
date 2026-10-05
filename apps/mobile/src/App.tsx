import { messages, resolveLocale } from "@applytrack/i18n";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { ToastApi, ToastLabels } from "./notifications/ToastProvider";
import { ToastProvider, useToast } from "./notifications/ToastProvider";

const catalog = messages[resolveLocale([Intl.DateTimeFormat().resolvedOptions().locale])];

const labels: ToastLabels = {
  close: catalog.toast.close,
  region: catalog.toast.region,
  kinds: {
    success: catalog.toast.success,
    info: catalog.toast.info,
    warning: catalog.toast.warning,
    error: catalog.toast.error,
    action: catalog.toast.action,
    icon: catalog.toast.icon,
    loading: catalog.toast.loading,
  },
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const samples: readonly { label: string; fire: (toast: ToastApi) => void }[] = [
  {
    label: catalog.toast.success,
    fire: (toast) => toast.success(catalog.notify.restoredTitle),
  },
  {
    label: catalog.toast.error,
    fire: (toast) =>
      toast.error(catalog.notify.failedTitle, { description: catalog.form.saveError }),
  },
  {
    label: catalog.toast.warning,
    fire: (toast) =>
      toast.warning(catalog.notify.moveBlockedTitle, {
        description: catalog.errors.INVALID_STATUS_TRANSITION.replace(
          "{from}",
          catalog.status.wishlist,
        ).replace("{to}", catalog.status.offer),
      }),
  },
  {
    label: catalog.toast.info,
    fire: (toast) =>
      toast.info(catalog.settings.demoTitle, { description: catalog.settings.demoDescription }),
  },
  {
    label: catalog.toast.action,
    fire: (toast) =>
      toast.action(catalog.notify.archivedTitle, {
        description: catalog.notify.archivedDescription,
        icon: "archive",
        action: {
          label: catalog.notify.undo,
          onPress: () => {
            toast.success(catalog.notify.unarchivedTitle);
          },
        },
      }),
  },
  {
    label: catalog.toast.icon,
    fire: (toast) =>
      toast.icon(catalog.notify.demoStartedTitle, {
        description: catalog.notify.demoStartedDescription,
        icon: "sparkles",
      }),
  },
  {
    label: catalog.toast.loading,
    fire: (toast) => {
      void toast.promise(wait(2500), {
        loading: { title: catalog.notify.restoringTitle, icon: "refresh" },
        success: { title: catalog.notify.restoredTitle },
        error: { title: catalog.notify.failedTitle },
      });
    },
  },
];

const Preview = () => {
  const dark = useColorScheme() === "dark";
  const toast = useToast();

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Text style={[styles.title, dark && styles.textDark]}>{catalog.app.name}</Text>
      <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{catalog.app.tagline}</Text>
      <View style={styles.actions}>
        {samples.map(({ label, fire }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => {
              fire(toast);
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider labels={labels}>
        <Preview />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  containerDark: { backgroundColor: "#020617" },
  title: { fontSize: 30, fontWeight: "600", color: "#0f172a" },
  textDark: { color: "#f8fafc" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#475569", textAlign: "center" },
  subtitleDark: { color: "#94a3b8" },
  actions: {
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: "#6366f1",
  },
  buttonText: { color: "#ffffff", fontWeight: "600" },
});
