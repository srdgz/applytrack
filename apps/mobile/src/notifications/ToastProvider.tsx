import type {
  PromiseMessages,
  Toast,
  ToastContent,
  ToastKind,
  ToastQueue,
} from "@applytrack/notifications";
import {
  createToastQueue,
  iconFor,
  TOAST_COLORS,
  TOAST_ICONS,
  TOAST_SURFACE,
} from "@applytrack/notifications";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const PILL_HEIGHT = 40;
const EXPAND_DELAY_MS = 300;
const SWIPE_DISMISS = -40;
const MAX_WIDTH = 420;

export interface ToastLabels {
  readonly close: string;
  readonly region: string;
  readonly kinds: Readonly<Record<ToastKind, string>>;
}

type Extra = Omit<ToastContent, "title">;

export interface ToastApi {
  readonly success: (title: string, extra?: Extra) => string;
  readonly info: (title: string, extra?: Extra) => string;
  readonly warning: (title: string, extra?: Extra) => string;
  readonly error: (title: string, extra?: Extra) => string;
  readonly action: (title: string, extra?: Extra) => string;
  readonly icon: (title: string, extra?: Extra) => string;
  readonly promise: <T>(task: Promise<T>, messages: PromiseMessages<T>) => Promise<T>;
  readonly dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const api = useContext(ToastContext);
  if (!api) throw new Error("ToastProvider is missing");
  return api;
};

const createApi = (queue: ToastQueue): ToastApi => {
  const kind =
    (toastKind: ToastKind) =>
    (title: string, extra: Extra = {}) =>
      queue.show(toastKind, { title, ...extra });
  return {
    success: kind("success"),
    info: kind("info"),
    warning: kind("warning"),
    error: kind("error"),
    action: kind("action"),
    icon: kind("icon"),
    promise: (task, messages) => queue.promise(task, messages),
    dismiss: (id) => {
      queue.dismiss(id);
    },
  };
};

const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;

