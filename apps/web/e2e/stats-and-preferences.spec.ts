import { expect, startDemo, test } from "./support";

test.describe("Estadísticas", () => {
  test("muestran las cifras de la demo y las paradas enlazan al detalle", async ({ page }) => {
    await startDemo(page);
    await page.goto("/stats");

    await expect(page.getByText(/69\s%/).first()).toBeVisible();
    await expect(page.getByText("9 de 13").first()).toBeVisible();

    await page.getByRole("link", { name: /Lince Software/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Lince Software" })).toBeVisible();
  });
});

test.describe("Preferencias", () => {
  test("el inglés se aplica sin recargar y se mantiene al recargar", async ({ page }) => {
    await startDemo(page);
    await page.goto("/settings");

    await page.getByRole("combobox", { name: "Idioma" }).selectOption("en");

    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  test("el tema oscuro se aplica antes de pintar al recargar", async ({ page }) => {
    await startDemo(page);
    await page.goto("/settings");

    await page.getByRole("radio", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload({ waitUntil: "commit" });
    await page.waitForLoadState("domcontentloaded");
    const themeBeforeApp = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeBeforeApp).toBe("dark");
  });
});
