import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * DIRECT FRAGMENT ENTRY - a shared #anchor URL lands where it says.
 *
 * The Studio Ident takes every hard load to the top by design, and that landed
 * on top of the browser's own fragment scroll: `/services#photography` opened
 * from a link, a bookmark or a search result arrived at the top of the
 * catalogue. In-app navigation was never affected, and is guarded here too so
 * the fix cannot regress it.
 *
 * The assertions are made against the anchor's OWN `scroll-margin-top` rather
 * than a hardcoded pixel, so they describe the contract ("the anchor clears the
 * fixed chrome") rather than a number that would have to be edited whenever the
 * chrome changes height.
 */

/**
 * How close to its own scroll-margin offset the anchor has to come to rest.
 *
 * Not tighter, on purpose. Several capability anchors sit inside a block that
 * carries the entrance micro-shift (`.dao-fade` starts 14px low and resolves to
 * none), so the element's box moves by that much as its section reveals - after
 * the landing has already let go. Chasing those last pixels would mean holding
 * the scroll open across the whole entrance and then nudging the page under a
 * reader who is already looking at it, which is worse than resting 14px out on
 * a journey of nearly three thousand.
 *
 * 24px still fails loudly for the defect this file exists to catch: a fragment
 * that does not land is hundreds of pixels away, not tens.
 */
const TOLERANCE = 24;

type Placement = {
  /** how far the anchor sits from where its scroll-margin says it should */
  off: number;
  top: number;
  margin: number;
  scrollY: number;
  exists: boolean;
};

async function placement(page: Page, id: string): Promise<Placement> {
  return page.evaluate((anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return { off: NaN, top: NaN, margin: NaN, scrollY: -1, exists: false };
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const top = el.getBoundingClientRect().top;
    return {
      off: Math.round(top - margin),
      top: Math.round(top),
      margin: Math.round(margin),
      scrollY: Math.round(window.scrollY),
      exists: true,
    };
  }, id);
}

/**
 * Wait for the anchor to come to rest.
 *
 * The placement re-checks itself while fonts swap and images size, so this
 * polls for the settled result rather than sampling one frame of the settling.
 */
async function settled(page: Page, id: string): Promise<Placement> {
  await expect
    .poll(async () => Math.abs((await placement(page, id)).off), {
      timeout: 15000,
      message: `#${id} never reached its scroll-margin offset`,
    })
    .toBeLessThanOrEqual(TOLERANCE);
  return placement(page, id);
}

/** A hard load, with the ident skipped the way a visitor skips it. */
async function hardLoad(page: Page, url: string) {
  await page.goto(url);
  await page
    .locator(".dao-ident")
    .waitFor({ state: "hidden", timeout: 12000 })
    .catch(() => {});
}

test.describe("direct fragment entry into the Services catalogue", () => {
  test("EN: a hard load of /services#photography lands on Photography", async ({ page }) => {
    await hardLoad(page, "/services#photography");
    const p = await settled(page, "photography");
    expect(p.exists).toBe(true);
    // it actually travelled - the top of the catalogue is not the answer
    expect(p.scrollY, "the page never left the top").toBeGreaterThan(200);
    // and it stops where the anchor's own scroll-margin puts it, clear of the
    // fixed chrome rather than under it
    expect(p.top).toBeGreaterThan(0);
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
  });

  test("KA: the same URL under the Georgian prefix", async ({ page }) => {
    await hardLoad(page, "/ka/services#photography");
    const p = await settled(page, "photography");
    expect(p.scrollY).toBeGreaterThan(200);
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe("ka");
  });

  test("every capability the dossier links to is reachable by direct load", async ({ page }) => {
    // the four rows that carry a capability anchor - the fifth routes to the
    // catalogue itself and has no fragment to land on
    for (const id of [
      "film-video-production",
      "production-design",
      "photography",
      "creative-direction",
    ]) {
      await hardLoad(page, `/services#${id}`);
      const p = await settled(page, id);
      expect(p.exists, `#${id} is missing`).toBe(true);
      expect(Math.abs(p.off), `#${id} did not land`).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test("KA: the deepest capability, under the Georgian prefix", async ({ page }) => {
    // the anchor furthest down the catalogue is the one the old implementation
    // missed, so it is asserted in both languages rather than only in English
    await hardLoad(page, "/ka/services#creative-direction");
    const p = await settled(page, "creative-direction");
    expect(p.scrollY).toBeGreaterThan(200);
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe("ka");
  });

  test("KA: every capability the dossier links to", async ({ page }) => {
    for (const id of [
      "film-video-production",
      "production-design",
      "photography",
      "creative-direction",
    ]) {
      await hardLoad(page, `/ka/services#${id}`);
      const p = await settled(page, id);
      expect(p.exists, `#${id} is missing on /ka`).toBe(true);
      expect(Math.abs(p.off), `#${id} did not land on /ka`).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test("no hash means the ordinary top of the page", async ({ page }) => {
    await hardLoad(page, "/services");
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThanOrEqual(4);
  });

  test("a hash that names nothing changes nothing", async ({ page }) => {
    await hardLoad(page, "/services#not-a-capability");
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThanOrEqual(4);
  });

  test("the reader can take the page back at any point", async ({ page }) => {
    await page.goto("/services#photography");
    await page
      .locator(".dao-ident")
      .waitFor({ state: "hidden", timeout: 12000 })
      .catch(() => {});

    // scroll the way a reader does, mid-entry
    await page.mouse.wheel(0, 400);

    // a wheel scroll is animated by the browser, so wait for the READER's own
    // scroll to come to rest before asking whether anything else moves it
    const rest = async () => {
      let last = -1;
      for (let i = 0; i < 40; i += 1) {
        await page.waitForTimeout(100);
        const y = await page.evaluate(() => Math.round(window.scrollY));
        if (y === last) return y;
        last = y;
      }
      return last;
    };
    const taken = await rest();

    await page.waitForTimeout(2000);
    const after = await page.evaluate(() => Math.round(window.scrollY));
    expect(after, "the page was still being pulled after the reader scrolled").toBe(taken);
  });
});

test.describe("in-app anchor navigation is unchanged", () => {
  test("WHAT WE MAKE routes into the catalogue and lands on the capability", async ({ page }) => {
    await gotoRoute(page, "/");
    const row = page.locator(".dao-wwm__row").nth(2);
    await row.scrollIntoViewIfNeeded();
    await expect(row).toHaveAttribute("href", "/services#photography");
    await row.click();
    await page.waitForURL(/\/services#photography$/);
    const p = await settled(page, "photography");
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
  });

  test("every WHAT WE MAKE row that names a capability lands on it", async ({ page }) => {
    // All FIVE rows now name a department. The fifth used to fall back to the
    // catalogue with no anchor, because it had no capability to point at - the
    // dossier gives every department a chapter of its own, so there is nothing
    // left to fall back from. services-dossier.spec.ts owns the canonical
    // anchor set; this walks the journey and asserts the landing.
    await gotoRoute(page, "/");
    const hrefs = await page
      .locator(".dao-wwm__row")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    const anchored = hrefs.filter((h) => h.includes("#"));
    expect(anchored.length, "WHAT WE MAKE lost its department links").toBe(5);

    for (const href of anchored) {
      const id = href.split("#")[1];
      await gotoRoute(page, "/");
      const row = page.locator(`.dao-wwm__row[href="${href}"]`);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await page.waitForURL(new RegExp(`/services#${id}$`));
      const p = await settled(page, id);
      expect(Math.abs(p.off), `${href} did not land`).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test("a project's discipline link lands on its capability", async ({ page }) => {
    await gotoRoute(page, "/work/aom-summer-collection");
    const link = page.locator(".dpj__disciplinelink");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/services#[a-z-]+$/);
    const id = href!.split("#")[1];
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(new RegExp(`/services#${id}$`));
    const p = await settled(page, id);
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
  });

  test("browser Back out of a fragment is left to the browser", async ({ page }) => {
    await hardLoad(page, "/services#photography");
    await settled(page, "photography");

    // leave, then come back the way a reader does
    await page.locator(".dao-slimfoot a").first().click();
    await expect(page).toHaveURL(/\/work$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/services#photography$/);
    // no second landing is forced: whatever the browser and the router restore
    // is what stands, and nothing here keeps pulling at it
    await page.waitForTimeout(1200);
    const a = await page.evaluate(() => Math.round(window.scrollY));
    await page.waitForTimeout(800);
    const b = await page.evaluate(() => Math.round(window.scrollY));
    expect(b, "something was still moving the page after Back").toBe(a);
  });
});

test.describe("direct fragment entry on a phone", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("lands on the capability and clears the chrome", async ({ page }) => {
    await hardLoad(page, "/services#photography");
    const p = await settled(page, "photography");
    expect(p.scrollY).toBeGreaterThan(100);
    expect(p.top).toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("direct fragment entry under reduced motion", () => {
  test("still lands, and with no travel to watch", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await hardLoad(page, "/services#photography");
    const p = await settled(page, "photography");
    expect(p.scrollY).toBeGreaterThan(200);
    expect(Math.abs(p.off)).toBeLessThanOrEqual(TOLERANCE);
  });
});
