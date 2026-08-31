import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";
import {
  probeWebKitMediaCapability,
  skipWhenWebKitMediaUnavailable,
  webKitMediaUnavailableMessage,
} from "./media-capability";

/**
 * §03/§04, §10-§12, §13/§14 - the mobile session lifecycle.
 *
 * This file runs on the `mobile-safari` (iPhone 14 / WebKit) and
 * `mobile-chrome` (Pixel 5) projects ONLY, deliberately without the
 * `--autoplay-policy=no-user-gesture-required` launch flag the desktop project
 * uses: with that flag the reel autoplays regardless and none of this proves
 * anything. Every test here goes through a real document load, so the Studio
 * Ident plays first - which is exactly the condition the autoplay bug lived in.
 *
 * §P0: this file used to clear the suite-wide `x-dao-hard-load` bypass header to
 * behave like a real browser. There is no such header any more - the whole suite
 * now sends real-browser requests - so the override is gone rather than kept as
 * a no-op.
 */

/** wait for the ident sheet to finish and leave the stage */
async function waitForIdent(page: Page) {
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-ident"), null, {
      timeout: 25_000,
    })
    .catch(() => {});
  await expect(page.locator(".dao-ident")).toHaveCount(0, { timeout: 25_000 });
}

const PLAYING = () => {
  const v = document.querySelector(
    "video.dao-reel-probe, .dao-reel__media video",
  ) as HTMLVideoElement | null;
  return !!v && !v.paused && v.currentTime > 0.1;
};

async function reel(page: Page) {
  return page.evaluate(() => {
    const v = document.querySelector<HTMLVideoElement>(".dao-reel__media video");
    if (!v) return null;
    return {
      paused: v.paused,
      t: Number(v.currentTime.toFixed(3)),
      muted: v.muted,
      inline: v.hasAttribute("playsinline"),
    };
  });
}

async function expectShowreelStructure(page: Page) {
  const reelMedia = page.locator(".dao-reel__media");
  const video = reelMedia.locator("video");
  await expect(reelMedia).toBeVisible();
  await expect(video).toBeVisible();
  await expect(video.locator("source")).toHaveAttribute("src", "/media/showreel.mp4");

  const state = await video.evaluate((v: HTMLVideoElement) => ({
    muted: v.muted,
    defaultMuted: v.defaultMuted,
    loop: v.loop,
    inline: v.playsInline,
    hasInlineAttribute: v.hasAttribute("playsinline"),
    controls: v.controls,
    preload: v.preload,
    sourceType: v.querySelector("source")?.getAttribute("type"),
  }));
  expect(state.muted).toBe(true);
  expect(state.defaultMuted).toBe(true);
  expect(state.loop).toBe(true);
  expect(state.inline).toBe(true);
  expect(state.hasInlineAttribute).toBe(true);
  expect(state.controls).toBe(false);
  expect(state.preload).toBe("metadata");
  expect(state.sourceType).toBe("video/mp4");

  /**
   * The poster covers the stage until real playback is CONFIRMED, and leaves
   * only then - that is the contract, and which of its two states is correct
   * depends on whether this runtime can actually decode the master.
   *
   * So the relationship is asserted rather than one of the two states. The
   * caller's capability probe classifies the runtime once, up front, and under
   * load that single sample can report a capable WebKit as incapable - at which
   * point demanding the poster of a reel that is happily playing is asserting
   * the wrong half of the contract. Reading it from the element itself cannot
   * drift, and it is strictly MORE coverage: the old assertion never checked
   * that the poster leaves.
   */
  const poster = reelMedia.locator("img");
  const advancing = await video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0.1);
  if (advancing) {
    await expect(poster, "a playing reel must not keep the poster over it").toHaveCount(0);
  } else {
    await expect(poster, "a reel that is not playing must keep its poster").toHaveCount(1);
    await expect
      .poll(
        () => poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        { timeout: 15_000 },
      )
      .toBe(true);
  }
}

/**
 * Bring the chrome back before touching one of its controls.
 *
 * This is not test scaffolding around a bug - it is the behaviour under test.
 * On touch devices an idle chrome is opacity 0 AND pointer-events: none, so the
 * first input reveals it and never actuates the control underneath; a real
 * visitor taps once to bring the chrome back and then taps the burger. A
 * keypress is used rather than a tap because it re-arms the same idle timer
 * without moving the page or risking a stray navigation; the dedicated tests
 * below cover restoring by touch and by scroll specifically.
 */
