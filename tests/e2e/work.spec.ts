import { test, expect } from "@playwright/test";
import { expectNoSeriousA11y, gotoRoute } from "./helpers";

// /work - living production archive (3b) + /work/[slug] essay (3c) + v7
// return control and Lab IA.
test.describe("Work archive", () => {
  test("filter re-composes the archive and updates the URL", async ({ page }) => {
    await gotoRoute(page, "/work");
    const filters = page.getByRole("navigation", { name: /filter work/i });
    await expect(filters.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await filters.getByRole("link", { name: /Photography/ }).click();
    await expect(page).toHaveURL(/category=photography/);
    await expect(
      page
        .getByRole("navigation", { name: /filter work/i })
        .getByRole("link", { name: /Photography/ }),
    ).toHaveAttribute("aria-current", "true");
    await page.goBack();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("an archive frame opens the cinematic essay", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page
      .getByRole("link", { name: /AOM - Summer Collection/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/work\/aom-summer-collection$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AOM");
    await expect(page.getByText("CASE STUDY").first()).toBeVisible();
    await expect(page.getByText("CREDITS")).toBeVisible();
  });

  test("v7: the return tab restores the archive from an essay", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page
      .getByRole("link", { name: /AOM - Summer Collection/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/work\/aom-summer-collection$/);
    await page.mouse.move(300, 400);
    await page.locator(".dao-returntab").click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("v7: the return tab falls back to /work on a direct essay load", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    await page.mouse.move(300, 400);
    await page.locator(".dao-returntab").click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("next-project tear advances to a valid essay", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const next = page.locator(".dpj__next");
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page).toHaveURL(/\/work\/(?!aom-summer-collection).+/);
  });

  test("v7: Lab filters are three distinct states; LAB WORK stays a route", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const row = page.locator(".dlb__filterrow");
    const research = row.getByRole("button", { name: "RESEARCH" });
    const experiments = row.getByRole("button", { name: "EXPERIMENTS" });
    const education = row.getByRole("button", { name: "EDUCATION" });
    await expect(research).toHaveAttribute("aria-pressed", "true");

    await experiments.click();
    await expect(experiments).toHaveAttribute("aria-pressed", "true");
    await expect(research).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText(/LAB-03 · EXPERIMENT/i)).toBeVisible();

    await education.click();
    await expect(education).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/LAB-02 · EDUCATION/i)).toBeVisible();

    await page.getByRole("link", { name: /^LAB WORK/i }).click();
    await expect(page).toHaveURL(/\/work\?category=studio-lab$/);
  });

  test("no serious accessibility violations on archive + essay", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dwk__frame", ".dao-chrome"]);
    await gotoRoute(page, "/work/aom-summer-collection");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dpj__hero", ".dao-chrome"]);
  });
});
