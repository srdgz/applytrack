// @ts-check
import base from "@applytrack/config/eslint/base";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default defineConfig(pluginVue.configs["flat/recommended"], base, {
  files: ["**/*.vue"],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: tseslint.parser,
      projectService: true,
      extraFileExtensions: [".vue"],
    },
  },
});
