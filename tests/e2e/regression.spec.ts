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
 *  N. §P0: a real document load RESOLVES THE ROUTE IT ASKED FOR - the former
 *     re-enter-at-Home contract is gone. See routing-contract.spec.ts; the
 *     ident behaviour that survived it is asserted here.
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
    // seven sequential open-menu-and-navigate cycles; observed exceeding the
    // default 45s budget once under three-project parallel load, so give it the
    // slow-test allowance rather than leaving an intermittent failure
    test.slow();
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
  // §P0: every request in the suite is now shaped like a real visitor's - the
  // former `x-dao-hard-load: allow` bypass is gone along with the redirect it
  // opted out of. This block still watches for proxy redirects of Next RSC
  // navigation fetches, which must never happen.

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

  // §P0: this replaces "hard browser refresh still re-enters Home correctly",
  // which asserted that a document load of /studio lands on /. That was the
  // defect, not the contract. A refresh now keeps the reader where they were.
  test("a hard browser refresh keeps the route it was on", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.locator("#main")).toBeVisible();
    // and the Showreel is where it belongs - on Home, not on Studio
    await expect(page.locator(".dao-reel")).toHaveCount(0);
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
    // §14 REVERSES what this used to assert. The sheet closing on a locale
    // switch was the behaviour, and it was wrong: someone reading the menu in
    // English who switches to Georgian wants to go on reading that menu, not
    // to reopen it. It now stays open across the switch, still client-side and
    // still without replaying the ident (both asserted above).
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
  });
});

/**
 * §P0: the former "Refresh contract (§02/§14)" block lived here and asserted
 * that a document load of any deep route re-enters at the locale home. That
 * contract has been REPLACED - a URL now identifies a page - and its
 * replacement is tests/e2e/routing-contract.spec.ts, which covers direct loads,
 * refresh, query preservation, the 404 and canonical metadata in both locales.
 *
 * What survives from the old block is the part that was never about routing:
 * the Ident still plays on a real document load, it still resets scroll to the
 * top behind its own sheet, and it still hands over to the page beneath. Those
 * are asserted below - now on a DEEP route, which the old contract could not
 * express, because it sent every deep route Home before the assertion ran.
 */
test.describe("Ident on a real document load (§P0)", () => {
  test("the ident plays over the route that was actually requested", async ({ page }) => {
    for (const [route, expected] of [
      ["/studio", "/studio"],
      ["/work", "/work"],
      ["/studio-lab", "/studio-lab"],
      ["/ka/studio", "/ka/studio"],
    ] as const) {
      await page.goto(route);
      // the ident plays on the hard load ...
      await expect(page.locator(".dao-ident"), `${route} ident`).toBeVisible();
      // ... over the requested route, which the URL never left
      expect(
        await page.evaluate(() => window.location.pathname),
        `${route} url during the ident`,
      ).toBe(expected);
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
      // ... and reveals that route, still at the top
      await expect(page.locator("#main")).toBeVisible();
      expect(await page.evaluate(() => window.location.pathname)).toBe(expected);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test("a document load of Home still hands over to the Master Showreel", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
    await expect(page.locator(".dao-reel")).toBeVisible();
  });

  test("reloading resets scroll to the top", async ({ page }) => {
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

  test("a deep route reload keeps the route AND resets scroll", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    await page.reload();
    expect(await page.evaluate(() => window.location.pathname)).toBe("/studio");
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator(".dao-ident").waitFor({ state: "hidden", timeout: 8_000 });
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
    expect(await page.evaluate(() => window.location.pathname)).toBe("/studio");
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
    expect(await page.locator(".dsl").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(157, 171, 92)",
    );
    // homepage lab act carries the same field
    await gotoRoute(page, "/");
    expect(
      await page.locator(".dao-lab").evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(157, 171, 92)");
  });

  // SUPERSEDED: the Lab used to close on a Glacier marquee. The approved
  // design replaces it with a STATIC editorial index, so the contract is now
  // that nothing in it moves - on either surface that carries it.
  test("the closing index is a static editorial row, never a marquee", async ({ page }) => {
    for (const route of ["/studio-lab", "/"]) {
      await gotoRoute(page, route);
      const index = page.locator(".dsl-index").first();
      await expect(index).toHaveCount(1);
      const anim = await index.evaluate((el) =>
        [el, ...el.querySelectorAll("*")].map((n) => getComputedStyle(n).animationName),
      );
      expect(new Set(anim), route).toEqual(new Set(["none"]));
    }
  });
});

test.describe("Mobile (390)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // SUPERSEDED with the marquee: at 390 the index becomes the approved
  // three-column grid, and it still does not move.
  test("the lab index is a static 3-column grid at 390", async ({ page }) => {
    await gotoRoute(page, "/");
    const index = page.locator(".dsl-index").first();
    await index.scrollIntoViewIfNeeded();
    const m = await index.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, cols: cs.gridTemplateColumns.split(" ").length };
    });
    expect(m.display).toBe("grid");
    expect(m.cols).toBe(3);
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

  // SUPERSEDED with the marquee: at 320 the index still reads as six words in
  // three columns, on both surfaces, and still does not move.
  test("the lab index stays a readable 3-column grid at 320", async ({ page }) => {
    for (const route of ["/", "/studio-lab"]) {
      await gotoRoute(page, route);
      const index = page.locator(".dsl-index").first();
      await index.scrollIntoViewIfNeeded();
      const m = await index.evaluate((el) => ({
        cols: getComputedStyle(el).gridTemplateColumns.split(" ").length,
        words: el.querySelectorAll(".dsl-index__w").length,
        anim: getComputedStyle(el).animationName,
      }));
      expect(m.cols, route).toBe(3);
      expect(m.words, route).toBe(6);
      expect(m.anim, route).toBe("none");
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
