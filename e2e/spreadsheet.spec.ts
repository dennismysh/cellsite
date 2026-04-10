import { test, expect } from "@playwright/test";

test.describe("cellsite spreadsheet", () => {
  test.beforeEach(async ({ request }) => {
    // Clean up any leftover cells via API
    const cells = await request.get("http://localhost:3000/api/cells");
    const body = await cells.json();
    for (const cell of body) {
      await request.delete(`http://localhost:3000/api/cells/${cell.id}`);
    }
  });

  test("renders the ribbon, grid headers, and sheet tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("セルサイト")).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Column A" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Column J" }),
    ).toBeVisible();
    await expect(page.getByText("Creative")).toBeVisible();
  });

  test("create, view, and delete a cell via the UI", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Edit" }).click();

    // Double-click the first empty position (A1)
    await page.locator('[data-row="0"][data-col="0"]').dblclick();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Title", { exact: true }).fill("GitHub");
    await page.getByLabel("Japanese subtitle").fill("コード");
    await page.getByLabel("External URL").fill("https://github.com");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("GitHub")).toBeVisible();
    await expect(page.getByText("コード")).toBeVisible();

    // Exit edit mode, click to expand
    await page.getByRole("button", { name: "Exit Edit Mode" }).click();
    await page.getByText("GitHub").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText("https://github.com"),
    ).toBeVisible();

    // Close expanded
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Re-enter edit mode and delete the cell
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByText("GitHub").dblclick();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("GitHub")).not.toBeVisible();
  });
});
