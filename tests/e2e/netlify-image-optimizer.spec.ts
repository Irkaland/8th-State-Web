import { expect, test, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * The brand logo must reach the page through the image optimizer.
 *
 * HISTORY. This file first asserted that the brand logo and the AOM cover were
 * served as DIRECT asset URLs - `unoptimized` - because a spell of unstable
 * Netlify image derivatives was rendering them broken. That workaround outlived
 * its cause and became the most expensive thing on the site: the 5000x5000 logo
 * master shipped whole (1,331,304 bytes) to fill a 128px chip. The bypass was
 * removed and this file was inverted to protect the opposite outcome - that the
 * masters go THROUGH the optimizer, at a width matching their render, so the
 * bypass cannot quietly return and nobody has to rediscover a 1.3 MB logo by
 * measuring it.
 *
 * WHAT CHANGED. The photography half of that contract has no subject any more.
 * The demo imagery - Pexels editorial placeholders, per public/media - was
 * removed from the whole site: every image POSITION survives as an empty
 * editorial slot, but no photograph is served. So the AOM cover and the
 * production plate assertions are retired, not weakened: the files they
 * measured are deleted, and the burger preview they followed now holds a plate
 * rather than eight photographs.
 *
 * The logo half is untouched and still runs. It is the half that was actually
 * load-bearing - a brand asset, present on every route, and the one that was
 * shipping a megabyte - and it keeps the whole guarantee: rendered, never 5xx,
 * never a raw master, and requested at a width that matches the chip. When the
 * studio's own photography lands, the second half is worth restoring against a
 * real master.
 */

const BRAND_LOGO = "8th-state-logo.png";

/** Every request touching the logo, plus any server error on it. */
function collectImageRequests(page: Page) {
  const requests: string[] = [];
  const failed: string[] = [];
  const match = (url: string) => url.includes(BRAND_LOGO) && !url.includes("logo-mark");

  page.on("request", (req) => {
    const url = req.url();
    if (match(url)) requests.push(url);
  });
  page.on("response", (res) => {
    const url = res.url();
    if (match(url) && res.status() >= 400) failed.push(`${res.status()} ${url}`);
  });
  return { requests, failed };
}

async function expectLoaded(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page
          .locator(selector)
          .first()
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      { timeout: 10_000 },
    )
    .toBe(true);
}

/** The `w=` the optimizer was actually asked for. */
function widthsOf(requests: string[], asset: string): number[] {
  return requests
    .filter((u) => u.includes("/_next/image") && u.includes(encodeURIComponent(asset)))
    .map((u) => Number(new URL(u).searchParams.get("w")))
    .filter((n) => Number.isFinite(n) && n > 0);
}

test("the brand logo renders through the optimizer, not as a raw master", async ({ page }) => {
  const seen = collectImageRequests(page);
  await gotoRoute(page, "/");

  // the logo is the chip on the closing production card
  await page.locator(".dao-contact").scrollIntoViewIfNeeded();
  await expectLoaded(page, `img[src*="${BRAND_LOGO}"]`);

  // 1. it goes through the optimizer
  expect(
    seen.requests.some((u) => u.includes("/_next/image") && u.includes("8th-state-logo")),
    "the brand logo should be optimized",
  ).toBe(true);

  // 2. and the raw master is never fetched directly again
  expect(
    seen.requests.filter((u) => !u.includes("/_next/image")),
    "no direct request for a raw master",
  ).toEqual([]);

  // 3. at a width that matches the render, not the master
  const logoWidths = widthsOf(seen.requests, "/assets/brand/8th-state-logo.png");
  expect(logoWidths.length).toBeGreaterThan(0);
  expect(
    Math.max(...logoWidths),
    `the logo chip is at most 128px wide; requested w=${logoWidths.join(",")}`,
  ).toBeLessThanOrEqual(384);

  expect(seen.failed, "the logo may not error").toEqual([]);
});

/**
 * The nav preview is a surface now, not a gallery.
 *
 * It used to crossfade eight demo photographs, one per destination, and this
 * test measured the width the AOM cover was requested at. The photographs are
 * gone; the framed plate that travels with the hovered row is not. What is
 * asserted here is the part that still has to be true: the composition survives
 * the imagery being removed, and it serves no photograph at all.
 */
test("the burger preview keeps its plate and serves no photography", async ({ page }) => {
  const media: string[] = [];
  page.on("request", (req) => {
    const u = req.url();
    // public/media only. Next serves its font bundle from /_next/static/media,
    // which is not photography and must not be caught here.
    const direct = /\/media\/[^/]+$/.test(new URL(u).pathname) && !u.includes("/_next/static/");
    const optimized = u.includes("/_next/image") && u.includes(encodeURIComponent("/media/"));
    if ((direct || optimized) && !u.includes("showreel")) media.push(u);
  });

  await gotoRoute(page, "/");
  await page.mouse.move(600, 400);
  await page.locator(".dao-burger").click();
  await page.getByLabel("Primary").getByRole("link", { name: "WORK", exact: true }).hover();

  const plate = page.locator(".dao-nav__preview");
  await expect(plate).toHaveClass(/is-live/);
  // the panel still has its box - the composition did not collapse with the
  // photographs
  const box = await plate.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);
  expect(box?.height ?? 0).toBeGreaterThan(60);
  // and it holds the waiting mark rather than an <img>
  await expect(plate.locator(".dms")).toBeVisible();
  expect(await plate.locator("img").count()).toBe(0);

  expect(media, "the nav must request no demo photography").toEqual([]);
});
