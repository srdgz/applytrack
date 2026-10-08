import { COLOR_NAMES, cssVariables } from "@applytrack/design-tokens";

import tailwindConfig from "../../tailwind.config";

const config = tailwindConfig as { theme: { extend: { colors: Record<string, string> } } };

describe("colores del móvil", () => {
  it("CA-109-02 · Tailwind declara los mismos colores que design-tokens", () => {
    expect(Object.keys(config.theme.extend.colors).sort()).toEqual([...COLOR_NAMES].sort());
    expect(config.theme.extend.colors.accent).toBe("rgb(var(--color-accent) / <alpha-value>)");
  });

  it("las variables cambian entre claro y oscuro", () => {
    expect(cssVariables("light")["--color-canvas"]).not.toBe(
      cssVariables("dark")["--color-canvas"],
    );
  });
});
