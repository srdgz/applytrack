import type { Page } from "@playwright/test";

import { expect, expectToast, startDemo, test } from "./support";

const tabTo = async (page: Page, name: RegExp, max = 60): Promise<void> => {
  for (let step = 0; step < max; step += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return "";
      const label = element.getAttribute("aria-label") ?? "";
      const id = element.id;
      const byFor = id ? (document.querySelector(`label[for="${id}"]`)?.textContent ?? "") : "";
      return `${label} ${byFor} ${element.textContent}`.replace(/\s+/g, " ").trim();
    });
    if (name.test(focused)) return;
  }
  throw new Error(`No se ha llegado con Tab a ${String(name)}`);
};

test.describe("Solo teclado", () => {
  test("crear una candidatura y moverla con el menú sin usar el ratón", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "Se comprueba en escritorio");
    await startDemo(page);
    await page.goto("/applications/new");

    await tabTo(page, /Empresa/);
    await page.keyboard.type("Teclado SL");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Accesibilidad");
    await tabTo(page, /Fuente/);
    await page.keyboard.press("ArrowDown");
    await tabTo(page, /Modalidad/);
    await page.keyboard.press("ArrowDown");
    await tabTo(page, /^Guardar$/);
    await page.keyboard.press("Enter");

    await expectToast(page, "Candidatura guardada");
    await page.goto("/board");

    await tabTo(page, /Mover Teclado SL a…/);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Enter");

    await expectToast(page, /Teclado SL pasa a «Aplicada»/);
  });
});
