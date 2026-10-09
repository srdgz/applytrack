import { createBaseConfig } from "@applytrack/config/eslint/base";
import i18next from "eslint-plugin-i18next";

export default [
  { ignores: ["*.config.js", "jest.setup.js", "scripts/**", ".maestro-output/**"] },
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ["src/**/*.tsx", "app/**/*.tsx"],
    ignores: ["src/**/*.test.tsx", "src/testing/**", "src/ui/Text.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native",
              importNames: ["Text"],
              message: "Usa Text de src/ui/Text para que el texto use Inter.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx", "app/**/*.tsx"],
    ignores: ["src/**/*.test.tsx", "src/testing/**"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-text-only",
          "jsx-components": { exclude: [] },
          words: { exclude: ["^[\\s·—*↑↓→←•%:/()0-9+-]+$"] },
        },
      ],
    },
  },
];
