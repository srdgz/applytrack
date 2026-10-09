import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { preview } from "vite";

const PORT = 4174;
const DEBUG_PORT = 9223;
const RUNS = 3;
const MINIMUM = { performance: 0.9, accessibility: 0.9 };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, ".lighthouseci");
const BASE = `http://localhost:${String(PORT)}`;

const pages = [
  { name: "inicio", path: "/", demo: false },
  { name: "tablero", path: "/board", demo: true },
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

mkdirSync(OUTPUT, { recursive: true });
const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
const browser = await chromium.launch({ args: [`--remote-debugging-port=${String(DEBUG_PORT)}`] });
let failed = false;

try {
  for (const page of pages) {
    const scores = { performance: [], accessibility: [], "best-practices": [], seo: [] };

    for (let run = 0; run < RUNS; run += 1) {
      const context = await browser.newContext();
      const tab = await context.newPage();
      if (page.demo) {
        await tab.goto(`${BASE}/`);
        await tab.getByRole("button", { name: "Probar sin cuenta" }).click();
        await tab.getByRole("heading", { level: 1, name: "Tablero" }).waitFor();
      }

      const result = await lighthouse(`${BASE}${page.path}`, {
        port: DEBUG_PORT,
        output: "html",
        logLevel: "error",
        disableStorageReset: true,
        onlyCategories: Object.keys(scores),
        formFactor: "mobile",
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
        locale: "es",
      });
      if (!result) throw new Error(`Lighthouse no devolvió resultados para ${page.path}`);

      for (const category of Object.keys(scores)) {
        scores[category].push(result.lhr.categories[category]?.score ?? 0);
      }
      if (run === RUNS - 1) {
        writeFileSync(join(OUTPUT, `${page.name}.html`), String(result.report));
      }
      await context.close();
    }

    const summary = Object.fromEntries(
      Object.entries(scores).map(([category, values]) => [category, median(values)]),
    );
    console.log(
      `${page.name.padEnd(8)} ${Object.entries(summary)
        .map(([category, score]) => `${category} ${Math.round(score * 100)}`)
        .join(" · ")}`,
    );
    for (const [category, minimum] of Object.entries(MINIMUM)) {
      if (summary[category] < minimum) {
        console.error(
          `  ${category} de ${page.name} está por debajo de ${String(Math.round(minimum * 100))}.`,
        );
        failed = true;
      }
    }
  }
} finally {
  await browser.close();
  await server.close();
}

if (failed) process.exit(1);
