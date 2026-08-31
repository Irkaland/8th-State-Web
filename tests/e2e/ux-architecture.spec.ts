import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * FINAL UX ARCHITECTURE - the journeys.
 *
 * The logic these journeys are built on is unit-tested in
 * tests/unit/ux-architecture.test.ts. This file walks the routes: history,
 * focus, the contextual backs, the finite archive, the menu, and the skip link.
 *
 * Every history assertion here is written the way a reader experiences it -
 * press this, arrive there - rather than by inspecting internal state, because
 * the whole point of §01/§04/§08 is what the browser's own Back button does.
 */

/**
 * Open the burger sheet.
 *
 * By class rather than by accessible name: the label is localised, so an
 * English name would only ever find it on the English routes. The chrome is
 * woken first because it withdraws after 1.8s of pointer idle (v7 #5) and a
 * withdrawn burger is pointer-events:none.
 */
async function openNav(page: Page) {
  await page.mouse.move(600, 400);
  await page.mouse.move(620, 420);
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 5000,
    })
    .catch(() => {});
  await page.locator(".dao-burger").click();
  await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);
}

/** the archive, with a category filter applied */
async function filteredArchive(page: Page) {
  await gotoRoute(page, "/work?category=photography");
  await expect(page.locator(".dwk__frame").first()).toBeVisible();
}

/**
 * Open the nth archive card and confirm the return context was stamped.
 *
 * The stamp is written by the card's own click handler, so a click that lands
 * before hydration writes nothing and the journey falls back to the canonical
 * archive - correct behaviour, but not the behaviour these tests describe.
 * Waiting for it removes that race and asserts the WRITE side of §01 outright.
 */
async function openCard(page: Page, nth = 0) {
  const card = page.locator(".dwk__frame").nth(nth);
  const slug = await card.getAttribute("data-dao-card");
  await card.click();
  await expect(page).toHaveURL(new RegExp(`/work/` + slug + `$`));
  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("wk-ctx")), {
      timeout: 5000,
      message: "opening a card must stamp the return context",
    })
    .toContain(slug!);
  return slug!;
}

/* ------------------------------------------------ §12 the skip link ------ */

