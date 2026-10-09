import { mkdirSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

import { expect, TODAY, test } from "./support";

const OUTPUT = join(import.meta.dirname, "..", "screenshots");
const README_OUTPUT = join(import.meta.dirname, "..", "..", "..", "docs", "screenshots");
const forReadme = process.env.README_SCREENSHOTS === "1";

const sizes = [
  { name: "360", width: 360, height: 640 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1920", width: 1920, height: 1080 },
] as const;

const locales = [
  { name: "es", locale: "es-ES", demo: "Probar sin cuenta", board: "Tablero" },
  { name: "en", locale: "en-GB", demo: "Try without an account", board: "Board" },
] as const;

const screens = [
  { name: "board", path: "/board" },
  { name: "list", path: "/list" },
  { name: "form", path: "/applications/new" },
  { name: "stats", path: "/stats" },
] as const;

const README_SHOTS = new Set([
  "board-1280-light-es",
  "list-1280-light-es",
  "form-1280-light-es",
  "stats-1280-dark-es",
]);

const settle = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test.describe.configure({ mode: "parallel" });

for (const { name: localeName, locale, demo, board } of locales) {
  for (const theme of ["light", "dark"] as const) {
    test(`capturas en ${localeName} con tema ${theme}`, async ({ browser }) => {
      mkdirSync(OUTPUT, { recursive: true });
      if (forReadme) mkdirSync(README_OUTPUT, { recursive: true });

      for (const size of sizes) {
        const context = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          colorScheme: theme,
          locale,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        await page.clock.setFixedTime(TODAY);
        await page.goto("/");
        await page.getByRole("button", { name: demo }).click();
        await expect(page.getByRole("heading", { level: 1, name: board })).toBeVisible();

        for (const screen of screens) {
          const shot = [screen.name, size.name, theme, localeName].join("-");
          if (screen.name === "stats" && !README_SHOTS.has(shot)) continue;
          await page.goto(screen.path);
          await settle(page);
          await page.screenshot({ path: join(OUTPUT, `${shot}.png`), fullPage: false });
          if (forReadme && README_SHOTS.has(shot)) {
            await page.screenshot({ path: join(README_OUTPUT, `web-${shot}.png`) });
          }
        }

        await context.close();
      }
    });
  }
}
