import Svg, { Circle, Path, Rect } from "react-native-svg";

export const AppLogo = ({ size = 64 }: { readonly size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
    <Rect width={64} height={64} rx={15} fill="#4f46e5" />
    <Path
      d="M18.5 16a4.5 4.5 0 0 1 4.5 4.5v23a4.5 4.5 0 0 1-9 0v-23a4.5 4.5 0 0 1 4.5-4.5z"
      fill="#ffffff"
      fillOpacity={0.55}
    />
    <Path
      d="M32 16a4.5 4.5 0 0 1 4.5 4.5v13a4.5 4.5 0 0 1-9 0v-13a4.5 4.5 0 0 1 4.5-4.5z"
      fill="#ffffff"
      fillOpacity={0.8}
    />
    <Path
      d="M45.5 16a4.5 4.5 0 0 1 4.5 4.5v4a4.5 4.5 0 0 1-9 0v-4a4.5 4.5 0 0 1 4.5-4.5z"
      fill="#ffffff"
    />
    <Circle cx={45.5} cy={44} r={6} fill="#34d399" />
    <Path
      d="M42.6 44.1l2 2 3.5-3.7"
      fill="none"
      stroke="#064e3b"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
