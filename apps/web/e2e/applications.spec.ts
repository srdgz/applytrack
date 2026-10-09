import {
  columnCounts,
  expect,
  expectToast,
  isNarrow,
  openApplication,
  startDemo,
  test,
} from "./support";

test.describe("Candidaturas", () => {
  test.beforeEach(async ({ page }) => {
    await startDemo(page);
  });

  test("crear con los obligatorios la añade a «Me interesa»", async ({ page }, testInfo) => {
    await page.goto("/applications/new");

    await page.getByRole("textbox", { name: /^Empresa/ }).fill("Acme");
    await page.getByRole("textbox", { name: /^Puesto/ }).fill("Frontend Developer");
    await page.getByRole("combobox", { name: /^Fuente/ }).selectOption({ label: "LinkedIn" });
    await page.getByRole("combobox", { name: /^Modalidad/ }).selectOption({ label: "Remoto" });
    await page.getByRole("button", { name: "Guardar" }).click();

    await expectToast(page, "Candidatura guardada");
    await page.goto("/board");
    await expect.poll(async () => (await columnCounts(page, testInfo))[0]).toBe("Me interesa 3");
  });

  test("«Aplicada» rellena la fecha y guardar con errores marca los campos", async ({ page }) => {
    await page.goto("/applications/new");

    await page.getByRole("radio", { name: "Aplicada" }).check();
    await expect(page.getByLabel("Fecha de candidatura")).toHaveValue("2026-10-05");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("textbox", { name: /^Empresa/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByRole("textbox", { name: /^Empresa/ })).toBeFocused();
    await expect(page).toHaveURL(/\/applications\/new$/);
  });

  test("solo ofrece los estados permitidos y el cambio con nota llega al historial", async ({
    page,
  }) => {
    await openApplication(page, "Nimbus Labs");
    await page.getByRole("button", { name: "Cambiar estado" }).click();

    const options = page.getByRole("group", { name: "Nuevo estado" }).getByRole("radio");
    await expect(options).toHaveCount(2);
    await expect(page.getByRole("radio", { name: "Oferta" })).toHaveCount(0);

    await page.getByRole("radio", { name: "Aplicada" }).check();
    await page.getByLabel("Nota (opcional)").fill("Enviado el CV");
    await page.getByRole("button", { name: "Guardar cambio" }).click();

    const history = page.getByRole("region", { name: "Historial" });
    await expect(history.getByText("De «Me interesa» a «Aplicada»")).toBeVisible();
    await expect(history.getByText("Enviado el CV")).toBeVisible();
  });

  test("el menú «Mover a…» del tablero cambia la columna", async ({ page }, testInfo) => {
    await page.goto("/board");

    await page.getByRole("button", { name: "Mover Nimbus Labs a…" }).click();
    await page.getByRole("menuitem", { name: "Aplicada" }).click();

    await expectToast(page, "Nimbus Labs pasa a «Aplicada».");
    await expect
      .poll(async () => (await columnCounts(page, testInfo)).slice(0, 2))
      .toEqual(["Me interesa 1", "Aplicada 4"]);
    test.skip(isNarrow(testInfo), "En 360 solo se ve una columna cada vez");
  });

  test("archivar saca del tablero y desarchivar la devuelve", async ({ page }, testInfo) => {
    await openApplication(page, "Nimbus Labs");

    await page.getByRole("button", { name: "Archivar" }).click();
    await expect(page.getByText(/Esta candidatura está archivada/)).toBeVisible();
    await page.goto("/board");
    await expect.poll(async () => (await columnCounts(page, testInfo))[0]).toBe("Me interesa 1");

    await openApplication(page, "Quokka Studio");
    await page.goto("/list?archived=only");
    await page
      .getByRole("link", { name: /^Nimbus Labs(,|$)/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Desarchivar" }).click();
    await page.goto("/board");
    await expect.poll(async () => (await columnCounts(page, testInfo))[0]).toBe("Me interesa 2");
  });

  test("eliminar pide confirmación y cancelar no borra nada", async ({ page }) => {
    await openApplication(page, "Nimbus Labs");

    await page.getByRole("button", { name: "Eliminar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar la candidatura de Nimbus Labs?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Nimbus Labs" })).toBeVisible();

    await page.getByRole("button", { name: "Eliminar" }).click();
    await dialog.getByRole("button", { name: "Eliminar definitivamente" }).click();

    await expect(page).toHaveURL(/\/board$/);
    await expectToast(page, "Candidatura eliminada");
    await expect(page.getByRole("link", { name: /^Nimbus Labs(,|$)/ })).toHaveCount(0);
  });
});
