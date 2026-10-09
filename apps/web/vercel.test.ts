import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

interface Header {
  readonly key: string;
  readonly value: string;
}

interface VercelConfig {
  readonly ignoreCommand: string;
  readonly rewrites: readonly { readonly source: string; readonly destination: string }[];
  readonly headers: readonly { readonly source: string; readonly headers: readonly Header[] }[];
}

const config = JSON.parse(
  readFileSync(join(import.meta.dirname, "vercel.json"), "utf8"),
) as VercelConfig;

const headersFor = (source: string) =>
  Object.fromEntries(
    (config.headers.find((entry) => entry.source === source)?.headers ?? []).map(
      ({ key, value }) => [key, value],
    ),
  );

describe("despliegue en Vercel", () => {
  it("CA-117-02 · cualquier ruta de la SPA devuelve index.html", () => {
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/index.html" }]);
  });

  it("CA-117-04 · los assets se guardan en caché y todas las páginas llevan cabeceras de seguridad", () => {
    expect(headersFor("/assets/(.*)")["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    expect(Object.keys(headersFor("/(.*)")).sort()).toEqual([
      "Permissions-Policy",
      "Referrer-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
    ]);
  });

  it("CA-117-05 · solo despliega si cambia la web o sus paquetes", () => {
    expect(config.ignoreCommand).toBe("npx turbo-ignore @applytrack/web");
  });
});
