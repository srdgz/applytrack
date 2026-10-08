import { Pressable, Text } from "react-native";

type Variant = "primary" | "secondary" | "link";

const containers: Record<Variant, string> = {
  primary: "min-h-12 items-center justify-center rounded-md bg-accent px-6",
  secondary: "min-h-12 items-center justify-center rounded-md border border-border px-6",
  link: "min-h-11 justify-center",
};

const labels: Record<Variant, string> = {
  primary: "text-base font-semibold text-accent-ink",
  secondary: "text-base font-medium text-ink",
  link: "text-sm font-medium text-accent",
};

export const Button = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: Variant;
  readonly disabled?: boolean;
  readonly busy?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy}
    onPress={onPress}
    className={`${containers[variant]} ${disabled || busy ? "opacity-60" : "active:opacity-80"}`}
  >
    <Text className={labels[variant]}>{label}</Text>
  </Pressable>
);
