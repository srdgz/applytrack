import type { Toast, ToastKind, ToastQueue } from "@applytrack/notifications";
import { createToastQueue } from "@applytrack/notifications";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export interface ToastLabels {
  readonly close: string;
  readonly region: string;
  readonly kinds: Readonly<Record<ToastKind, string>>;
}

const ToastContext = createContext<ToastQueue | null>(null);

export const useToast = () => {
  const queue = useContext(ToastContext);
  if (!queue) throw new Error("ToastProvider is missing");
  return useMemo(
    () => ({
      success: (message: string) => queue.show("success", message),
      info: (message: string) => queue.show("info", message),
      error: (message: string) => queue.show("error", message),
    }),
    [queue],
  );
};

const palette = {
  light: { surface: "#ffffff", ink: "#0f172a", muted: "#475569", border: "#e2e8f0" },
  dark: { surface: "#1e293b", ink: "#f8fafc", muted: "#cbd5e1", border: "#334155" },
};

const accents: Record<ToastKind, string> = {
  success: "#16a34a",
  info: "#6366f1",
  error: "#dc2626",
};

const symbols: Record<ToastKind, string> = {
  success: "✓",
  info: "i",
  error: "!",
};

interface ToastItemProps {
  readonly toast: Toast;
  readonly queue: ToastQueue;
  readonly labels: ToastLabels;
  readonly dark: boolean;
}

const ToastItem = ({ toast, queue, labels, dark }: ToastItemProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = dark ? palette.dark : palette.light;
  const kindLabel = labels.kinds[toast.kind];

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${kindLabel}: ${toast.message}`);
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) opacity.setValue(1);
      else Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [kindLabel, opacity, toast.message]);

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        testID={`toast-${toast.kind}`}
        accessibilityRole={toast.kind === "error" ? "alert" : "text"}
        accessibilityLiveRegion={toast.kind === "error" ? "assertive" : "polite"}
        accessibilityLabel={`${kindLabel}: ${toast.message}`}
        onPressIn={() => {
          queue.pause(toast.id);
        }}
        onPressOut={() => {
          queue.resume(toast.id);
        }}
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderLeftColor: accents[toast.kind],
          },
        ]}
      >
        <Text
          style={[styles.symbol, { color: accents[toast.kind] }]}
          importantForAccessibility="no"
        >
          {symbols[toast.kind]}
        </Text>
        <Text style={[styles.message, { color: colors.ink }]}>{toast.message}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.close}
          hitSlop={8}
          onPress={() => {
            queue.dismiss(toast.id);
          }}
          style={styles.close}
        >
          <Text style={{ color: colors.muted }}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

interface ToastProviderProps {
  readonly children: ReactNode;
  readonly labels: ToastLabels;
  readonly queue?: ToastQueue;
}

export const ToastProvider = ({ children, labels, queue }: ToastProviderProps) => {
  const [instance] = useState(() => queue ?? createToastQueue());
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const dark = useColorScheme() === "dark";

  useEffect(() => instance.subscribe(setToasts), [instance]);

  return (
    <ToastContext.Provider value={instance}>
      {children}
      <View
        pointerEvents="box-none"
        style={styles.host}
        accessibilityLabel={labels.region}
        testID="toast-host"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} queue={instance} labels={labels} dark={dark} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 32,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  symbol: { fontWeight: "700", fontSize: 16, width: 16, textAlign: "center" },
  message: { flex: 1, fontSize: 15, lineHeight: 20 },
  close: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
