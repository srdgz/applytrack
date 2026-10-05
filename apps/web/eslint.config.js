// @ts-check
import { createBaseConfig } from "@applytrack/config/eslint/base";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

const project = ["./tsconfig.app.json", "./tsconfig.node.json"];
const tsconfigRootDir = import.meta.dirname;

export default defineConfig(
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
);
