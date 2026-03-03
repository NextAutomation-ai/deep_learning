import { test, expect } from "@playwright/test";

test.describe("Upload Zone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders upload zone with three tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /file/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /url/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /text/i })).toBeVisible();
  });

  test("can switch to URL tab", async ({ page }) => {
    await page.getByRole("button", { name: /url/i }).click();
    await expect(
      page.getByPlaceholder(/example\.com|youtube/i)
    ).toBeVisible();
  });

  test("can switch to Text tab and type", async ({ page }) => {
    await page.getByRole("button", { name: /text/i }).click();
    const textarea = page.getByPlaceholder(/paste your text/i);
    await expect(textarea).toBeVisible();
    await textarea.fill("Hello world test content");
    await expect(textarea).toHaveValue("Hello world test content");
  });
});
