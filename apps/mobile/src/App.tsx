import { ok } from "@applytrack/core";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

const coreStatus = ok("Núcleo conectado");

export default function App() {
  const dark = useColorScheme() === "dark";

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Text style={[styles.title, dark && styles.textDark]}>ApplyTrack</Text>
      <Text style={[styles.subtitle, dark && styles.subtitleDark]}>
        Gestor de candidaturas · móvil
      </Text>
      <Text style={styles.badge}>● {coreStatus.value}</Text>
      <StatusBar style="auto" />
    </View>
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
  subtitle: { marginTop: 8, fontSize: 16, color: "#475569" },
  subtitleDark: { color: "#94a3b8" },
  badge: {
    marginTop: 24,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    color: "#065f46",
    backgroundColor: "#d1fae5",
  },
});
