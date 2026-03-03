import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("body")).toBeVisible();
  });

  test("page contains settings content", async ({ page }) => {
    await page.goto("/dashboard/settings");
    // Settings page should have some identifiable content
    await expect(page.locator("body")).toContainText(/settings|preferences|theme/i);
  });
});
