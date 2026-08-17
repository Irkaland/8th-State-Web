import { test, expect, type Page, type Response } from "@playwright/test";
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
 *
 * Final navigation + refresh pass additions:
 *  M. one visible EN/KA switcher while the burger menu is open
 *  N. real document loads always re-enter at the locale home showreel
 *     (these tests drop the x-dao-hard-load bypass header the rest of the
 *     suite uses to render deep routes directly)
 *  O. reload resets scroll to the top
 *  P. brand mark resets Home to the showreel top, never replays the ident
 *  Q. studio intro orbit: white square gone, official curled serpent in
 *  R. ticker physically moves at 320
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

function collectInternalHardLoadRedirects(page: Page) {
  const redirects: string[] = [];
  page.on("response", (response: Response) => {
    const request = response.request();
    const url = new URL(response.url());
    const isNextNavigationFetch =
      url.searchParams.has("_rsc") ||
      request.headers()["rsc"] === "1" ||
      Boolean(request.headers()["next-router-state-tree"]);
    if (isNextNavigationFetch && response.status() === 307 && response.headers().location === "/") {
      redirects.push(`${url.pathname}${url.search} -> /`);
    }
  });
  return redirects;
}

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

test.describe("Production routing regression", () => {
  // Behave like a real visitor. This catches proxy redirects of Next RSC
  // navigation fetches, which the default suite bypass header intentionally skips.
  test.use({ extraHTTPHeaders: {} });

  test("Home direct links reach Work and Contact without a hard-load redirect", async ({
    page,
  }) => {
    const redirects = collectInternalHardLoadRedirects(page);
    await gotoRoute(page, "/");

    await page.locator('main a[href="/work"]').last().click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);

    await gotoRoute(page, "/");
    await page.locator('main a[href="/contact"]').last().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);

    expect(redirects).toEqual([]);
  });

  test("burger destinations route normally without a hard-load redirect", async ({ page }) => {
    const redirects = collectInternalHardLoadRedirects(page);
    const targets = [
      "/services",
      "/studio",
      "/studio-lab",
      "/process",
      "/georgia-production",
      "/contact",
      "/start-a-project",
    ];

    await gotoRoute(page, "/");
    for (const href of targets) {
      await page.mouse.move(300, 400);
      await page.locator(".dao-burger").click();
      await page.locator(`#dao-nav a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${href.replace(/[/-]/g, "\\$&")}$`));
      await expect(page.locator(".dao-ident")).toHaveCount(0);
      await expect(page.locator(".d404")).toHaveCount(0);
    }

    await page.mouse.move(300, 400);
    await page.locator(".dao-burger").click();
    await page.getByRole("button", { name: /work categories/i }).click();
    await page.locator('#dao-nav a[href="/work"]').first().click();
    await expect(page).toHaveURL(/\/work$/);

    expect(redirects).toEqual([]);
  });

  test("EN to KA internal navigation works without replaying the ident", async ({ page }) => {
    const redirects = collectInternalHardLoadRedirects(page);
    await gotoRoute(page, "/");
    await page.locator('main a[href="/contact"]').last().click();
    await expect(page).toHaveURL(/\/contact$/);
    await page.mouse.move(300, 400);
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka\/contact$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    await expect(page.locator(".d404")).toHaveCount(0);
    expect(redirects).toEqual([]);
  });

  test("hard browser refresh still re-enters Home correctly", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
    await expect(page.locator(".dao-reel")).toBeVisible();
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

  test("the brand mark resets an already-scrolled Home to the showreel top", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    await page.getByRole("link", { name: "8th State Production" }).first().click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 8_000 })
      .toBeLessThan(2);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test("switching EN → KA is client-side and never replays the ident", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await page.mouse.move(300, 400);
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka\/studio$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
  });
});

