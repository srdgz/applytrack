import { createBaseConfig } from "@applytrack/config/eslint/base";

export default [
  { ignores: ["*.config.js", "jest.setup.js"] },
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
];
