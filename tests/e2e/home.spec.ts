import { test, expect } from "@playwright/test";
import { expectNoSeriousA11y, collectConsoleErrors, gotoRoute } from "./helpers";

test.describe("Homepage - One Continuous Take", () => {
  test("plays the studio ident, then hands over to the showreel", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await expect(page.locator(".dao-ident")).toContainText("8TH STATE");
    // v7 short form auto-advances (~1.8s) to the showreel beneath.
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 8_000 });
    await expect(page.getByRole("button", { name: /play reel/i })).toBeVisible();
    await page.waitForLoadState("load");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("any input skips the ident immediately", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 3_000 });
  });

  test("refinement: the ident holds its completed composition for at least 2s", async ({
    page,
  }) => {
    await page.goto("/");
    const ident = page.locator(".dao-ident");
    await expect(ident).toBeVisible();
    // official logo label prints in as part of the sequence (§02)
    await expect(page.locator(".dao-ident__logolabel img")).toHaveAttribute(
      "src",
      /8th-state-logo\.png/,
    );
    // still holding at 2.0s with no input
    await page.waitForTimeout(2_000);
    await expect(ident).toBeVisible();
    await expect(ident).toBeHidden({ timeout: 6_000 });
  });

  test("refinement: the brand mark is a home link everywhere", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.mouse.move(300, 400);
    const brand = page.getByRole("link", { name: "8th State Production" }).first();
    await expect(brand).toBeVisible();
    await brand.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".dao-reel")).toBeVisible();
  });

  test("refinement: chrome tracks the ground under it (contrast fix)", async ({ page }) => {
    // /studio: paper world at the top -> light chrome
    await gotoRoute(page, "/studio");
    await page.mouse.move(300, 400);
    await expect(page.locator(".dao-chrome")).toHaveClass(/dao-chrome--light/);

    // /services: the dark made-world band passes under the chrome line ->
    // the chrome returns to its paper variant while over it
    await gotoRoute(page, "/services");
    await page.mouse.move(300, 400);
    await expect(page.locator(".dao-chrome")).toHaveClass(/dao-chrome--light/);
    await page.locator(".dsv__g2").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.mouse.move(320, 420);
    await expect(page.locator(".dao-chrome")).not.toHaveClass(/dao-chrome--light/, {
      timeout: 4_000,
    });
  });

  test("v7: refresh on an inner route plays the ident, then stays on that route", async ({
    page,
  }) => {
    await page.goto("/services");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/services/i);
  });

  test("v7: internal navigation never replays the ident", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("dialog").getByRole("link", { name: "SERVICES" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator(".dao-ident")).toBeHidden();
  });

  test("burger navigation opens with no overflow, curtain-closes, traps focus", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // v7 #2: one intentional composition - the sheet clips its midground
    // (no scrollbars) and the last destination sits inside the viewport.
    const fit = await dialog.evaluate((el) => {
      const list = el.querySelector(".dao-nav__list")!;
      return {
        overflowStyle: getComputedStyle(el).overflowY,
        listBottom: list.getBoundingClientRect().bottom,
        viewport: window.innerHeight,
      };
    });
    expect(fit.overflowStyle).toBe("hidden");
    expect(fit.listBottom).toBeLessThanOrEqual(fit.viewport + 1);

    // v7 #3: Esc runs the curtain-up close and restores focus. (The role
    // disappears with aria-hidden the moment closing starts - assert on the
    // element itself.)
    const sheet = page.locator("#dao-nav");
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveClass(/is-closing/);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /open menu/i })).toBeFocused();

    // WORK expands the approved categories; a category navigates to /work.
    await page.getByRole("button", { name: /open menu/i }).click();
    await dialog.getByRole("button", { name: /work categories/i }).click();
    await dialog.getByRole("link", { name: "Film & Video" }).click();
    await expect(page).toHaveURL(/\/work\?category=film-video$/);
  });

  test("v7: selected work is a direction-aware keyboard carousel", async ({ page }) => {
    await gotoRoute(page, "/");
    const stage = page.locator(".dao-work__stage");
    await stage.scrollIntoViewIfNeeded();
    await stage.focus();
    await expect(page.locator("#dao-work-opt-0")).toHaveClass(/is-active/);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#dao-work-opt-1")).toHaveClass(/is-active/);
    await page.waitForTimeout(800);
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#dao-work-opt-0")).toHaveClass(/is-active/);
  });

  test("v7: selected work auto-advances at 5s and pauses on hover", async ({ page }) => {
    await gotoRoute(page, "/");
    const counter = page.locator(".dao-work__counter");
    await counter.scrollIntoViewIfNeeded();
    await page.mouse.move(10, 10); // pointer away from the act - timer runs
    await expect(counter).toContainText("01 / 05");
    await expect(counter).toContainText("02 / 05", { timeout: 8_000 });
  });

  test("v7: chrome auto-hides after idle and restores on input", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(500, 500);
    await page.waitForTimeout(2_300);
    await expect(page.locator("html")).toHaveAttribute("data-dao-idle", "");
    await page.mouse.move(520, 520);
    await expect(page.locator("html")).not.toHaveAttribute("data-dao-idle", "");
  });

  test("language switch preserves the equivalent route", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.mouse.move(300, 400);
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka\/work$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ნამუშევრები");
  });

  test("remains usable with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/");
    const statement = page.getByText("multidisciplinary production company").first();
    await statement.scrollIntoViewIfNeeded();
    await expect(statement).toBeVisible();
    await page.getByRole("link", { name: /All Work/i }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("no serious accessibility violations", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dao-reel", ".dao-chrome"]);
  });
});
