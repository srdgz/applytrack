import type { ToastKind } from "@applytrack/notifications";
import { messages, resolveLocale } from "@applytrack/i18n";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import type { ToastLabels } from "./notifications/ToastProvider";
import { ToastProvider, useToast } from "./notifications/ToastProvider";

const catalog = messages[resolveLocale([Intl.DateTimeFormat().resolvedOptions().locale])];

const labels: ToastLabels = {
  close: catalog.toast.close,
  region: catalog.toast.region,
  kinds: { success: catalog.toast.success, info: catalog.toast.info, error: catalog.toast.error },
};

const samples: readonly { kind: ToastKind; message: string }[] = [
  { kind: "success", message: catalog.form.saved },
  { kind: "info", message: catalog.settings.demoDescription },
  { kind: "error", message: catalog.form.saveError },
];

const Preview = () => {
  const dark = useColorScheme() === "dark";
  const toast = useToast();

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Text style={[styles.title, dark && styles.textDark]}>{catalog.app.name}</Text>
      <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{catalog.app.tagline}</Text>
      <View style={styles.actions}>
        {samples.map(({ kind, message }) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            onPress={() => toast[kind](message)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{labels.kinds[kind]}</Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <ToastProvider labels={labels}>
      <Preview />
    </ToastProvider>
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