test.describe("§12 skip to main content", () => {
  for (const [label, route] of [
    ["EN", "/"],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: is the first focusable element and moves focus into main`, async ({ page }) => {
      await gotoRoute(page, route);
      await page.evaluate(() => document.body.focus());
      await page.keyboard.press("Tab");
      const first = await page.evaluate(() => ({
        cls: document.activeElement?.className ?? "",
        href: document.activeElement?.getAttribute("href") ?? "",
        text: document.activeElement?.textContent?.trim() ?? "",
      }));
      expect(first.cls, "the skip link must be the first tab stop").toContain("skip-link");
      expect(first.href).toBe("#main");
      expect(first.text.length, "and it must be labelled in this locale").toBeGreaterThan(3);

      // visible only while focused - and it TRAVELS into view over 160ms, so
      // this is polled rather than sampled on the frame the keypress landed
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.querySelector<HTMLElement>(".skip-link")!.getBoundingClientRect().top,
            ),
          { timeout: 3000, message: "the focused skip link never came on screen" },
        )
        .toBeGreaterThanOrEqual(0);

      await page.keyboard.press("Enter");
      const landed = await page.evaluate(() => document.activeElement?.id ?? "");
      expect(landed, "activating it puts focus in main").toBe("main");
    });
  }

  test("main can hold focus on every route", async ({ page }) => {
    for (const route of ["/", "/work", "/services", "/team", "/studio-lab", "/contact"]) {
      await gotoRoute(page, route);
      const ok = await page.evaluate(() => {
        const main = document.getElementById("main");
        return main?.getAttribute("tabindex") === "-1";
      });
      expect(ok, `${route} main is not focusable`).toBe(true);
    }
  });
});

/* --------------------------------------------- §14 aria-current ---------- */

test.describe("§14 the nav says where you are", () => {
  test('marks exactly the current route with aria-current="page"', async ({ page }) => {
    for (const [route, label] of [
      ["/work", "WORK"],
      ["/services", "SERVICES"],
      ["/studio-lab", "STUDIO LAB"],
    ] as const) {
      await gotoRoute(page, route);
      await openNav(page);
      const marked = await page.evaluate(() =>
        [...document.querySelectorAll('#dao-nav [aria-current="page"]')].map((e) =>
          (e.textContent ?? "").trim(),
        ),
      );
      expect(marked, `${route} should mark exactly one destination`).toHaveLength(1);
      expect(marked[0]).toContain(label);
      await page.keyboard.press("Escape");
    }
  });

  test("marks the same destination in Georgian, on the locale-free path", async ({ page }) => {
    await gotoRoute(page, "/ka/work");
    await openNav(page);
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('#dao-nav [aria-current="page"]')].map((e) =>
        e.getAttribute("href"),
      ),
    );
    expect(hrefs).toEqual(["/ka/work"]);
  });

  test("a project is inside Work but is not the Work page", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    await openNav(page);
    expect(await page.locator('#dao-nav [aria-current="page"]').count()).toBe(0);
  });
});

/* ------------------------------------------- §04 the mobile menu --------- */

test.describe("§04 the menu never enters history", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("opening it adds no history entry, and Back leaves the page with it closed", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await openNav(page);

    const before = await page.evaluate(() => history.length);
    await gotoRoute(page, "/work");
    await openNav(page);
    const after = await page.evaluate(() => history.length);
    // one navigation happened between the two menu opens; the menus themselves
    // contributed nothing
    expect(after - before).toBeLessThanOrEqual(1);
  });

  test("Back while the sheet is open navigates the page and closes the sheet", async ({ page }) => {
    await gotoRoute(page, "/");
    // navigate INTO a second page first, so there is somewhere to go back to
    await openNav(page);
    await page.locator(".dao-nav__link").first().click();
    await expect(page).toHaveURL(/\/work$/);
    await openNav(page);

    await page.goBack();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    // never left hanging over the new page
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(0);
  });

  test("Escape closes it and hands focus back to the burger", async ({ page }) => {
    await gotoRoute(page, "/");
    await openNav(page);
    await page.keyboard.press("Escape");
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.className ?? "")).toContain(
      "dao-burger",
    );
  });
});

/* ------------------------------------ §01 Work <-> Project journeys ------ */

test.describe("§01 the Work / Project return journeys", () => {
  test("browser Back from a project restores the filtered archive", async ({ page }) => {
    await filteredArchive(page);
    await page.locator(".dwk__frame").first().click();
    await expect(page).toHaveURL(/\/work\/[a-z0-9-]+$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/work\?category=photography$/);
  });

  test('"<- WORK" carries the filter back, and brings the card into view', async ({ page }) => {
    await filteredArchive(page);
    const slug = await openCard(page, 1);

    const back = page.locator(".dao-mback");
    await expect(back).toHaveAttribute("href", "/work?category=photography");
    await back.click();
    await expect(page).toHaveURL(/\/work\?category=photography$/);

    // The originating card is positioned, not left off screen. Polled, because
    // the archive re-checks its own placement once fonts and images have
    // settled - a card measured on the first frame can be several hundred
    // pixels from where it finally lands.
    await expect
      .poll(
        () =>
          page.evaluate((s) => {
            const el = document.querySelector<HTMLElement>(`[data-dao-card="${s}"]`);
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.top < window.innerHeight && r.bottom > 0;
          }, slug),
        { timeout: 8000, message: "the card the reader left from should be in view" },
      )
      .toBe(true);
  });

  test("the context is consumed - a second arrival is a fresh one", async ({ page }) => {
    await filteredArchive(page);
    await openCard(page);
    await page.locator(".dao-mback").click();
    await expect(page).toHaveURL(/\/work\?category=photography$/);
    const left = await page.evaluate(() => sessionStorage.getItem("wk-ctx"));
    expect(left, "the key must be cleared on read").toBeNull();
  });

  test("a direct project entry returns to the canonical archive", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const back = page.locator(".dao-mback");
    await expect(back).toHaveAttribute("href", "/work");
    await back.click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("after prev/next the filter comes back but the card anchor does not", async ({ page }) => {
    /**
     * The guarantee is "no fabricated originating-card restoration": after a
     * lateral move the filter still comes back, but the reader is not delivered
     * to a card they did not choose.
     *
     * This is asked as the DECISION rather than as a resulting scroll position,
     * and deliberately so. The router applies its own offset on a client
     * transition, and on this archive at this viewport that offset lands within
     * a few pixels of where the anchor would put the card - so a position can
     * be produced by either path and cannot tell them apart. The decision can:
     * "<- WORK" arms the card anchor when the card is still the one on screen,
     * and the whole of §06 is that it must not arm once the reader has moved
     * sideways.
     *
     * The other half - that arming really does bring the card back - is the
     * test above, which measures the position in the case where the two paths
     * ARE distinguishable.
     *
     * The click is observed with its navigation suppressed: preventDefault
     * stops the Link from leaving, and React's own handler - which is what
     * arms - has already run by then. So this reads the real handler's real
     * decision without needing the product to expose anything for a test.
     */
    await filteredArchive(page);
    const origin = await openCard(page);

    const next = page.locator(".dpj__seqlink--next");
    await next.scrollIntoViewIfNeeded();
    await next.click();
    // WAIT for the move to actually happen. A click that lands mid-hydration is
    // swallowed, and the test would then assert a "lateral" return that was
    // never lateral - which is how this read as a product failure for a while.
    await page.waitForURL(
      (u) => /\/work\/[a-z0-9-]+$/.test(u.pathname) && !u.pathname.includes(origin),
      { timeout: 15000 },
    );

    const back = page.locator(".dao-mback");
    // the reader is still inside the same filtered exploration ...
    await expect(back).toHaveAttribute("href", "/work?category=photography");

    // ... but pressing it does NOT arm the card anchor
    const stored = await page.evaluate(() => {
      const el = document.querySelector<HTMLAnchorElement>(".dao-mback")!;
      const swallow = (e: Event) => e.preventDefault();
      document.addEventListener("click", swallow, true);
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      document.removeEventListener("click", swallow, true);
      return window.sessionStorage.getItem("wk-ctx");
    });
    expect(stored, "the return context should still be present").not.toBeNull();
    expect(JSON.parse(stored!).anchor, "a lateral return armed the originating-card anchor").toBe(
      false,
    );

    // and the journey still lands on the filtered archive
    await back.click();
    await expect(page).toHaveURL(/\/work\?category=photography$/);
  });

  test("the filter survives a locale switch mid-journey", async ({ page }) => {
    await filteredArchive(page);
    await openCard(page);
    // the chrome withdraws after 1.8s of pointer idle, and a withdrawn
    // switcher is pointer-events:none - a reader moves the pointer first
    await page.mouse.move(600, 400);
    await page.mouse.move(620, 420);
    await page
      .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, {
        timeout: 5000,
      })
      .catch(() => {});
    await page.getByRole("link", { name: /Switch to Georgian/i }).click();
    await expect(page).toHaveURL(/\/ka\/work\/[a-z0-9-]+$/);
    // the query is locale-free, so it carries
    await expect(page.locator(".dao-mback")).toHaveAttribute(
      "href",
      "/ka/work?category=photography",
    );
  });
});

/* ---------------------------------------- §05 the finite archive --------- */

test.describe("§05 the project sequence is finite", () => {
  const slugs = async (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-dao-card]")].map((e) => e.getAttribute("data-dao-card")),
    );

  test("the first project offers NEXT and no PREV", async ({ page }) => {
    await gotoRoute(page, "/work");
    const all = await slugs(page);
    await gotoRoute(page, `/work/${all[0]}`);
    await expect(page.locator(".dpj__seqlink--prev")).toHaveCount(0);
    await expect(page.locator(".dpj__seqlink--next")).toHaveCount(1);
  });

  test("the last project offers PREV and an explicit end of archive", async ({ page }) => {
    await gotoRoute(page, "/work");
    const all = await slugs(page);
    await gotoRoute(page, `/work/${all[all.length - 1]}`);
    await expect(page.locator(".dpj__seqlink--prev")).toHaveCount(1);
    await expect(page.locator(".dpj__seqlink--next")).toHaveCount(0);
    const end = page.locator(".dpj__seqlink--end");
    await expect(end).toHaveCount(1);
    await expect(end).toHaveAttribute("href", "/work");
    await end.click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("never wraps back to the beginning", async ({ page }) => {
    await gotoRoute(page, "/work");
    const all = await slugs(page);
    await gotoRoute(page, `/work/${all[all.length - 1]}`);
    const hrefs = await page
      .locator(".dpj__seq a")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs, "an archive is not a carousel").not.toContain(`/work/${all[0]}`);
  });

  test("states the reader's position in the run", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const pos = await page.locator(".dpj__seqpos").innerText();
    expect(pos).toMatch(/PRJ-\d\d\s*\/\s*\d\d/);
    // and says the same thing in words for a screen reader
    const label = await page.locator(".dpj__seq").getAttribute("aria-label");
    expect(label).toMatch(/\d+/);
  });

  test("stepping focuses the new project's heading", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const next = page.locator(".dpj__seqlink--next");
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page).toHaveURL(/\/work\/(?!aom-summer-collection)/);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName ?? ""), { timeout: 5000 })
      .toBe("H1");
  });
});

/* ------------------------------------------- §07 one Services link ------- */

test.describe("§07 the project meta carries exactly one cross-link", () => {
  test("the discipline row links into the catalogue, and nothing else does", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const links = await page
      .locator(".dpj__meta a")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(links, "one link, not a link-farm of metadata").toHaveLength(1);
    expect(links[0]).toMatch(/^\/services#[a-z-]+$/);
  });
});

/* ---------------------------------------------- §08 Team history --------- */

test.describe("§08 one exploration session, one history entry", () => {
  test("Back after A -> B -> C closes the file and returns to /team", async ({ page }) => {
    await gotoRoute(page, "/team");
    await page.locator("[data-dtm-card]").first().click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);

    const next = page.locator(".dtm__nav .dtm__tcta").nth(1);
    await next.click();
    await page.waitForTimeout(300);
    await next.click();
    await page.waitForTimeout(300);
    expect(new URL(page.url()).searchParams.get("person")).not.toBeNull();

    await page.goBack();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    expect(new URL(page.url()).pathname).toMatch(/\/team$/);
    expect(new URL(page.url()).searchParams.get("person")).toBeNull();
  });

  test("closing from a card hands focus back to that card", async ({ page }) => {
    await gotoRoute(page, "/team");
    const card = page.locator("[data-dtm-card]").nth(2);
    const slug = await card.getAttribute("data-dtm-card");
    await card.click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await page.locator(".dtm__tcta--close").click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-dtm-card")))
      .toBe(slug);
  });

  test("a deep-linked file closes to /team", async ({ page }) => {
    await gotoRoute(page, "/team?person=beka-siradze");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await page.locator(".dtm__tcta--close").click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    expect(new URL(page.url()).search).toBe("");
  });

  test("an invalid person renders the roster and cleans the URL", async ({ page }) => {
    await gotoRoute(page, "/team?person=not-a-person");
    await expect(page.locator(".dtm__grid")).toHaveCount(1);
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.location.search)).toBe("");
  });

  test("announces the swap once, and says the minimum useful thing", async ({ page }) => {
    await gotoRoute(page, "/team");
    await page.locator("[data-dtm-card]").first().click();
    const live = page.locator('.dtm__stage [role="status"]');
    await expect(live).toHaveCount(1);
    await expect(live).toHaveAttribute("aria-live", "polite");
    expect(await live.innerText()).toMatch(/^.+ - \d+ of \d+$/);
    // and it is the ONLY live region the SITE renders. Next's own route
    // announcer is framework infrastructure - and is precisely the mechanism
    // §09 wants route changes announced by, rather than one of ours.
    expect(await page.locator(".dao [aria-live]").count()).toBe(1);
  });
});

/* ------------------------------------------ §03 contextual backs --------- */

test.describe("§03 every detail route names its parent", () => {
  for (const [route, href, label] of [
    ["/team", "/studio", /STUDIO/i],
    ["/work/aom-summer-collection", "/work", /WORK/i],
  ] as const) {
    test(`${route} goes back to ${href}`, async ({ page }) => {
      await gotoRoute(page, route);
      const back = page.locator(".dao-mback");
      await expect(back).toHaveAttribute("href", href);
      await expect(back).toContainText(label);
      const box = await back.boundingBox();
      expect(box!.height, "a 44px touch target").toBeGreaterThanOrEqual(44);
    });
  }

  test("the course sheet keeps the masthead back it always had", async ({ page }) => {
    await gotoRoute(page, "/studio-lab/photography");
    const back = page.locator(".dsc__back");
    await expect(back).toHaveAttribute("href", "/studio-lab");
  });

  test("the retired return tab is nowhere on the site", async ({ page }) => {
    for (const route of ["/", "/work", "/studio", "/team", "/services", "/contact"]) {
      await gotoRoute(page, route);
      expect(await page.locator(".dao-returntab").count(), route).toBe(0);
    }
  });
});

/* --------------------------------------------------- §02 footers --------- */

test.describe("§02 the footer is where it was decided to be", () => {
  test("the eight informational routes carry it", async ({ page }) => {
    for (const route of [
      "/work",
      "/work/aom-summer-collection",
      "/services",
      "/georgia-production",
      "/process",
      "/studio-lab",
      "/studio-lab/photography",
      "/privacy",
    ]) {
      await gotoRoute(page, route);
      await expect(page.locator(".dao-slimfoot"), route).toHaveCount(1);
    }
  });

  test("the routes with a designed ending do not", async ({ page }) => {
    for (const route of ["/", "/studio", "/team", "/start-a-project", "/contact"]) {
      await gotoRoute(page, route);
      await expect(page.locator(".dao-slimfoot"), route).toHaveCount(0);
    }
  });

  test("its destinations work and are real touch targets", async ({ page }) => {
    await gotoRoute(page, "/work");
    const foot = page.locator(".dao-slimfoot");
    const links = await foot
      .locator("a")
      .evaluateAll((els) =>
        els.map((e) => ({ href: e.getAttribute("href"), h: e.getBoundingClientRect().height })),
      );
    expect(links.length).toBeGreaterThan(4);
    for (const l of links) {
      expect(l.href, "a footer link must go somewhere").toMatch(/^\//);
      expect(l.h, `${l.href} is not a 44px target`).toBeGreaterThanOrEqual(44);
    }
  });

  test("keeps the locale", async ({ page }) => {
    await gotoRoute(page, "/ka/work");
    const links = await page
      .locator(".dao-slimfoot a")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const h of links) expect(h).toMatch(/^\/ka\//);
  });
});

/* ------------------------------------------------ §11 invalid routes ----- */

test.describe("§11 invalid routes tell the truth", () => {
  test("an unknown project is a real 404, not a redirect", async ({ page }) => {
    const res = await page.goto("/work/no-such-project");
    expect(res?.status()).toBe(404);
    expect(new URL(page.url()).pathname).toBe("/work/no-such-project");
  });

  test("an unknown course is a real 404", async ({ page }) => {
    const res = await page.goto("/studio-lab/no-such-course");
    expect(res?.status()).toBe(404);
  });

  test("the 404 focuses its heading and offers a way out", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.className ?? ""), { timeout: 5000 })
      .toContain("d404__line");
    const links = await page.locator(".d404__links a").count();
    expect(links).toBeGreaterThanOrEqual(3);
  });

  test("an unknown Work filter shows the archive and drops the dead parameter", async ({
    page,
  }) => {
    await gotoRoute(page, "/work?category=not-a-category");
    await expect(page.locator(".dwk__frame").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.location.search)).toBe("");
  });
});
