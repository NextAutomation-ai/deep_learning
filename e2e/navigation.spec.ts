import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/DeepLearn/);
  });

  test("can navigate to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("can navigate to library", async ({ page }) => {
    await page.goto("/library");
    await expect(page.locator("body")).toBeVisible();
  });
});
