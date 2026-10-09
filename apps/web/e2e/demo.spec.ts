import { columnCounts, expect, startDemo, test } from "./support";

test.describe("Modo demo", () => {
  test("abre el tablero con el aviso y las 6 columnas, y «Salir» vuelve al inicio", async ({
    page,
  }, testInfo) => {
    await startDemo(page);

    await expect(
      page.getByText("Modo demo · los datos solo se guardan en este dispositivo"),
    ).toBeVisible();
    expect(await columnCounts(page, testInfo)).toEqual([
      "Me interesa 2",
      "Aplicada 3",
      "Primer contacto 2",
      "Entrevistas 2",
      "Oferta 1",
      "Cerradas 4",
    ]);

    await page
      .getByRole("region", { name: "Modo demo" })
      .getByRole("button", { name: "Salir" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Organiza tu búsqueda de empleo" }),
    ).toBeVisible();
  });
});
