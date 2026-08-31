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

  test("the masthead back restores the archive from an essay", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page
      .getByRole("link", { name: /AOM - Summer Collection/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/work\/aom-summer-collection$/);
    await page.locator(".dao-mback").click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("the masthead back falls back to /work on a direct essay load", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    await page.locator(".dao-mback").click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("the finite sequence advances to a valid essay", async ({ page }) => {
    // SUPERSEDES "next-project tear advances to a valid essay": the wrapping
    // tear is gone, replaced by a finite PREV/NEXT with an explicit end of
    // archive. What still has to hold is that NEXT goes somewhere real.
    await gotoRoute(page, "/work/aom-summer-collection");
    const next = page.locator(".dpj__seqlink--next");
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page).toHaveURL(/\/work\/(?!aom-summer-collection).+/);
  });

  // SUPERSEDED: the Lab's filter row and LAB WORK link belonged to the
  // field-notes page the approved Studio Lab design replaces. What still has
  // to hold from this case is the ROUTE - the archive's own studio-lab
  // category - so that is what is checked now.
  test("v7: the studio-lab category is still a real archive route", async ({ page }) => {
    await gotoRoute(page, "/work?category=studio-lab");
    await expect(page).toHaveURL(/\/work\?category=studio-lab$/);
    await expect(page.locator(".dwk__title")).toBeVisible();
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