async function revealChrome(page: Page) {
  await page.keyboard.press("Shift");
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, {
    timeout: 8000,
  });
}

/** current computed opacity of a selector, or -1 when it is not in the DOM */
function opacity(page: Page, selector: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? Number(getComputedStyle(el).opacity) : -1;
  }, selector);
}

test.describe("§10-§12 showreel autoplay on mobile", () => {
  test("the reel plays and ADVANCES once the ident has left", async ({ page }, testInfo) => {
    await skipWhenWebKitMediaUnavailable(page, testInfo);

    await page.goto("/");
    await waitForIdent(page);

    // the fix: attempts are made once the reel is ELIGIBLE (ident gone,
    // on-screen, page visible) and retried on a bounded timer rather than only
    // on readiness events - so it starts shortly after the ident clears with no
    // gesture of any kind
    await page.waitForFunction(PLAYING, null, { timeout: 20_000 });

    const first = await reel(page);
    expect(first).not.toBeNull();
    expect(first!.muted, "muted is what makes gesture-free autoplay legal").toBe(true);
    expect(first!.inline, "playsinline keeps iOS out of fullscreen").toBe(true);

    // advancing, not merely un-paused on frame one
    await page.waitForTimeout(1200);
    const second = await reel(page);
    expect(second!.paused).toBe(false);
    expect(second!.t).toBeGreaterThan(first!.t);
  });

  test("the poster only leaves once real playback is confirmed", async ({ page }, testInfo) => {
    await skipWhenWebKitMediaUnavailable(page, testInfo);

    await page.goto("/");
    await waitForIdent(page);
    await page.waitForFunction(PLAYING, null, { timeout: 20_000 });
    // the poster is removed on `playing` and never before, so the visitor never
    // sees poster -> black
    await expect(page.locator(".dao-reel__media img")).toHaveCount(0, { timeout: 10_000 });
  });

  test("it does NOT take a language switch to get the reel going", async ({ page }, testInfo) => {
    await skipWhenWebKitMediaUnavailable(page, testInfo);

    // the reported symptom: the reel sat on frame one until the visitor
    // happened to switch locale, which remounted the element
    await page.goto("/");
    await waitForIdent(page);
    await page.waitForTimeout(4000);
    const s = await reel(page);
    expect(s!.paused, "playing before any interaction at all").toBe(false);
    expect(s!.t).toBeGreaterThan(0.1);
  });

  test("§16 the meta strip reads as studio authorship, not technical specs", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    const meta = page.locator(".dao-reel__meta");
    await expect(meta).toContainText(/AN 8TH STATE PRODUCTION/i);
    await expect(meta).not.toContainText(/FPS/i);
    await expect(meta).not.toContainText(/PRJ-/i);
  });

  test("keeps WebKit structure and lifecycle coverage when media decode is unavailable", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-safari", "WebKit fallback contract only");

    const capability = await probeWebKitMediaCapability(page);
    test.skip(
      capability.available,
      "Local WebKit media runtime is available; strict playback covers this.",
    );

    console.log(webKitMediaUnavailableMessage());
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await waitForIdent(page);
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    await expect(page.locator(".dao-reel")).toBeVisible();
    await expectShowreelStructure(page);
    await page.waitForLoadState("load");
    expect(errors(), errors().join("\n")).toEqual([]);
  });
});