test.describe("Burger menu language switcher (§01)", () => {
  test("exactly one visible EN/KA switcher while the menu is open", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.locator(".dao-burger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // the sheet itself carries no switcher ...
    await expect(page.locator("#dao-nav .dao-lang")).toHaveCount(0);
    // ... the top-right chrome control is the single switcher of the overlay
    await expect(page.locator(".dao-chrome .dao-lang")).toHaveCount(1);
    await expect(page.locator(".dao-chrome .dao-lang")).toBeVisible();
    // ... and no other switcher (e.g. the end-credits footer one, which is
    // page content) is actually on screen while the sheet is open
    const extraOnScreen = await page.evaluate(() => {
      const langs = Array.from(document.querySelectorAll<HTMLElement>(".dao-lang"));
      return langs.filter((el) => {
        if (el.closest(".dao-chrome")) return false;
        const r = el.getBoundingClientRect();
        const inViewport =
          r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        if (!inViewport) return false;
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        // covered by the fullscreen sheet = not visible to the visitor
        return !top || !top.closest("#dao-nav");
      }).length;
    });
    expect(extraOnScreen).toBe(0);
  });

  test("the top-right switcher stays functional while the menu is open", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.locator(".dao-burger").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka$/);
    await expect(page.locator(".d404")).toHaveCount(0);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    // switching also closes the sheet
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("Refresh contract (§02/§14) - real document loads", () => {
  // Behave like a real browser: no bypass header on any request.
  test.use({ extraHTTPHeaders: {} });

  test("a document load of any deep route re-enters at the home showreel", async ({ page }) => {
    for (const [route, home] of [
      ["/studio", /\/$/],
      ["/work", /\/$/],
      ["/studio-lab", /\/$/],
      ["/ka/studio", /\/ka$/],
    ] as const) {
      await page.goto(route);
      await expect(page, `${route} did not land on its locale home`).toHaveURL(home);
      // the ident plays on the hard load ...
      await expect(page.locator(".dao-ident")).toBeVisible();
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
      // ... and hands over to the Master Showreel at the top
      await expect(page.locator(".dao-reel")).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test("reloading Home resets scroll to the showreel top", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.evaluate(() => window.scrollTo(0, 2600));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    await page.reload();
    // the ident replays on a real reload, covering the reset
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
    await expect(page.locator(".dao-reel")).toBeVisible();
  });
});

test.describe("Studio intro orbit (§08/§09)", () => {
  test("the white orbital square is gone and the official curled serpent is in", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-intro__scrap")).toHaveCount(0);
    const serpent = page.locator(".dao-intro__orbit .dao-intro__serpent");
    await expect(serpent).toHaveCount(1);
    const mask = await serpent.evaluate(
      (el) =>
        getComputedStyle(el).maskImage ||
        (getComputedStyle(el) as CSSStyleDeclaration & { webkitMaskImage?: string })
          .webkitMaskImage ||
        "",
    );
    expect(mask).toContain("serpent-mark.webp");
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

test.describe("Mobile (320)", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("the lab ticker physically moves at 320 (home + lab room)", async ({ page }) => {
    for (const route of ["/", "/studio-lab"]) {
      await gotoRoute(page, route);
      // scroll the STATIC wrapper into view - the row itself never becomes
      // "stable" for Playwright precisely because it is always moving
      const wrap = page.locator(".dao-lab__ticker, .dlb__ticker").first();
      await wrap.scrollIntoViewIfNeeded();
      const row = page.locator(".dao-lab__tickerrow").first();
      const t1 = await row.evaluate((el) => getComputedStyle(el).transform);
      await page.waitForTimeout(500);
      const t2 = await row.evaluate((el) => getComputedStyle(el).transform);
      expect(t2, `${route} ticker is frozen at 320`).not.toBe(t1);
    }
  });

  test("no horizontal body overflow at 320", async ({ page }) => {
    for (const route of ["/", "/studio-lab"]) {
      await gotoRoute(page, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows horizontally at 320`).toBeLessThanOrEqual(1);
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
