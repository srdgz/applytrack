import { expect, startDemo, test } from "./support";

test.describe("Búsqueda, filtros y lista", () => {
  test.beforeEach(async ({ page }) => {
    await startDemo(page);
  });

  test("buscar sin tildes, recargar y volver atrás conservan y deshacen la URL", async ({
    page,
  }) => {
    await page.goto("/list");
    await page.getByRole("searchbox", { name: "Buscar" }).fill("nordica");

    await expect(page).toHaveURL(/q=nordica/);
    await expect(page.getByText("Mostrando 1 de 1")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Nórdica Media(,|$)/ }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue("nordica");
    await expect(page.getByText("Mostrando 1 de 1")).toBeVisible();

    await page.goto("/list?status=offer");
    await expect(page.getByText("Mostrando 1 de 1")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/q=nordica/);
  });

  test("ordenar por empresa desde la cabecera", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-360", "En 360 la lista es de tarjetas");
    await page.goto("/list");

    await page
      .getByRole("columnheader", { name: /Empresa/ })
      .getByRole("button")
      .click();

    await expect(page).toHaveURL(/sort=company/);
    await expect(page.getByRole("row").nth(1).getByRole("link").first()).toHaveText(
      "Atlas Retail Tech",
    );
  });

  test("«Cargar más» añade las siguientes sin repetir", async ({ page }) => {
    await page.evaluate(() => {
      const key = "applytrack:demo:v1";
      const dataset = JSON.parse(localStorage.getItem(key) ?? "{}") as {
        applications: { id: string; company: string }[];
      };
      const base = dataset.applications[0];
      if (!base) return;
      for (let index = 0; index < 50; index += 1) {
        dataset.applications.push({
          ...base,
          id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
          company: `Empresa ${String(index).padStart(2, "0")}`,
        });
      }
      localStorage.setItem(key, JSON.stringify(dataset));
    });
    await page.goto("/list");

    await expect(page.getByText("Mostrando 50 de 64")).toBeVisible();
    await page.getByRole("button", { name: "Cargar más" }).click();
    await expect(page.getByText("Mostrando 64 de 64")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cargar más" })).toHaveCount(0);
  });
});
