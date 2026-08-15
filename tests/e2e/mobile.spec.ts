import { test, expect } from "@playwright/test";
import { expectNoSeriousA11y, gotoRoute } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Mobile - One Continuous Take", () => {
  test("burger nav opens and curtain-closes accessibly (Escape + focus restore)", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    const toggle = page.getByRole("button", { name: /open menu/i });
    await toggle.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "SERVICES" })).toBeVisible();
    // v7 #2: the sheet clips its midground - no scrollbars appear.
    const overflowStyle = await dialog.evaluate((el) => getComputedStyle(el).overflowX);
    expect(["hidden", "clip"]).toContain(overflowStyle);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("a menu link navigates and closes the menu", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /work categories/i }).click();
    await dialog.getByRole("link", { name: "Photography" }).click();
    await expect(page).toHaveURL(/\/work\?category=photography$/);
  });

  test("no horizontal overflow at 390px", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.waitForLoadState("load");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("selected work advances via touch-style drag commit (side frame)", async ({ page }) => {
    await gotoRoute(page, "/");
    const counter = page.locator(".dao-work__counter");
    await counter.scrollIntoViewIfNeeded();
    await expect(counter).toContainText("01 / 05");
    // The next-frame peek is the visible side of the same track.
    await page.locator(".dao-work__item:not(.is-active):not(.is-offstage) button").first().click({
      force: true,
    });
    await expect(counter).toContainText("02 / 05", { timeout: 5_000 });
  });

  test("no serious accessibility violations (mobile home)", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dao-reel", ".dao-chrome"]);
  });
});
