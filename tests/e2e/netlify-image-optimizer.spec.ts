import { expect, test, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * The two images that once had to bypass the image optimizer.
 *
 * SUPERSEDED CONTRACT. This file used to assert that the brand logo and the AOM
 * cover were served as DIRECT asset URLs - `unoptimized` - because a spell of
 * unstable Netlify image derivatives was rendering them broken. That workaround
 * long outlived its cause and became the single most expensive thing on the
 * site: the 5000x5000 logo master shipped whole (1,331,304 bytes) to fill a
 * 128px chip, and the 2400x3600 AOM cover (481,538 bytes) to fill a 200px
 * still - a 19-53x and 5.9-9.8x oversample respectively.
 *
 * The optimizer is verified working, so the bypass is gone. What this file
 * protects now is BOTH halves of the outcome:
 *
 *   1. the original protection - these two images must actually render, and
 *      must never answer 5xx. That is the real bug the old test was guarding.
 *   2. the new one - they must go THROUGH the optimizer at a sane width, so the
 *      bypass cannot quietly return and nobody has to rediscover the 1.3 MB
 *      logo by measuring it.
 */

const AOM_COVER = "aom-cover";
/** the first production plate in the What We Make dossier */
const PLATE = "aom-film-still";
const BRAND_LOGO = "8th-state-logo.png";

/** Every request touching either asset, plus any server error on them. */
function collectImageRequests(page: Page) {
  const requests: string[] = [];
  const failed: string[] = [];
  const match = (url: string) =>
    (url.includes(AOM_COVER) || url.includes(PLATE) || url.includes(BRAND_LOGO)) &&
    !url.includes("logo-mark");

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

test("the brand logo and AOM cover render through the optimizer, not as raw masters", async ({
  page,
}) => {
  const seen = collectImageRequests(page);
  await gotoRoute(page, "/");

  // The AOM COVER used to be the worked-example still on a What We Make row.
  // The approved dossier prints its own production plates instead, and outside
  // this section the archive shows each project's HERO rather than its cover -
  // so on the homepage the cover now renders only inside the nav preview, which
  // the second test in this file already follows. The claim being made here -
  // a large master reaches the page through the optimizer, at a width that
  // matches its render, never as a raw file - is asked of the plate that took
  // its place in that composition.
  await page.locator(".dao-wwm").scrollIntoViewIfNeeded();
  await expectLoaded(page, `img[src*="${PLATE}"]`);

  // the logo is the chip on the closing production card
  await page.locator(".dao-contact").scrollIntoViewIfNeeded();
  await expectLoaded(page, `img[src*="${BRAND_LOGO}"]`);

  // 1. both now go through the optimizer
  expect(
    seen.requests.some((u) => u.includes("/_next/image") && u.includes(PLATE)),
    "the production plate should be optimized",
  ).toBe(true);
  expect(
    seen.requests.some((u) => u.includes("/_next/image") && u.includes("8th-state-logo")),
    "the brand logo should be optimized",
  ).toBe(true);

  // 2. and the raw masters are never fetched directly again
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

  const plateWidths = widthsOf(seen.requests, "/media/aom-film-still.jpg");
  expect(plateWidths.length).toBeGreaterThan(0);
  expect(
    Math.max(...plateWidths),
    `the production plate renders at most 230px wide; requested w=${plateWidths.join(",")}`,
  ).toBeLessThanOrEqual(640);

  expect(seen.failed, "neither asset may error").toEqual([]);
});

test("the burger preview loads the AOM cover through the optimizer", async ({ page }) => {
  const seen = collectImageRequests(page);
  await gotoRoute(page, "/");

  await page.mouse.move(600, 400);
  await page.locator(".dao-burger").click();
  await page.getByLabel("Primary").getByRole("link", { name: "WORK", exact: true }).hover();
  await expectLoaded(page, `.dao-nav__preview img[src*="${AOM_COVER}"]`);

  expect(
    seen.requests.some((u) => u.includes("/_next/image") && u.includes("aom-cover")),
    "the preview should be optimized",
  ).toBe(true);
  // the preview box is 300px wide (dao.css), so nothing near the master
  const widths = widthsOf(seen.requests, "/media/aom-cover.jpg");
  expect(Math.max(...widths), `requested w=${widths.join(",")}`).toBeLessThanOrEqual(640);
  expect(seen.failed).toEqual([]);
});
