import { test, expect } from "@playwright/test";
import { expectNoSeriousA11y, collectConsoleErrors, gotoRoute } from "./helpers";

test.describe("Homepage - One Continuous Take", () => {
  test("plays the studio ident, then hands over to the showreel", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await expect(page.locator(".dao-ident")).toContainText("8TH STATE");
    // v7 short form auto-advances (~1.8s) to the showreel beneath.
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 8_000 });
    // the reel is a moving hero now: it autoplays muted, no Play control
    const reel = page.locator(".dao-reel__media video");
    await expect(reel).toBeVisible();
    await expect(page.locator(".dao-reel button")).toHaveCount(0);
    await expect
      .poll(
        () =>
          reel.evaluate(
            (v) => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > 0,
          ),
        { timeout: 8_000 },
      )
      .toBe(true);
    await page.waitForLoadState("load");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("any input skips the ident immediately", async ({ page }) => {
    await page.goto("/");
    // wait for the drawn phase - the same effect that draws also attaches
    // the skip listeners; a keypress before hydration tests nothing
    await expect(page.locator(".dao-ident.is-drawn")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 3_000 });
  });

  test("refinement: the ident holds its completed composition for at least 2s", async ({
    page,
  }) => {
    await page.goto("/");
    const ident = page.locator(".dao-ident");
    await expect(ident).toBeVisible();
    // brand pass §02: nothing prints in below PRODUCTION any more - the
    // composition is the brand mark and the wordmark, nothing else
    await expect(page.locator(".dao-ident__logolabel")).toHaveCount(0);
    // The 2s window is measured from the moment the composition COMPLETES, not
    // from navigation. Anchored on navigation it was flaky under parallel load:
    // slow startup plus the assertions above could eat the ident's whole
    // ~3.5s life before the wait even began, and the test then failed for
    // reasons that had nothing to do with the hold.
    await expect(ident).toHaveClass(/is-drawn/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(ident, "the completed composition must hold for 2s").toBeVisible();
    await expect(ident).toBeHidden({ timeout: 6_000 });
  });

  test("refinement: the brand mark is a home link everywhere", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.mouse.move(300, 400);
    const brand = page.getByRole("link", { name: "8th State Production" }).first();
    await expect(brand).toBeVisible();
    await brand.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".dao-reel")).toBeVisible();
  });

  test("refinement: chrome tracks the ground under it (contrast fix)", async ({ page }) => {
    // /studio: paper world at the top -> light chrome
    await gotoRoute(page, "/studio");
    await page.mouse.move(300, 400);
    await expect(page.locator(".dao-chrome")).toHaveClass(/dao-chrome--light/);

    // /services: the dark made-world band passes under the chrome line ->
    // the chrome returns to its paper variant while over it
    await gotoRoute(page, "/services");
    await page.mouse.move(300, 400);
    await expect(page.locator(".dao-chrome")).toHaveClass(/dao-chrome--light/);
    await page.locator(".dsv__g2").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.mouse.move(320, 420);
    await expect(page.locator(".dao-chrome")).not.toHaveClass(/dao-chrome--light/, {
      timeout: 4_000,
    });
  });

  test("v7: refresh on an inner route plays the ident, then stays on that route", async ({
    page,
  }) => {
    await page.goto("/services");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/services/i);
  });

  test("v7: internal navigation never replays the ident", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("dialog").getByRole("link", { name: "SERVICES" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator(".dao-ident")).toBeHidden();
  });

  test("burger navigation opens with no overflow, curtain-closes, traps focus", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // v7 #2: one intentional composition - the sheet clips its midground
    // (no scrollbars) and the last destination sits inside the viewport.
    const fit = await dialog.evaluate((el) => {
      const list = el.querySelector(".dao-nav__list")!;
      return {
        overflowStyle: getComputedStyle(el).overflowY,
        listBottom: list.getBoundingClientRect().bottom,
        viewport: window.innerHeight,
      };
    });
    expect(fit.overflowStyle).toBe("hidden");
    expect(fit.listBottom).toBeLessThanOrEqual(fit.viewport + 1);

    // v7 #3: Esc runs the curtain-up close and restores focus. (The role
    // disappears with aria-hidden the moment closing starts - assert on the
    // element itself.)
    const sheet = page.locator("#dao-nav");
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveClass(/is-closing/);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /open menu/i })).toBeFocused();

    // WORK expands the approved categories; a category navigates to /work.
    await page.getByRole("button", { name: /open menu/i }).click();
    await dialog.getByRole("button", { name: /work categories/i }).click();
    await dialog.getByRole("link", { name: "Film & Video" }).click();
    await expect(page).toHaveURL(/\/work\?category=film-video$/);
  });

  test("v7: selected work is a direction-aware keyboard carousel", async ({ page }) => {
    await gotoRoute(page, "/");
    const stage = page.locator(".dao-work__stage");
    await stage.scrollIntoViewIfNeeded();
    await stage.focus();
    await expect(page.locator("#dao-work-opt-0")).toHaveClass(/is-active/);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#dao-work-opt-1")).toHaveClass(/is-active/);
    await page.waitForTimeout(800);
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#dao-work-opt-0")).toHaveClass(/is-active/);
  });

  test("v7: selected work auto-advances at 5s and pauses on hover", async ({ page }) => {
    await gotoRoute(page, "/");
    const counter = page.locator(".dao-work__counter");
    await counter.scrollIntoViewIfNeeded();
    await page.mouse.move(10, 10); // pointer away from the act - timer runs
    await expect(counter).toContainText("01 / 05");
    await expect(counter).toContainText("02 / 05", { timeout: 8_000 });
  });

  test("v7: chrome auto-hides after idle and restores on input", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(500, 500);
    await page.waitForTimeout(2_300);
    await expect(page.locator("html")).toHaveAttribute("data-dao-idle", "");
    await page.mouse.move(520, 520);
    await expect(page.locator("html")).not.toHaveAttribute("data-dao-idle", "");
  });

  test("language switch preserves the equivalent route", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.mouse.move(300, 400);
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka\/work$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ნამუშევრები");
  });

  test("remains usable with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/");
    const statement = page.getByText("multidisciplinary production company").first();
    await statement.scrollIntoViewIfNeeded();
    await expect(statement).toBeVisible();
    await page.getByRole("link", { name: /All Work/i }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("no serious accessibility violations", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dao-reel", ".dao-chrome"]);
  });
});

