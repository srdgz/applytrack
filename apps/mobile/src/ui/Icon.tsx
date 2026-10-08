import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

const paths = {
  board: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z",
  list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
  chart: "M3 3v18h18M8 16v-3M13 16V9M18 16V6",
  settings: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  chevronLeft: "m15 18-6-6 6-6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  more: "M12 5h.01M12 12h.01M12 19h.01",
} as const;

export type IconName = keyof typeof paths;

export const Icon = ({
  name,
  color,
  size = 22,
}: {
  readonly name: IconName;
  readonly color: ColorValue;
  readonly size?: number;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    accessible={false}
  >
    <Path d={paths[name]} />
  </Svg>
);