test.describe("§03/§04 chrome auto-hide on touch", () => {
  test("the whole chrome withdraws when the finger stops - burger included", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);

    // a tap near the top is what used to pin the idle guard open forever: the
    // guard read pointermove, which on touch comes from the finger
    await page.locator("body").click({ position: { x: 40, y: 40 } });

    await page.waitForFunction(() => document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 12_000,
    });

    // all of it has actually left the frame - the sun mark and the wordmark
    // live inside .dao-chrome__brand, so that covers both
    await expect(page.locator(".dao-chrome__mark")).toHaveCount(1);
    await expect(page.locator(".dao-chrome__word")).toHaveCount(1);
    for (const sel of [".dao-chrome__brand", ".dao-chrome .dao-lang", ".dao-burger"]) {
      await expect
        .poll(() => opacity(page, sel), { message: sel, timeout: 8000 })
        .toBeLessThan(0.02);
    }
  });

  test("touching the screen brings it straight back", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    await page.locator("body").click({ position: { x: 40, y: 40 } });
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 12_000,
    });

    await page.locator("body").click({ position: { x: 160, y: 420 } });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-dao-idle")), {
        timeout: 5000,
      })
      .toBe(false);
    await expect.poll(() => opacity(page, ".dao-burger"), { timeout: 5000 }).toBeGreaterThan(0.9);
  });

  test("scrolling also restores it", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    await page.locator("body").click({ position: { x: 40, y: 40 } });
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 12_000,
    });

    await page.evaluate(() => window.scrollBy(0, 500));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-dao-idle")), {
        timeout: 5000,
      })
      .toBe(false);
  });

  test("it still auto-hides after the menu has been opened and closed", async ({ page }) => {
    // Regression guard for a real defect this pass found: closing the burger
    // leaves POINTER focus on it, and on Chromium/Android that focus is sticky.
    // While the idle guard keyed on activeElement/:focus-within, that one
    // interaction pinned the chrome on screen for the rest of the session.
    await page.goto("/");
    await waitForIdent(page);
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(0);

    // the burger still holds focus here - and the chrome must withdraw anyway
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 12_000,
    });
    await expect.poll(() => opacity(page, ".dao-burger"), { timeout: 8000 }).toBeLessThan(0.02);
  });

  test("keyboard focus, unlike a tap, does hold the chrome open", async ({ page }) => {
    // the other half of the same rule: a keyboard user must never have the
    // control they are on fade out from under them
    await page.goto("/");
    await waitForIdent(page);
    await page.locator(".dao-burger").evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => document.documentElement.hasAttribute("data-dao-idle"))).toBe(
      false,
    );
  });

  test("it never hides while the menu is open, and close stays usable", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);

    // sit still for well over the 1.8s idle timeout
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => document.documentElement.hasAttribute("data-dao-idle"))).toBe(
      false,
    );

    // the control that closes it is still visible and still works
    expect(await opacity(page, ".dao-burger")).toBeGreaterThan(0.9);
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(0);
  });
});

test.describe("§13/§14 locale switching", () => {
  test("switching language keeps you on the page you were reading", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    // reach a deep route by client-side navigation
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await page.locator("#dao-nav a[href='/work']").first().click();
    await expect(page).toHaveURL(/\/work$/, { timeout: 15_000 });

    await revealChrome(page);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka\/work$/, { timeout: 15_000 });
  });

  test("the burger stays OPEN across a locale switch, with no ident replay", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);

    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka$/, { timeout: 15_000 });

    // §14: still open, without the visitor having to reopen it
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1, { timeout: 10_000 });
    // it was a client-side switch, so the ident did not replay
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
  });

  test("an ordinary navigation afterwards does NOT resurrect the sheet", async ({ page }) => {
    // the §14 handoff is consumed exactly once
    await page.goto("/");
    await waitForIdent(page);
    await revealChrome(page);
    await page.locator(".dao-burger").click();
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(1, { timeout: 10_000 });

    await page.locator("#dao-nav a[href='/ka/work']").first().click();
    await expect(page).toHaveURL(/\/ka\/work$/, { timeout: 15_000 });
    await expect(page.locator(".dao-nav.is-open")).toHaveCount(0, { timeout: 10_000 });
  });

  test("the reel is still playing after the switch", async ({ page }, testInfo) => {
    await skipWhenWebKitMediaUnavailable(page, testInfo);

    await page.goto("/");
    await waitForIdent(page);
    await page.waitForFunction(PLAYING, null, { timeout: 20_000 });

    await revealChrome(page);
    await page.locator(".dao-chrome .dao-lang a", { hasText: "KA" }).click();
    await expect(page).toHaveURL(/\/ka$/, { timeout: 15_000 });
    await page.waitForFunction(PLAYING, null, { timeout: 20_000 });
  });
});

