import type { Page, TestInfo } from "@playwright/test";
import { expect, test as base } from "@playwright/test";

export const TODAY = new Date("2026-10-05T10:00:00+02:00");

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(TODAY);
    await use(page);
  },
});

export { expect };

export const isNarrow = (testInfo: TestInfo): boolean => testInfo.project.name === "mobile-360";

export const isWide = (testInfo: TestInfo): boolean =>
  testInfo.project.name === "desktop-1280" || testInfo.project.name === "wide-1920";

export const startDemo = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByRole("button", { name: "Probar sin cuenta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tablero" })).toBeVisible();
};

export const columnCounts = async (page: Page, testInfo: TestInfo): Promise<string[]> => {
  if (isNarrow(testInfo)) {
    return (await page.getByRole("tab").allInnerTexts()).map((text) =>
      text.replace(/\s+/g, " ").trim(),
    );
  }
  return (await page.locator("section[aria-labelledby^=column-] h2").allInnerTexts()).map((text) =>
    text.replace(/\s+/g, " ").trim(),
  );
};

export const openApplication = async (page: Page, company: string): Promise<void> => {
  await page.goto("/list");
  await page
    .getByRole("link", { name: new RegExp(`^${company}(,|$)`) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1, name: company })).toBeVisible();
};

export const hasNoHorizontalScroll = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

export const expectToast = async (page: Page, text: string | RegExp): Promise<void> => {
  await expect(page.getByRole("status").filter({ hasText: text }).first()).toBeAttached();
};
