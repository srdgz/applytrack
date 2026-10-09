import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect, hasNoHorizontalScroll, openApplication, startDemo, test } from "./support";

const screens: readonly { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: "tablero", open: (page) => page.goto("/board").then(() => undefined) },
  { name: "lista", open: (page) => page.goto("/list").then(() => undefined) },
  { name: "detalle", open: (page) => openApplication(page, "Kraken Games") },
  { name: "formulario", open: (page) => page.goto("/applications/new").then(() => undefined) },
  { name: "estadísticas", open: (page) => page.goto("/stats").then(() => undefined) },
  { name: "ajustes", open: (page) => page.goto("/settings").then(() => undefined) },
];

const loaded = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Cargando…")).toHaveCount(0);
};

test.describe("Sin scroll horizontal", () => {
  test("inicio y «Entrar»", async ({ page }) => {
    await page.goto("/");
    await loaded(page);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    await page.goto("/sign-in");
    await loaded(page);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });

  for (const screen of screens) {
    test(screen.name, async ({ page }) => {
      await startDemo(page);
      await screen.open(page);
      await loaded(page);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });
  }
});

const axeSizes = ["mobile-360", "desktop-1280"];

const audit = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations
    .filter(({ impact }) => impact === "serious" || impact === "critical")
    .map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(" ")).join(", ")}`);
};

for (const theme of ["light", "dark"] as const) {
  test.describe(`axe en tema ${theme === "light" ? "claro" : "oscuro"}`, () => {
    test.use({ colorScheme: theme });

    test.beforeEach(({ page: _page }, testInfo) => {
      test.skip(!axeSizes.includes(testInfo.project.name), "axe se pasa a 360 y a 1280");
    });

    test("inicio y «Entrar»", async ({ page }) => {
      await page.goto("/");
      await loaded(page);
      expect(await audit(page)).toEqual([]);
      await page.goto("/sign-in");
      await loaded(page);
      expect(await audit(page)).toEqual([]);
    });

    for (const screen of screens) {
      test(screen.name, async ({ page }) => {
        await startDemo(page);
        await screen.open(page);
        await loaded(page);
        expect(await audit(page)).toEqual([]);
      });
    }
  });
}