test.describe("Studio Ident motion + copy", () => {
  test("the ident carries no locale control and no city line", async ({ page }) => {
    await page.goto("/");
    const ident = page.locator(".dao-ident");
    await expect(ident).toBeVisible();
    // the composition is the brand mark plus the wordmark - brand pass §11
    // also retired the ACT 00 / SOUND OFF corners (see brand.spec.ts)
    await expect(ident).toContainText("8TH STATE");
    await expect(ident).not.toContainText(/TBILISI/i);
    await expect(ident.locator(".dao-lang")).toHaveCount(0);
    await expect(ident.locator("a")).toHaveCount(0);
    // ... and the single global switcher still works after the ident leaves
    await expect(ident).toBeHidden({ timeout: 8_000 });
    await page.mouse.move(300, 400);
    const lang = page.locator(".dao-chrome .dao-lang a");
    await expect(lang).toHaveCount(2);
    await expect(lang.nth(1)).toHaveAttribute("href", "/ka");
  });

  // The serpent reveal contract moved with the brand pass: the mark now
  // unfolds out of its OWN CENTRE rather than sweeping in from the right,
  // and the composition gained a white and a black celestial sun. The full
  // frame-by-frame contract (artwork pinned, centre-out band, sun travel,
  // no residue after settling) lives in brand.spec.ts.
});

test.describe("Real-device mobile fixes", () => {
  // The Studio act mark broke on a real Android device (broken image + alt
  // text). Guard the whole chain: the element resolves a real derivative and
  // decodes to non-zero intrinsic pixels.
  test("the studio brand mark loads and decodes", async ({ page }) => {
    const bad: string[] = [];
    page.on("response", (r) => {
      if (/logo-mark/.test(decodeURIComponent(r.url())) && r.status() >= 400) {
        bad.push(r.status() + " " + r.url());
      }
    });
    await gotoRoute(page, "/");
    const mark = page.locator(".dao-intro__logomark");
    await mark.scrollIntoViewIfNeeded();
    await expect(mark).toBeVisible();
    await expect
      .poll(() => mark.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 15_000,
      })
      .toBe(true);
    const info = await mark.evaluate((el: HTMLImageElement) => ({
      w: el.naturalWidth,
      h: el.naturalHeight,
      src: el.currentSrc,
    }));
    expect(info.w).toBeGreaterThan(0);
    expect(info.h).toBeGreaterThan(0);
    expect(info.src).toContain("logo-mark");
    expect(bad, bad.join(", ")).toEqual([]);
  });

  // iPhone Safari froze on the first frame because play() was gated behind
  // canplay, which never fires under preload="metadata". Assert real,
  // advancing playback rather than just a non-paused flag.
  test("the showreel autoplays and advances after the ident", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeHidden({ timeout: 8_000 });
    const reel = page.locator(".dao-reel__media video");
    await expect(reel).toBeVisible();
    await expect
      .poll(() => reel.evaluate((v: HTMLVideoElement) => !v.paused), { timeout: 10_000 })
      .toBe(true);
    const t1 = await reel.evaluate((v: HTMLVideoElement) => v.currentTime);
    await page.waitForTimeout(1_200);
    const state = await reel.evaluate((v: HTMLVideoElement) => ({
      t: v.currentTime,
      paused: v.paused,
      muted: v.muted,
      loop: v.loop,
      inline: v.playsInline,
      controls: v.controls,
      readyState: v.readyState,
      networkState: v.networkState,
      err: v.error ? v.error.code : null,
    }));
    expect(state.t).toBeGreaterThan(t1);
    expect(state.paused).toBe(false);
    expect(state.muted).toBe(true);
    expect(state.loop).toBe(true);
    expect(state.inline).toBe(true);
    expect(state.controls).toBe(false);
    expect(state.readyState).toBeGreaterThanOrEqual(2);
    expect(state.err).toBeNull();
    // the poster hands over only once playback is confirmed
    await expect(page.locator(".dao-reel__media img")).toHaveCount(0);
  });

  test("reduced motion keeps the poster and never autoplays", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/");
    const reel = page.locator(".dao-reel__media video");
    await expect(reel).toBeVisible();
    await page.waitForTimeout(2_500);
    const st = await reel.evaluate((v: HTMLVideoElement) => ({
      paused: v.paused,
      t: v.currentTime,
    }));
    expect(st.paused).toBe(true);
    expect(st.t).toBe(0);
    // the first-frame poster still carries the stage
    await expect(page.locator(".dao-reel__media img")).toHaveCount(1);
  });
});

