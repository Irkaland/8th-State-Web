import { expect, test, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

const AOM_COVER = "/media/aom-cover.jpg";
const BRAND_LOGO = "/assets/brand/8th-state-logo.png";

function collectImageRequests(page: Page) {
  const requests: string[] = [];
  const failed: string[] = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes(AOM_COVER) || url.includes(BRAND_LOGO)) requests.push(url);
  });
  page.on("response", (res) => {
    const url = res.url();
    if ((url.includes(AOM_COVER) || url.includes(BRAND_LOGO)) && res.status() >= 500) {
      failed.push(`${res.status()} ${url}`);
    }
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

test("affected homepage images bypass the Next optimizer and render", async ({ page }) => {
  const seen = collectImageRequests(page);
  await gotoRoute(page, "/");

  await page.locator(".dao-work").scrollIntoViewIfNeeded();
  await expectLoaded(page, `img[src="${AOM_COVER}"]`);

  await page.locator(".dao-contact").scrollIntoViewIfNeeded();
  await expectLoaded(page, `img[src="${BRAND_LOGO}"]`);

  expect(
    seen.requests.some((url) => url.includes("/_next/image") && url.includes("aom-cover")),
  ).toBe(false);
  expect(
    seen.requests.some((url) => url.includes("/_next/image") && url.includes("8th-state-logo")),
  ).toBe(false);
  expect(seen.failed).toEqual([]);
});

test("burger preview AOM image uses the direct asset URL", async ({ page }) => {
  const seen = collectImageRequests(page);
  await gotoRoute(page, "/");

  await page.mouse.move(600, 400);
  await page.locator(".dao-burger").click();
  await page.getByLabel("Primary").getByRole("link", { name: "WORK", exact: true }).hover();
  await expectLoaded(page, `.dao-nav__preview img[src="${AOM_COVER}"]`);

  expect(
    seen.requests.some((url) => url.includes("/_next/image") && url.includes("aom-cover")),
  ).toBe(false);
  expect(seen.failed).toEqual([]);
});
