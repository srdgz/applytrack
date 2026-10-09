import { COLORS } from "@applytrack/design-tokens";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useIsDark } from "../theme/theme";
import { ACCENT_SHADOW } from "./tone";

export const Fab = ({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) => {
  const dark = useIsDark();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="absolute bottom-4 right-4 size-14 items-center justify-center rounded-2xl bg-accent active:opacity-80"
      style={{ boxShadow: ACCENT_SHADOW }}
    >
      <Svg width={26} height={26} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M12 5v14M5 12h14"
          stroke={COLORS[dark ? "dark" : "light"]["accent-ink"]}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
};
