const color = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

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
];

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: Object.fromEntries(names.map((name) => [name, color(name)])),
    },
  },
};