test.describe("Global polish pass", () => {
  test("the open burger sheet is the only navigation on screen", async ({ page }) => {
    /**
     * SUPERSEDES "the open burger sheet hides the contextual return tab".
     *
     * The tab floated over the chrome, so it had to be actively hidden while
     * the sheet was up or it would have read as a second HOME control on top of
     * the burger composition. The masthead back is printed into the page and
     * scrolls with it, so there is nothing floating to hide - what still has to
     * hold is that no page control is drawn OVER the open sheet.
     */
    await gotoRoute(page, "/work/aom-summer-collection");
    await page.mouse.move(300, 400);
    const back = page.locator(".dao-mback");
    await expect(back).toBeVisible();
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // the sheet covers the page, so the page's own controls end up behind it -
    // never painted over the burger composition. Polled, because the dialog
    // becomes visible when its curtain STARTS travelling, not when it lands.
    await expect
      .poll(
        () =>
          back.evaluate((el) => {
            const r = el.getBoundingClientRect();
            // off the viewport entirely is also "not painted over the sheet"
            if (r.bottom < 0 || r.top > window.innerHeight) return true;
            const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !top || !el.contains(top);
          }),
        { timeout: 4000, message: "a page control was drawn over the open sheet" },
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(back).toBeVisible();
  });

  test("burger WORK always opens the full archive with ALL active", async ({ page }) => {
    await gotoRoute(page, "/work?category=photography");
    await expect(page.locator('.dwk__filter[aria-current="true"]')).toContainText(/photography/i);
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    // the WORK label itself is the archive link (first /work link in the sheet)
    await page.locator('#dao-nav a[href="/work"]').first().click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator('.dwk__filter[aria-current="true"]')).toContainText(/all/i);
    // the categories toggle stays reachable on the numeral
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("button", { name: /work categories/i }).click();
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Film & Video" }),
    ).toBeVisible();
  });

  test("the burger opens with no preview; WORK hover reveals and leaving hides it", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const preview = page.locator(".dao-nav__preview");
    // the sheet must open with no preview on stage
    await expect(preview).not.toHaveClass(/is-live/);
    expect(await preview.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");

    const work = page.locator('#dao-nav a[href="/work"]').first();
    await work.hover();
    await expect(preview).toHaveClass(/is-live/);
    await expect.poll(() => preview.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

    // leaving WORK retires its preview
    await page.mouse.move(1200, 800);
    await expect(preview).not.toHaveClass(/is-live/);

    // reopening must not restore the previous hover state
    await page.keyboard.press("Escape");
    await expect(page.locator("#dao-nav")).toBeHidden();
    await page.mouse.move(300, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(preview).not.toHaveClass(/is-live/);
  });

  test("chrome red backing follows the idle choreography", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(500, 500);
    const beforeOpacity = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector(".dao-chrome")!, "::before").opacity,
      );
    // poll rather than sample once: the backing has a 250ms fade-in, so an
    // instantaneous read straight after the pointer move catches it mid-flight
    await expect.poll(beforeOpacity, { timeout: 4_000 }).toBe("1");
    await page.waitForTimeout(2_300);
    await expect(page.locator("html")).toHaveAttribute("data-dao-idle", "");
    await page.waitForTimeout(700); // 600ms fade-out completes
    expect(await beforeOpacity()).toBe("0");
    await page.mouse.move(520, 520);
    await expect(page.locator("html")).not.toHaveAttribute("data-dao-idle", "");
    await expect.poll(beforeOpacity).toBe("1");
  });
});
