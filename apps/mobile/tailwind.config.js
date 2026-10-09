const color = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const tones = ["wishlist", "applied", "screening", "interviewing", "offer", "rejected", "closed"];

const names = [
  "canvas",
  "surface",
  "surface-muted",
  "border",
  "ink",
  "ink-muted",
  "accent",
  "accent-ink",
  "accent-soft",
  "warning",
  "warning-soft",
  "danger",
  "danger-ink",
  "success",
  ...tones.flatMap((tone) => [`status-${tone}`, `status-${tone}-soft`]),
];

const fonts = {
  ".font-normal": "Inter_400Regular",
  ".font-medium": "Inter_500Medium",
  ".font-semibold": "Inter_600SemiBold",
  ".font-bold": "Inter_700Bold",
};

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: Object.fromEntries(names.map((name) => [name, color(name)])),
      fontFamily: { sans: ["Inter_400Regular"] },
      borderRadius: { md: "10px", lg: "14px", xl: "16px" },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities(
        Object.fromEntries(
          Object.entries(fonts).map(([name, family]) => [
            name,
            { fontFamily: family, fontWeight: "400" },
          ]),
        ),
      );
    },
  ],
};
