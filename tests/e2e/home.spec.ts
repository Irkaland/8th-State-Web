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
    // official logo label prints in as part of the sequence (§02)
    await expect(page.locator(".dao-ident__logolabel img")).toHaveAttribute(
      "src",
      /8th-state-logo\.png/,
    );
    // still holding at 2.0s with no input
    await page.waitForTimeout(2_000);
    await expect(ident).toBeVisible();
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
    // the composition keeps its act + sound corners and the wordmark
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

  test("the serpent holds its final position and reveals in place", async ({ page }) => {
    // Sample the mark's box and the reveal clip every frame. The artwork must
    // never move; only the clip contour may progress.
    await page.addInitScript(() => {
      type Sample = { t: number; l: number; tp: number; w: number; h: number; clip: string };
      (window as unknown as { __r: Sample[] }).__r = [];
      const tick = () => {
        const wrap = document.querySelector(".dao-ident__serpentreveal");
        const snake = document.querySelector(".dao-ident__serpent");
        const store = (window as unknown as { __r: Sample[] }).__r;
        if (wrap && snake) {
          const b = snake.getBoundingClientRect();
          store.push({
            t: Math.round(performance.now()),
            l: +b.left.toFixed(2),
            tp: +b.top.toFixed(2),
            w: +b.width.toFixed(2),
            h: +b.height.toFixed(2),
            clip: getComputedStyle(wrap).clipPath,
          });
        }
        if (store.length < 320) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForTimeout(2_400); // the 1250ms reveal plus settle
    const r = await page.evaluate(
      () =>
        (
          window as unknown as {
            __r: { t: number; l: number; tp: number; w: number; h: number; clip: string }[];
          }
        ).__r,
    );
    expect(r.length).toBeGreaterThan(30);

    // 1. the mark NEVER translates or resizes - fixed from frame one
    const ls = r.map((p) => p.l);
    const ts = r.map((p) => p.tp);
    const ws = r.map((p) => p.w);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThan(1);
    expect(Math.max(...ts) - Math.min(...ts)).toBeLessThan(1);
    expect(Math.max(...ws) - Math.min(...ws)).toBeLessThan(1);

    // 2. it sits centred in the ident, not off to one side
    const vw = page.viewportSize()!.width;
    const centre = (r[0].l + r[0].w / 2) / vw;
    expect(centre).toBeGreaterThan(0.35);
    expect(centre).toBeLessThan(0.65);

    // 3. the reveal actually progresses: the clip contour changes over time
    const clips = [...new Set(r.map((p) => p.clip))];
    expect(clips.length, "the clip contour must animate").toBeGreaterThan(5);

    // 4. it is a torn contour, not a straight rectangular wipe
    expect(r[0].clip).toContain("polygon");
    const pts = (r[0].clip.match(/-?[\d.]+%\s+-?[\d.]+%/g) || []).length;
    expect(pts, "the reveal edge is an irregular multi-point contour").toBeGreaterThan(6);

    // 5. it starts hidden (edge parked right of the box) and ends fully open
    const firstXs = (r[0].clip.match(/(-?[\d.]+)px|(-?[\d.]+)%/g) || []).length;
    expect(firstXs).toBeGreaterThan(0);
    const last = r[r.length - 1];
    // the final contour must clear the left edge, so nothing stays clipped
    const lastLefts = [...last.clip.matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]));
    if (lastLefts.length) expect(Math.min(...lastLefts)).toBeLessThanOrEqual(0);

    // 6. and the mark is fully painted at the end
    const shown = await page.locator(".dao-ident__serpent").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { opacity: cs.opacity, transform: cs.transform };
    });
    expect(Number(shown.opacity)).toBeGreaterThan(0.9);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(shown.transform);
  });
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
  test("the open burger sheet hides the contextual return tab", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.mouse.move(300, 400);
    const tab = page.locator(".dao-returntab");
    await expect(tab).toBeVisible();
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // opacity 0 + pointer-events none while the sheet is open - no HOME
    // control may float over the burger composition
    await expect.poll(() => tab.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
    expect(await tab.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
    await page.keyboard.press("Escape");
    await expect.poll(() => tab.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
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
    expect(await beforeOpacity()).toBe("1");
    await page.waitForTimeout(2_300);
    await expect(page.locator("html")).toHaveAttribute("data-dao-idle", "");
    await page.waitForTimeout(700); // 600ms fade-out completes
    expect(await beforeOpacity()).toBe("0");
    await page.mouse.move(520, 520);
    await expect(page.locator("html")).not.toHaveAttribute("data-dao-idle", "");
    await expect.poll(beforeOpacity).toBe("1");
  });
});
