import { expect, test, type Page } from "@playwright/test";

/**
 * §P0 TEAM ?person= DEEP LINKS.
 *
 * The Team sheet always contained a complete deep-link path, and none of it
 * could ever run for a real visitor: the proxy redirected a document load of
 * /team to the locale home AND cleared the query string, so a shared or
 * bookmarked profile link arrived at the homepage with nothing to open. The
 * feature was only reachable under the test bypass header.
 *
 * Two client-side defects went with it, both fixed here:
 *   - the slug was interpolated into a CSS selector, so ?person="] threw inside
 *     an animation frame instead of being treated as an unknown person;
 *   - the profile opens BEHIND the Studio Ident on a hard load, and any keypress
 *     skips the ident - so an Escape pressed to get past the intro also closed
 *     the profile the visitor had followed a link to reach.
 */

async function settle(page: Page) {
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-ident"), null, {
      timeout: 20_000,
    })
    .catch(() => {});
  await expect(page.locator(".dao-ident")).toHaveCount(0, { timeout: 20_000 });
}

const person = (page: Page) =>
  page.evaluate(() => new URL(window.location.href).searchParams.get("person"));

for (const [label, base] of [
  ["EN", ""],
  ["KA", "/ka"],
] as const) {
  test.describe(`§P0 Team deep link - ${label}`, () => {
    const route = `${base}/team?person=beka-siradze`;

    test(`${label}: a hard load opens the right profile and keeps the URL`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      // the query is not stripped on the way in
      expect(await person(page)).toBe("beka-siradze");
      await settle(page);
      // the profile is open once the ident has left the stage
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await expect(page.locator(".dtm__breadcrumb")).toContainText(/DIRECTION|რეჟისურა/i);
      expect(await person(page)).toBe("beka-siradze");
      expect(new URL(page.url()).pathname).toBe(`${base}/team`);
    });

    test(`${label}: the profile survives a refresh`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);

      await page.reload();
      expect(await person(page), "query dropped by the reload").toBe("beka-siradze");
      await settle(page);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await expect(page.locator(".dtm__breadcrumb")).toContainText(/DIRECTION|რეჟისურა/i);
    });

    test(`${label}: skipping the ident with Escape does NOT close the profile`, async ({
      page,
    }) => {
      await page.goto(route);
      // press Escape while the ident is still holding the stage - the exact
      // gesture a visitor uses to get past the intro
      await page.keyboard.press("Escape").catch(() => {});
      await settle(page);
      await expect(
        page.locator(".dtm__dossier"),
        "Escape during the ident closed the deep-linked profile",
      ).toHaveCount(1);
      expect(await person(page)).toBe("beka-siradze");
    });

    test(`${label}: Escape closes the profile once the ident has gone`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.locator(".dtm__dossier")).toHaveCount(0);
      // a deep link has no history entry of ours to pop, so the query is
      // replaced rather than popped - and the route is kept
      expect(await person(page)).toBeNull();
      expect(new URL(page.url()).pathname).toBe(`${base}/team`);
    });

    test(`${label}: browser Back closes a profile opened from the roster`, async ({ page }) => {
      await page.goto(`${base}/team`);
      await settle(page);
      await page.locator("[data-dtm-card]").first().click();
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      const opened = await person(page);
      expect(opened).toBeTruthy();

      await page.goBack();
      await expect(page.locator(".dtm__dossier")).toHaveCount(0);
      expect(await person(page)).toBeNull();
      expect(new URL(page.url()).pathname).toBe(`${base}/team`);
    });

    test(`${label}: an unknown person id is a safe state, not a crash or a redirect`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      const response = await page.goto(`${base}/team?person=no-such-person`);
      expect(response?.status()).toBe(200);
      await settle(page);
      // stays on Team, opens nothing, renders the roster
      expect(new URL(page.url()).pathname).toBe(`${base}/team`);
      await expect(page.locator(".dtm__dossier")).toHaveCount(0);
      await expect(page.locator("[data-dtm-card]").first()).toBeVisible();
      expect(errors, "an unknown id must not throw").toEqual([]);
    });

    test(`${label}: a hostile person value cannot throw`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      // this used to be interpolated into a CSS selector and threw a
      // SyntaxError inside requestAnimationFrame
      for (const raw of ['"]', "*", "a[b", "]]><script>", "../../etc"]) {
        await page.goto(`${base}/team?person=${encodeURIComponent(raw)}`);
        await settle(page);
        await expect(page.locator(".dtm__dossier"), raw).toHaveCount(0);
        await expect(page.locator("[data-dtm-card]").first(), raw).toBeVisible();
      }
      expect(errors, "a hostile ?person= value threw").toEqual([]);
    });
  });
}

test.describe("§P0 Team deep link - locale switch", () => {
  test("the switcher carries the person query across locales", async ({ page }) => {
    await page.goto("/team?person=mariam-kandiashvili");
    await settle(page);
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    // The open profile is a real modal - its backdrop deliberately blocks the
    // chrome behind it, so the switcher is not CLICKABLE while a profile is up.
    // What has to hold is that the href it would navigate to keeps the query,
    // which is what a visitor gets after closing the sheet or copying the link.
    const ka = await page
      .locator(".dao-chrome .dao-lang a", { hasText: "KA" })
      .getAttribute("href");
    expect(ka).toBe("/ka/team?person=mariam-kandiashvili");
  });

  test("switching locale from the roster keeps the route", async ({ page }) => {
    await page.goto("/team");
    await settle(page);
    await page.mouse.move(300, 400);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka\/team$/);
    await expect(page.locator("[data-dtm-card]").first()).toBeVisible();
  });

  test("the KA deep link opens the same person", async ({ page }) => {
    await page.goto("/ka/team?person=mariam-kandiashvili");
    await settle(page);
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
    expect(await person(page)).toBe("mariam-kandiashvili");
  });
});