test.describe("§15 returning after a long background", () => {
  test("a short absence resumes exactly where it was", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    // Scroll somewhere identifiable, then background and return quickly. The
    // scroll is smooth, so the baseline has to be read after it has SETTLED -
    // read too early and it is 0 (assertion vacuous) or a mid-flight value
    // (assertion wrong). Anchor on the animation rather than on a wall clock.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(
      () => {
        const w = window as unknown as { __last?: number; __still?: number };
        const y = Math.round(window.scrollY);
        w.__still = y === w.__last ? (w.__still ?? 0) + 1 : 0;
        w.__last = y;
        return y > 0 && (w.__still ?? 0) >= 3;
      },
      null,
      { timeout: 8000, polling: 100 },
    );
    const before = await page.evaluate(() => Math.round(window.scrollY));

    await page.evaluate(() => {
      // the stamp the component writes on `hidden`, two minutes ago
      sessionStorage.setItem("dao:hidden-at", String(Date.now() - 2 * 60 * 1000));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(800);

    // no re-entry: same page, same position, no ident
    await expect(page.locator(".dao-ident")).toHaveCount(0);
    // Tolerance rather than pixel equality. What this asserts is that the page
    // was NOT re-entered - a re-entry resets the scroll to 0 - and the settle
    // detection above can still hand back a value a frame or two before the
    // smooth scroll fully stops, which made an exact match flaky on WebKit.
    const after = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(after - before), `${before} -> ${after}`).toBeLessThanOrEqual(40);
    expect(after, "and certainly not reset to the top").toBeGreaterThan(400);
  });

  test("a long absence re-enters the site from the Studio Ident", async ({ page }) => {
    await page.goto("/work");
    await waitForIdent(page);

    await page.evaluate(() => {
      sessionStorage.setItem("dao:hidden-at", String(Date.now() - 31 * 60 * 1000));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // a real document load of the locale home, which is what replays the ident
    await expect(page).toHaveURL(/localhost:\d+\/$/, { timeout: 15_000 });
    await waitForIdent(page);

    // The ancient stamp was consumed before navigating, which is what stops
    // this looping. What is in storage now is a FRESH one, written by the
    // `pagehide` that fired as the old document unloaded - so a return a moment
    // later measures a gap of milliseconds, not 31 minutes.
    const stamp = await page.evaluate(() => sessionStorage.getItem("dao:hidden-at"));
    const age = stamp === null ? 0 : Date.now() - Number(stamp);
    expect(age, "the 31-minute stamp is gone").toBeLessThan(60_000);
  });

  test("the re-entry happens once, not on every later return", async ({ page }) => {
    await page.goto("/");
    await waitForIdent(page);
    await page.evaluate(() => {
      sessionStorage.setItem("dao:hidden-at", String(Date.now() - 45 * 60 * 1000));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitForIdent(page);

    // a second return with no fresh stamp must do nothing at all
    const url = page.url();
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await page.waitForTimeout(1000);
    expect(page.url()).toBe(url);
    await expect(page.locator(".dao-ident")).toHaveCount(0);
  });
});

test.describe("§02 the wordmark is one Latin face in both locales", () => {
  test("8TH STATE renders in the same family in EN and KA", async ({ page }) => {
    const read = async (path: string) => {
      await page.goto(path);
      await waitForIdent(page);
      return page.evaluate(() => {
        const el = document.querySelector(".dao-chrome__word");
        if (!el) return null;
        return { family: getComputedStyle(el).fontFamily, text: el.textContent?.trim() ?? "" };
      });
    };
    const en = await read("/");
    const ka = await read("/ka");
    expect(en).not.toBeNull();
    expect(ka).not.toBeNull();
    expect(ka!.family, "the Latin wordmark must not follow the Georgian role swap").toBe(
      en!.family,
    );
    // it is the Latin wordmark in both, not a translation
    expect(en!.text).toMatch(/8TH STATE/i);
    expect(ka!.text).toMatch(/8TH STATE/i);
    // and it really is the Optika stack, not an inherited Georgian one
    expect(en!.family.toLowerCase()).toContain("optika");
    expect(en!.family.toLowerCase()).not.toContain("sanet");
  });

  test("the EN / KA labels likewise", async ({ page }) => {
    const read = async (path: string) => {
      await page.goto(path);
      await waitForIdent(page);
      return page.evaluate(() => getComputedStyle(document.querySelector(".dao-lang")!).fontFamily);
    };
    expect(await read("/ka")).toBe(await read("/"));
  });
});
