import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

/**
 * §P0 ROUTING CONTRACT.
 *
 * A URL identifies a page. This file is the executable statement of that, and it
 * SUPERSEDES the former "Refresh contract (§02/§14)" block in regression.spec.ts,
 * which asserted the opposite: that a document load of any deep route lands on
 * the locale home.
 *
 * Nothing here sends a bypass header, because there is no longer anything to
 * bypass - every request in this file is shaped exactly like a real browser's.
 * That is the point: the whole suite used to carry `x-dao-hard-load: allow`,
 * which is precisely why the deep-route, 404 and ?person= defects shipped
 * unnoticed.
 */

const EN_ROUTES = [
  "/",
  "/studio",
  "/services",
  "/work",
  "/work/aom-summer-collection",
  "/team",
  "/process",
  "/georgia-production",
  "/contact",
  "/start-a-project",
  "/studio-lab",
  "/privacy",
] as const;

const QUERY_ROUTES = [
  "/work?category=photography",
  "/work?category=film-video",
  "/work?capability=art-direction",
  "/work?capability=production-design",
  "/work?status=in-development",
  "/team?person=production-01",
] as const;

/** The ident plays over whatever route was requested; wait for it to leave. */
async function settle(page: Page) {
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-ident"), null, {
      timeout: 20_000,
    })
    .catch(() => {});
  await expect(page.locator(".dao-ident")).toHaveCount(0, { timeout: 20_000 });
}

/** pathname + search, so a dropped query string is a visible failure. */
function urlOf(page: Page) {
  return page.evaluate(() => window.location.pathname + window.location.search);
}

test.describe("§P0 direct document load keeps the route", () => {
  for (const route of EN_ROUTES) {
    test(`EN ${route} stays on ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBe(200);
      expect(await urlOf(page), `${route} url`).toBe(route);
      await settle(page);
      // the requested route is revealed, not the homepage
      await expect(page.locator("#main")).toBeVisible();
      await expect(page.locator(".d404__frame")).toHaveCount(0);
      // still on the route after the ident has gone
      expect(await urlOf(page)).toBe(route);
    });
  }

  for (const route of EN_ROUTES) {
    const ka = route === "/" ? "/ka" : `/ka${route}`;
    test(`KA ${ka} stays on ${ka}`, async ({ page }) => {
      const response = await page.goto(ka);
      expect(response?.status(), `${ka} status`).toBe(200);
      expect(await urlOf(page), `${ka} url`).toBe(ka);
      await settle(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "ka");
      await expect(page.locator("#main")).toBeVisible();
      expect(await urlOf(page)).toBe(ka);
    });
  }
});

test.describe("§P0 query strings survive a direct load and a refresh", () => {
  for (const route of QUERY_ROUTES) {
    test(`${route} survives load + refresh`, async ({ page }) => {
      await page.goto(route);
      expect(await urlOf(page), "after load").toBe(route);
      await settle(page);
      expect(await urlOf(page), "after the ident leaves").toBe(route);

      await page.reload();
      expect(await urlOf(page), "after reload").toBe(route);
      await settle(page);
      expect(await urlOf(page), "after reload + ident").toBe(route);
    });
  }

  test("a KA query route survives too", async ({ page }) => {
    const route = "/ka/work?capability=production-design";
    await page.goto(route);
    await settle(page);
    expect(await urlOf(page)).toBe(route);
    await page.reload();
    await settle(page);
    expect(await urlOf(page)).toBe(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
  });
});

test.describe("§P0 refresh preserves pathname, locale and query", () => {
  for (const route of ["/studio", "/work/aom-summer-collection", "/ka/studio", "/ka/team"]) {
    test(`refreshing ${route} stays put`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      await page.reload();
      expect(await urlOf(page)).toBe(route);
      await settle(page);
      expect(await urlOf(page)).toBe(route);
      await expect(page.locator("#main")).toBeVisible();
    });
  }
});

test.describe("§P0 invalid routes render the real 404, never Home", () => {
  for (const route of [
    "/this-route-does-not-exist",
    "/ka/this-route-does-not-exist",
    "/work/no-such-project",
    "/studio/nope",
  ]) {
    test(`${route} is a 404`, async ({ page }) => {
      const response = await page.goto(route);
      // the status is a real 404 - not a redirect, not a 200 soft-404
      expect(response?.status(), `${route} status`).toBe(404);
      // and the URL is preserved: an invalid address must not become Home
      expect(await urlOf(page), `${route} url`).toBe(route);
      // the branded displaced-frame 404 is what the visitor actually sees
      await expect(page.locator(".d404__frame")).toHaveCount(1, { timeout: 15_000 });
      await expect(page.locator(".d404__code")).toHaveText("404");
      // and it offers a way out rather than being a dead end (IX-28)
      await expect(page.locator(".d404__links a")).not.toHaveCount(0);
    });
  }

  test("the KA 404 speaks Georgian", async ({ page }) => {
    await page.goto("/ka/this-route-does-not-exist");
    await expect(page.locator(".d404__frame")).toHaveCount(1, { timeout: 15_000 });
    const line = await page.locator(".d404__line").innerText();
    expect(line, "the 404 copy should be Georgian").toMatch(/[Ⴀ-ჿ]/);
  });

  test("a valid route never falls into the 404", async ({ page }) => {
    for (const route of EN_ROUTES) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator(".d404__frame"), route).toHaveCount(0);
    }
  });
});

test.describe("§P0 /en is canonicalised, and nothing else redirects", () => {
  test("/en/work redirects once to /work and keeps the query", async ({ page }) => {
    await page.goto("/en/work?category=photography");
    expect(await urlOf(page)).toBe("/work?category=photography");
  });

  test("no valid route answers with a redirect", async ({ page }) => {
    const redirected: string[] = [];
    page.on("response", (r) => {
      // Only real navigations, and only real redirects: a 304 on a cached
      // texture is in the 3xx range but is not a redirect, and asset traffic is
      // not what this asserts.
      if (r.request().resourceType() !== "document") return;
      const location = r.headers()["location"];
      if (r.status() >= 300 && r.status() < 400 && location) {
        redirected.push(`${new URL(r.url()).pathname} -> ${location}`);
      }
    });
    for (const route of [...EN_ROUTES, ...QUERY_ROUTES]) {
      await page.goto(route);
    }
    expect(redirected, "valid routes must resolve themselves").toEqual([]);
  });
});

test.describe("§P0 internal navigation is unchanged and never replays the ident", () => {
  test("burger navigation keeps the ident away and lands on the real route", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    for (const href of ["/services", "/studio", "/contact"]) {
      await page.mouse.move(300, 400);
      await page.locator(".dao-burger").click();
      const link = page.locator(`#dao-nav a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      // the ident is a document-load event only - never an internal navigation
      await expect(page.locator(".dao-ident")).toHaveCount(0);
    }
  });

  test("the brand mark is still a Home navigation, not a server redirect", async ({ page }) => {
    await page.goto("/studio");
    await settle(page);
    await page.mouse.move(300, 400);
    await page.locator(".dao-chrome__brand").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    await expect(page.locator(".dao-reel")).toBeVisible();
  });
});

