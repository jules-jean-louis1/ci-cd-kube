import { expect, test } from "@playwright/test";

test("un utilisateur peut ouvrir la page CI depuis la documentation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Comprendre et construire un pipeline CI/CD" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "CI", exact: true }).click();

  await expect(page).toHaveURL(/\/ci$/);
  await expect(page.getByRole("heading", { name: "CI : valider chaque changement" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
});
