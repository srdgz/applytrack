import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const publicDir = join(import.meta.dirname, "public");

const pngSize = (file: string) => {
  const bytes = readFileSync(join(publicDir, file));
  return `${String(bytes.readUInt32BE(16))}x${String(bytes.readUInt32BE(20))}`;
};

interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly purpose: string;
}

describe("identidad visual de la web", () => {
  it("CA-108-02 · el manifiesto declara iconos que existen con su tamaño", () => {
    const manifest = JSON.parse(readFileSync(join(publicDir, "manifest.webmanifest"), "utf8")) as {
      name: string;
      theme_color: string;
      icons: ManifestIcon[];
    };

    expect(manifest).toMatchObject({ name: "ApplyTrack", theme_color: "#4f46e5" });
    expect(manifest.icons.map(({ purpose }) => purpose)).toContain("maskable");
    for (const icon of manifest.icons) {
      expect(pngSize(icon.src.slice(1)), icon.src).toBe(icon.sizes);
    }
  });

  it("CA-108-01 · el favicon SVG tiene versión oscura y existen sus respaldos", () => {
    const favicon = readFileSync(join(publicDir, "favicon.svg"), "utf8");

    expect(favicon).toContain("prefers-color-scheme: dark");
    expect(pngSize("favicon-32.png")).toBe("32x32");
    expect(pngSize("apple-touch-icon.png")).toBe("180x180");
  });

  it("index.html enlaza los iconos y el manifiesto", () => {
    const html = readFileSync(join(import.meta.dirname, "index.html"), "utf8");

    for (const href of [
      "/favicon.svg",
      "/favicon-32.png",
      "/apple-touch-icon.png",
      "/manifest.webmanifest",
    ]) {
      expect(html).toContain(`href="${href}"`);
      expect(existsSync(join(publicDir, href.slice(1)))).toBe(true);
    }
  });
});