test.describe("§P0 locale switching preserves route and query", () => {
  test("EN -> KA keeps the deep route", async ({ page }) => {
    await page.goto("/studio");
    await settle(page);
    await page.mouse.move(300, 400);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka\/studio$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
  });

  test("EN -> KA keeps an active Work filter", async ({ page }) => {
    await page.goto("/work?category=photography");
    await settle(page);
    await page.mouse.move(300, 400);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka\/work\?category=photography$/);
  });

  test("KA -> EN comes back to the same deep route", async ({ page }) => {
    await page.goto("/ka/services");
    await settle(page);
    await page.mouse.move(300, 400);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "EN" }).click();
    await expect(page).toHaveURL(/\/services$/);
  });
});

test.describe("§P0 canonical metadata describes the page, not the homepage", () => {
  const cases: [string, string][] = [
    ["/", ""],
    ["/studio", "/studio"],
    ["/services", "/services"],
    ["/team", "/team"],
    ["/work", "/work"],
    ["/work/aom-summer-collection", "/work/aom-summer-collection"],
    ["/ka/studio", "/ka/studio"],
    ["/ka/work", "/ka/work"],
  ];

  for (const [route, expectedPath] of cases) {
    test(`${route} canonicalises to itself`, async ({ page }) => {
      await page.goto(route);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute("href");
      expect(canonical, `${route} canonical`).toBeTruthy();
      const url = new URL(canonical!);
      expect(url.pathname.replace(/\/$/, ""), `${route} canonical path`).toBe(expectedPath);
      // §P0: never a dev origin on a public route
      expect(url.hostname, `${route} canonical host`).not.toBe("localhost");
    });
  }

  test("a filtered Work view does not advertise a second canonical", async ({ page }) => {
    await page.goto("/work?category=photography");
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(new URL(canonical!).pathname).toBe("/work");
    expect(new URL(canonical!).search).toBe("");
  });

  test("hreflang alternates point at this page in both locales", async ({ page }) => {
    await page.goto("/studio");
    const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) =>
      els.map((el) => ({
        lang: el.getAttribute("hreflang"),
        href: el.getAttribute("href"),
      })),
    );
    const byLang = Object.fromEntries(langs.map((l) => [l.lang, new URL(l.href!).pathname]));
    expect(byLang["en"]).toBe("/studio");
    expect(byLang["ka"]).toBe("/ka/studio");
    expect(byLang["x-default"]).toBe("/studio");
  });

  test("no page emits a localhost metadataBase", async ({ page }) => {
    for (const route of ["/", "/work", "/ka/work", "/studio", "/work/aom-summer-collection"]) {
      await page.goto(route);
      const head = await page.evaluate(() => document.head.innerHTML);
      expect(head, `${route} head`).not.toContain("localhost:3000");
    }
  });
});

test.describe("§P0 direct loads are clean", () => {
  test("no console errors on a deep direct load", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    for (const route of ["/studio", "/work", "/team?person=production-01", "/ka/services"]) {
      await page.goto(route);
      await settle(page);
    }
    expect(errors()).toEqual([]);
  });
});
