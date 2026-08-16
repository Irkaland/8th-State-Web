import { test, expect } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Final bug-fix + responsive motion pass - regression coverage for the
 * exact reported issues:
 *  A. ident replaying on internal navigation (burger used raw <a>)
 *  B. visible browser scrollbar
 *  E. KA navigation producing the branded 404 (/ka/en/... hrefs)
 *  F. wrong Studio Lab green
 *  G/H. ticker glyphs + ticker motion on mobile
 *  J. mobile contextual return controls
 *  L. white end-of-page / overscroll canvas
 */

const KA_ROUTES = [
  "/ka",
  "/ka/work",
  "/ka/work/aom-summer-collection",
  "/ka/services",
  "/ka/studio",
  "/ka/studio-lab",
  "/ka/process",
  "/ka/georgia-production",
  "/ka/contact",
  "/ka/start-a-project",
  "/ka/privacy",
];

test.describe("KA routing", () => {
  test("every KA destination resolves - never the 404 frame", async ({ page }) => {
    for (const route of KA_ROUTES) {
      await page.goto(route);
      await expect(page.locator(".d404"), `${route} rendered the 404 frame`).toHaveCount(0);
      await expect(page.locator("#main")).toBeVisible();
    }
  });

  test("KA burger navigation reaches every destination", async ({ page }) => {
    const targets = [
      "/ka/services",
      "/ka/studio",
      "/ka/studio-lab",
      "/ka/process",
      "/ka/georgia-production",
      "/ka/contact",
      "/ka/start-a-project",
    ];
    await gotoRoute(page, "/ka");
    for (const href of targets) {
      await page.mouse.move(300, 400);
      await page.locator(".dao-burger").click();
      const link = page.locator(`#dao-nav a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href.replace(/[/-]/g, "\\$&")}$`));
      await expect(page.locator(".d404")).toHaveCount(0);
    }
  });

  test("switching to Georgian from the EN site never 404s", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka$/);
    await expect(page.locator(".d404")).toHaveCount(0);
    // and no switcher link ever carries the internal /en tree in its href
    const langHrefs = await page
      .locator(".dao-lang a")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    expect(langHrefs.length).toBeGreaterThan(0);
    for (const href of langHrefs) expect(href).not.toMatch(/\/en(\/|$)/);
  });
});

test.describe("Studio Ident playback", () => {
  test("internal burger navigation is client-side and never replays the ident", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    for (const href of ["/services", "/studio", "/process"]) {
      await page.locator(".dao-burger").click();
      await page.locator(`#dao-nav a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(".dao-ident")).toHaveCount(0);
    }
  });

  test("the brand mark returns to the home showreel without the ident", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await page.mouse.move(300, 400);
    await page.getByRole("link", { name: "8th State Production" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".dao-reel")).toBeVisible();
    await expect(page.locator(".dao-ident")).toHaveCount(0);
  });
});

test.describe("Hidden scrollbar + canvas grounds", () => {
  test("the viewport scrollbar is hidden while the page still scrolls", async ({ page }) => {
    await gotoRoute(page, "/");
    const style = await page.evaluate(() => ({
      scrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth,
      scrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    }));
    expect(style.scrollbarWidth).toBe("none");
    expect(style.scrollable).toBe(true);
    await page.mouse.wheel(0, 900);
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(0);
  });

  test("the document canvas is never white (overscroll ground)", async ({ page }) => {
    // ink shell routes
    await gotoRoute(page, "/studio");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(19, 18, 16)",
    );
    // the lab room re-tints the canvas to its own olive
    await gotoRoute(page, "/studio-lab");
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    ).toBe("rgb(157, 171, 92)");
  });
});

test.describe("Studio Lab", () => {
  test("the lab room uses the approved olive #9DAB5C", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    expect(await page.locator(".dlb").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(157, 171, 92)",
    );
    // homepage lab act carries the same field
    await gotoRoute(page, "/");
    expect(
      await page.locator(".dao-lab").evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(157, 171, 92)");
  });

  test("the ticker uses the brand star separator, not the ✳ character", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const row = page.locator(".dao-lab__tickerrow").first();
    expect(await row.textContent()).not.toContain("✳");
    expect(await row.locator(".dao-lab__tickstar").count()).toBeGreaterThan(0);
  });
});

test.describe("Mobile (390)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the lab ticker animates at 390", async ({ page }) => {
    await gotoRoute(page, "/");
    const ticker = page.locator(".dao-lab__ticker").first();
    await ticker.scrollIntoViewIfNeeded();
    const row = page.locator(".dao-lab__tickerrow").first();
    expect(await row.evaluate((el) => getComputedStyle(el).animationName)).toBe("dao-ticker");
    const t1 = await row.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(500);
    const t2 = await row.evaluate((el) => getComputedStyle(el).transform);
    expect(t2).not.toBe(t1);
  });

  test("no contextual return control on mobile", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await page.mouse.move(200, 300);
    await expect(page.locator(".dao-returntab")).toBeHidden();
    await gotoRoute(page, "/work/aom-summer-collection");
    await expect(page.locator(".dao-returntab")).toBeHidden();
  });

  test("no horizontal body overflow on the lab room and KA home", async ({ page }) => {
    for (const route of ["/studio-lab", "/ka"]) {
      await gotoRoute(page, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("Desktop return control", () => {
  test("the return tab is still present on desktop", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await page.mouse.move(300, 400);
    await expect(page.locator(".dao-returntab")).toBeVisible();
  });
});
