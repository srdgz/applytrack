import { Pressable, Text } from "react-native";

export const Chip = ({
  label,
  selected,
  role,
  onPress,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly role: "checkbox" | "radio";
  readonly onPress: () => void;
}) => (
  <Pressable
    accessibilityRole={role}
    accessibilityState={{ checked: selected }}
    onPress={onPress}
    className={`min-h-11 justify-center rounded-full border px-4 ${
      selected ? "border-accent bg-accent-soft" : "border-border bg-surface"
    }`}
  >
    <Text className={selected ? "font-semibold text-ink" : "text-ink-muted"}>{label}</Text>
  </Pressable>
);