const ToastIcon = ({ toast }: { readonly toast: Toast }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const color = TOAST_COLORS[toast.kind];
  const loading = toast.kind === "loading";

  useEffect(() => {
    if (!loading) return undefined;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [loading, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.2) }]}>
      <Animated.View style={loading ? { transform: [{ rotate }] } : undefined}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          {TOAST_ICONS[iconFor(toast)].map((d) => (
            <Path
              key={d}
              d={d}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
};

interface ToastItemProps {
  readonly toast: Toast;
  readonly queue: ToastQueue;
  readonly labels: ToastLabels;
  readonly maxWidth: number;
  readonly dark: boolean;
}

const ToastItem = ({ toast, queue, labels, maxWidth, dark }: ToastItemProps) => {
  const [opened, setOpened] = useState(false);
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const [headerWidth, setHeaderWidth] = useState(160);
  const [contentHeight, setContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const entry = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const touchStart = useRef(0);

  const color = TOAST_COLORS[toast.kind];
  const kindLabel = labels.kinds[toast.kind];
  const hasBody = Boolean(toast.description ?? toast.action);
  const expanded = hasBody && (userToggled ?? opened);
  const urgent = toast.kind === "error" || toast.kind === "warning";

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const timer = setTimeout(() => {
      setOpened(true);
    }, EXPAND_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      [`${kindLabel}: ${toast.title}`, toast.description].filter(Boolean).join(". "),
    );
  }, [kindLabel, toast.title, toast.description]);

  useEffect(() => {
    if (reduceMotion) {
      entry.setValue(1);
      return;
    }
    Animated.spring(entry, { toValue: 1, useNativeDriver: false, bounciness: 8 }).start();
  }, [entry, reduceMotion]);

  useEffect(() => {
    const toValue = expanded ? 1 : 0;
    if (reduceMotion) progress.setValue(toValue);
    else Animated.spring(progress, { toValue, useNativeDriver: false, bounciness: 6 }).start();
  }, [expanded, progress, reduceMotion]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.min(headerWidth, maxWidth), maxWidth],
  });
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [PILL_HEIGHT, PILL_HEIGHT + contentHeight],
  });

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderWidth(Math.ceil(event.nativeEvent.layout.width));
  };

  const onContentLayout = (event: LayoutChangeEvent) => {
    setContentHeight(Math.ceil(event.nativeEvent.layout.height));
  };

  return (
    <Animated.View
      testID={`toast-${toast.kind}`}
      accessibilityRole={urgent ? "alert" : "text"}
      accessibilityLiveRegion={urgent ? "assertive" : "polite"}
      accessibilityState={{ expanded }}
      onTouchStart={(event) => {
        touchStart.current = event.nativeEvent.pageY;
      }}
      onTouchMove={(event) => {
        drag.setValue(Math.min(0, event.nativeEvent.pageY - touchStart.current));
      }}
      onTouchEnd={(event) => {
        if (event.nativeEvent.pageY - touchStart.current < SWIPE_DISMISS) queue.dismiss(toast.id);
        else drag.setValue(0);
      }}
      style={{
        alignSelf: "center",
        opacity: entry,
        transform: [
          {
            translateY: Animated.add(
              drag,
              entry.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
            ),
          },
          { scale: entry.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
        ],
      }}
    >
      <Pressable
        accessibilityLabel={[`${kindLabel}: ${toast.title}`, toast.description]
          .filter(Boolean)
          .join(". ")}
        onPress={() => {
          if (hasBody) setUserToggled(!expanded);
        }}
        onPressIn={() => {
          queue.pause(toast.id);
        }}
        onPressOut={() => {
          queue.resume(toast.id);
        }}
      >
        <Animated.View style={[styles.surface, dark && styles.surfaceDark, { width, height }]}>
          <View style={styles.header} onLayout={onHeaderLayout}>
            <ToastIcon toast={toast} />
            <Text style={[styles.title, { color }]} numberOfLines={1}>
              {toast.title}
            </Text>
            {expanded ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={labels.close}
                hitSlop={8}
                onPress={() => {
                  queue.dismiss(toast.id);
                }}
                style={styles.close}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  {TOAST_ICONS.x.map((d) => (
                    <Path
                      key={d}
                      d={d}
                      stroke="#ffffff99"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  ))}
                </Svg>
              </Pressable>
            ) : null}
          </View>
          {hasBody ? (
            <Animated.View
              style={[styles.content, { opacity: progress }]}
              onLayout={onContentLayout}
              importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
            >
              {toast.description ? (
                <Text style={styles.description}>{toast.description}</Text>
              ) : null}
              {toast.action ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={toast.action.onPress}
                  style={[styles.action, { backgroundColor: withAlpha(color, 0.2) }]}
                >
                  <Text style={[styles.actionText, { color }]}>{toast.action.label}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
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
  const [hostWidth, setHostWidth] = useState(MAX_WIDTH);
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const api = useMemo(() => createApi(instance), [instance]);

  useEffect(() => instance.subscribe(setToasts), [instance]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        testID="toast-host"
        accessibilityLabel={labels.region}
        onLayout={(event) => {
          setHostWidth(Math.min(MAX_WIDTH, event.nativeEvent.layout.width));
        }}
        style={[styles.host, { top: insets.top + 8 }]}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            queue={instance}
            labels={labels}
            maxWidth={hostWidth}
            dark={dark}
          />
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
    gap: 8,
    alignItems: "center",
  },
  surface: {
    backgroundColor: TOAST_SURFACE,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  surfaceDark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ffffff40",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    height: PILL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "600", maxWidth: 260, paddingRight: 4 },
  close: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  content: {
    position: "absolute",
    top: PILL_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  description: { color: "#ffffff80", fontSize: 14, lineHeight: 20 },
  action: { minHeight: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "600" },
});
