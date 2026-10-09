// @ts-check
import { createBaseConfig } from "@applytrack/config/eslint/base";
import vueI18n from "@intlify/eslint-plugin-vue-i18n";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

const project = ["./tsconfig.app.json", "./tsconfig.node.json"];
const tsconfigRootDir = import.meta.dirname;

export default defineConfig(
  { ignores: ["playwright-report/**", "test-results/**", "screenshots/**", "scripts/**"] },
  pluginVue.configs["flat/recommended"],
  createBaseConfig({ tsconfigRootDir, project }),
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project,
        tsconfigRootDir,
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    files: ["src/**/*.vue"],
    plugins: { "@intlify/vue-i18n": vueI18n },
    rules: {
      "@intlify/vue-i18n/no-raw-text": [
        "error",
        { ignorePattern: "^[\\s·—*↑↓→←•%:/()0-9+-]+$", ignoreText: ["ApplyTrack"] },
      ],
    },
  },
);
