import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { ColorScheme } from "./colors";
import { COLOR_NAMES, COLORS, cssVariables } from "./colors";
import { oklchToHex } from "./oklch";

const webCss = readFileSync(join(import.meta.dirname, "../../../apps/web/src/style.css"), "utf8");

const webColors = (pattern: RegExp): Record<string, string> => {
  const block = pattern.exec(webCss)?.[1] ?? "";
  const entries = [...block.matchAll(/--color-([a-z-]+):\s*(oklch\([^)]*\))/g)].map(
    (match): [string, string] => [match[1] ?? "", match[2] ?? ""],
  );
  return Object.fromEntries(entries);
};

const web: Record<ColorScheme, Record<string, string>> = {
  light: webColors(/@theme \{([\s\S]*?)\n\}/),
  dark: webColors(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/),
};

const channels = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (first: string, second: string) => {
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
};

const TONES = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "closed",
] as const;

describe("design-tokens", () => {
  it.each(["light", "dark"] as const)(
    "CA-109-02 · los colores %s coinciden con los de la web",
    (scheme) => {
      expect(Object.keys(web[scheme]).sort()).toEqual([...COLOR_NAMES].sort());
      for (const name of COLOR_NAMES) {
        const fromWeb = channels(oklchToHex(web[scheme][name] ?? ""));
        const fromTokens = channels(COLORS[scheme][name]);
        fromWeb.forEach((value, index) => {
          expect(
            Math.abs(value - (fromTokens[index] ?? -10)),
            `${scheme} ${name}`,
          ).toBeLessThanOrEqual(1);
        });
      }
    },
  );

  it.each(["light", "dark"] as const)(
    "CA-116-02 · los tonos de estado %s tienen contraste suficiente",
    (scheme) => {
      const colors = COLORS[scheme];
      for (const tone of TONES) {
        const strong = colors[`status-${tone}`];
        expect(contrast(strong, colors[`status-${tone}-soft`]), tone).toBeGreaterThanOrEqual(4.5);
        expect(contrast(strong, colors.surface), tone).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it("convierte oklch a hexadecimal", () => {
    expect(oklchToHex("oklch(100% 0 0)")).toBe("#ffffff");
    expect(oklchToHex("oklch(0% 0 0)")).toBe("#000000");
    expect(() => oklchToHex("#ffffff")).toThrow();
  });

  it("expone los colores como canales RGB para las variables de NativeWind", () => {
    expect(cssVariables("light")["--color-surface"]).toBe("255 255 255");
    expect(Object.keys(cssVariables("dark"))).toHaveLength(COLOR_NAMES.length);
  });
});
