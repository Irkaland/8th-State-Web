import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Brand system pass - Studio Ident, the global celestial navigation mark and
 * the global removal of torn section boundaries.
 *
 *  §02-§04  the ident is the official lockup on the approved intro green
 *  §05-§09  centre-out serpent unfold + white sun descends + black sun rises
 *  §10-§11  stronger PRODUCTION, no corner metadata, no lower square logo
 *  §13-§14  the celestial sun replaces the serpent in the chrome and keeps
 *           the adaptive light/dark theming
 *  §15-§18  no torn/jagged boundary between major sections on any route, and
 *           no flat-colour seam introduced in their place
 */

const IDENT_GREEN = "rgb(18, 97, 73)"; // #126149

/** Freeze the ident on screen: its only 2450ms timer is the auto-leave. */
async function holdIdent(page: Page) {
  await page.addInitScript(() => {
    const orig = window.setTimeout;
    type ST = (h: TimerHandler, ms?: number, ...rest: unknown[]) => number;
    (window as unknown as { setTimeout: ST }).setTimeout = (h, ms, ...rest) =>
      ms === 2450 ? 0 : (orig as unknown as ST).call(window, h, ms, ...rest);
  });
}

test.describe("Studio Ident - official brand mark", () => {
  test("resolves to the approved green paper ground with its material intact", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    const ident = page.locator(".dao-ident");
    await expect(ident).toBeVisible();

    // §03: the approved intro green, and NOT a flat colour field - the paper
    // grain and canvas weave overlays are still painted over it
    await expect(ident).toHaveCSS("background-color", IDENT_GREEN);
    await expect(ident.locator(".dao-grain--strong")).toHaveCount(1);
    await expect(ident.locator(".dao-weave")).toHaveCount(1);
    await expect(ident.locator(".dao-ident__splash")).toHaveCount(1);
    const material = await ident.locator(".dao-grain--strong").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { img: cs.backgroundImage, op: cs.opacity, blend: cs.mixBlendMode };
    });
    expect(material.img).toContain("paper-grain");
    expect(Number(material.op)).toBeGreaterThan(0);
    expect(material.blend).toBe("multiply");
  });

  test("carries no lower square logo and no corner metadata", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    const ident = page.locator(".dao-ident");
    await expect(ident).toBeVisible();

    // §02: the printed paper label with the full logo under PRODUCTION is gone
    await expect(page.locator(".dao-ident__logolabel")).toHaveCount(0);
    await expect(ident.locator("img")).toHaveCount(0);
    // §11: ACT 00 / SOUND OFF corner labels are gone, text and containers
    await expect(page.locator(".dao-ident__corner")).toHaveCount(0);
    await expect(ident).not.toContainText(/ACT 00/i);
    await expect(ident).not.toContainText(/SOUND OFF/i);
    await expect(ident).not.toContainText(/სტუდიის იდენტი/);

    // ... and nothing is left below PRODUCTION: the words block is the last
    // thing in the centred composition, and no reserved space follows it
    const gap = await page.evaluate(() => {
      const centre = document.querySelector(".dao-ident__center") as HTMLElement;
      const words = document.querySelector(".dao-ident__words") as HTMLElement;
      return centre.getBoundingClientRect().bottom - words.getBoundingClientRect().bottom;
    });
    expect(Math.abs(gap)).toBeLessThan(1);
  });

  test("composes the official red serpent with a white and a black celestial sun", async ({
    page,
  }) => {
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();

    const parts = await page.evaluate(() => {
      const q = (s: string) => document.querySelector(s) as HTMLElement;
      const serpent = getComputedStyle(q(".dao-ident__serpent"));
      const white = getComputedStyle(q(".dao-ident__sun--white"));
      const black = getComputedStyle(q(".dao-ident__sun--black"));
      return {
        serpentArt: serpent.backgroundImage,
        whiteMask: white.maskImage || white.webkitMaskImage,
        whiteFill: white.backgroundColor,
        blackMask: black.maskImage || black.webkitMaskImage,
        blackFill: black.backgroundColor,
      };
    });
    // the serpent is the authentic red artwork out of the official lockup
    expect(parts.serpentArt).toContain("serpent-infinity.webp");
    // both suns are the official celestial sun silhouette
    expect(parts.whiteMask).toContain("celestial-sun.webp");
    expect(parts.blackMask).toContain("celestial-sun.webp");
    // left = WHITE (brand paper), right = BLACK (brand ink)
    expect(parts.whiteFill).toBe("rgb(242, 237, 227)");
    expect(parts.blackFill).toBe("rgb(19, 18, 16)");

    // the crescent moon is not part of the final composition
    await expect(page.locator(".dao-ident__moon")).toHaveCount(0);
  });

  test("PRODUCTION carries a real heavier font weight than before", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    const sub = page.locator(".dao-ident__sub");
    await expect(sub).toHaveText("PRODUCTION");
    const type = await sub.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { weight: cs.fontWeight, family: cs.fontFamily, spacing: cs.letterSpacing };
    });
    // was 500 - now a real Optika SemiBold face, not a synthetic stroke
    expect(Number(type.weight)).toBeGreaterThanOrEqual(600);
    expect(type.family.toLowerCase()).toContain("optika");
    await expect(sub).toHaveCSS("-webkit-text-stroke-width", "0px");
    // tracking is unchanged (0.62em of the resolved font size)
    const size = await sub.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(parseFloat(type.spacing) / size).toBeCloseTo(0.62, 2);
  });

  test("the serpent unfolds out of its own centre and never travels", async ({ page }) => {
    // Sample the artwork box and the reveal contour every frame: the artwork
    // must be pinned, and the visible band must grow away from the centre in
    // BOTH directions - never sweep in from one side.
    //
    // The sampler is anchored to the ANIMATION, not to a wall clock: it stops
    // once the clip contour has held still for 10 straight frames, having
    // actually moved first. A fixed cutoff would, on a loaded machine where
    // hydration is slow, stop sampling mid-unfold and compare a half-open
    // contour against the start. The ident is frozen here, so there is no
    // exit lift to contaminate the tail.
    await holdIdent(page);
    await page.addInitScript(() => {
      type S = { t: number; l: number; tp: number; w: number; clip: string };
      const store: S[] = [];
      (window as unknown as { __s: S[] }).__s = store;
      (window as unknown as { __done: boolean }).__done = false;
      let still = 0;
      let moved = false;
      const tick = () => {
        const wrap = document.querySelector(".dao-ident__serpentreveal");
        const art = document.querySelector(".dao-ident__serpent");
        if (wrap && art) {
          const b = art.getBoundingClientRect();
          const clip = getComputedStyle(wrap).clipPath;
          const prev = store[store.length - 1];
          if (store.length && clip !== store[0].clip) moved = true;
          still = prev && prev.clip === clip ? still + 1 : 0;
          store.push({
            t: Math.round(performance.now()),
            l: +b.left.toFixed(2),
            tp: +b.top.toFixed(2),
            w: +b.width.toFixed(2),
            clip,
          });
        }
        if (!(moved && still >= 10) && performance.now() < 8000) requestAnimationFrame(tick);
        else (window as unknown as { __done: boolean }).__done = true;
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForFunction(() => (window as unknown as { __done: boolean }).__done, undefined, {
      timeout: 12_000,
    });

    const s = await page.evaluate(
      () =>
        (
          window as unknown as {
            __s: { t: number; l: number; tp: number; w: number; clip: string }[];
          }
        ).__s,
    );
    expect(s.length).toBeGreaterThan(30);

    // 1. the artwork never translates or resizes - fixed from frame one
    for (const key of ["l", "tp", "w"] as const) {
      const vs = s.map((p) => p[key]);
      expect(Math.max(...vs) - Math.min(...vs), `${key} must not change`).toBeLessThan(1);
    }

    // 2. it is spatially centred, not off to one side
    const vw = page.viewportSize()!.width;
    const centre = (s[0].l + s[0].w / 2) / vw;
    expect(centre).toBeGreaterThan(0.4);
    expect(centre).toBeLessThan(0.6);

    // 3. the reveal is an irregular two-edge contour, not a straight wipe
    expect(s[0].clip).toContain("polygon");
    const pts = (n: string) => (n.match(/-?[\d.]+%\s+-?[\d.]+%/g) || []).length;
    expect(pts(s[0].clip), "an irregular torn contour, many points").toBeGreaterThan(12);

    // 4. it progresses continuously
    expect(new Set(s.map((p) => p.clip)).size).toBeGreaterThan(5);

    // 5. CENTRE-OUT: read the horizontal extent of the clip band per frame.
    //    The left edge must move left and the right edge right, both starting
    //    near the middle - so the band is centred on ~50% throughout and only
    //    ever widens.
    const band = s.map((p) => {
      const xs = [...p.clip.matchAll(/(-?[\d.]+)%\s+-?[\d.]+%/g)].map((m) => parseFloat(m[1]));
      return { lo: Math.min(...xs), hi: Math.max(...xs) };
    });
    const first = band[0];
    const last = band[band.length - 1];
    // frame one: a small sliver at the centre of the mark
    expect(first.lo).toBeGreaterThan(40);
    expect(first.hi).toBeLessThan(60);
    expect(first.hi - first.lo).toBeLessThan(12);
    // final: cleared on both sides, so nothing stays clipped
    expect(last.lo).toBeLessThan(0);
    expect(last.hi).toBeGreaterThan(100);
    // monotonic outward growth on both edges, and always centred
    for (let i = 1; i < band.length; i += 1) {
      expect(band[i].lo).toBeLessThanOrEqual(band[i - 1].lo + 0.01);
      expect(band[i].hi).toBeGreaterThanOrEqual(band[i - 1].hi - 0.01);
      const mid = (band[i].lo + band[i].hi) / 2;
      expect(Math.abs(mid - 50), "the band stays centred on the mark").toBeLessThan(6);
    }
  });

  test("the white sun descends and the black sun rises into their loops", async ({ page }) => {
    // The sampler is anchored to the ANIMATION, not to a wall clock: it runs
    // until both suns have held still for 10 straight frames. Under parallel
    // load hydration can be slow enough that a fixed cutoff stops sampling
    // while a sun is still travelling, which would compare a mid-flight
    // position against the start. The ident is frozen for this test, so there
    // is no exit lift to contaminate the tail.
    await page.addInitScript(() => {
      type S = { t: number; wy: number; by: number };
      const store: S[] = [];
      (window as unknown as { __t: S[]; __done: boolean }).__t = store;
      (window as unknown as { __done: boolean }).__done = false;
      let still = 0;
      let moved = false;
      const tick = () => {
        const w = document.querySelector(".dao-ident__sun--white");
        const b = document.querySelector(".dao-ident__sun--black");
        if (w && b) {
          const wy = +w.getBoundingClientRect().top.toFixed(2);
          const by = +b.getBoundingClientRect().top.toFixed(2);
          const prev = store[store.length - 1];
          // both suns sit parked at their start until is-drawn lands, so
          // stillness only counts as "settled" once travel has been observed
          if (store.length && Math.abs(store[0].wy - wy) > 5) moved = true;
          still =
            prev && Math.abs(prev.wy - wy) < 0.05 && Math.abs(prev.by - by) < 0.05 ? still + 1 : 0;
          store.push({ t: Math.round(performance.now()), wy, by });
        }
        if (!(moved && still >= 10) && performance.now() < 8000) requestAnimationFrame(tick);
        else (window as unknown as { __done: boolean }).__done = true;
      };
      requestAnimationFrame(tick);
    });
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForFunction(() => (window as unknown as { __done: boolean }).__done, undefined, {
      timeout: 12_000,
    });

    const s = await page.evaluate(
      () => (window as unknown as { __t: { t: number; wy: number; by: number }[] }).__t,
    );
    expect(s.length).toBeGreaterThan(30);
    const first = s[0];
    const last = s[s.length - 1];

    // The declared travel is the deterministic half of the contract: the
    // white sun is parked a real viewport distance ABOVE its resting place
    // and the black one an equal distance BELOW it. (A sampled first frame
    // cannot carry this: under load the first rAF tick can already land part
    // way into the transition.)
    const declared = await page.evaluate(() => {
      const v = (sel: string, prop: string) =>
        getComputedStyle(document.querySelector(sel)!).getPropertyValue(prop).trim();
      return {
        fall: v(".dao-ident__sun--white", "--fall"),
        rise: v(".dao-ident__sun--black", "--rise"),
      };
    });
    expect(declared.fall, "the white sun starts above the composition").toMatch(/^[1-9][\d.]*vh$/);
    expect(declared.rise, "the black sun starts below the composition").toMatch(/^[1-9][\d.]*vh$/);

    // ... and the observed motion is a real, visible, one-way journey in the
    // right direction - not a fade, and no bounce or overshoot past the
    // resting place.
    expect(first.wy, "the white sun descends").toBeLessThan(last.wy - 40);
    expect(first.by, "the black sun rises").toBeGreaterThan(last.by + 40);
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i].wy).toBeGreaterThanOrEqual(first.wy - 0.5);
      expect(s[i].wy).toBeLessThanOrEqual(last.wy + 0.5);
      expect(s[i].by).toBeLessThanOrEqual(first.by + 0.5);
      expect(s[i].by).toBeGreaterThanOrEqual(last.by - 0.5);
    }

    // and both land inside their own serpent loop, on the official
    // composition percentages, with no transform residue left over
    const final = await page.evaluate(() => {
      const wrap = document.querySelector(".dao-ident__markwrap")!.getBoundingClientRect();
      const centre = (sel: string) => {
        const el = document.querySelector(sel)!;
        const b = el.getBoundingClientRect();
        return {
          x: ((b.left + b.width / 2 - wrap.left) / wrap.width) * 100,
          y: ((b.top + b.height / 2 - wrap.top) / wrap.height) * 100,
          w: (b.width / wrap.width) * 100,
        };
      };
      return {
        white: centre(".dao-ident__sun--white"),
        black: centre(".dao-ident__sun--black"),
      };
    });
    // measured off public/assets/brand/8th-state-logo-mark.png
    expect(final.white.x).toBeCloseTo(25.62, 0);
    expect(final.white.y).toBeCloseTo(48.5, 0);
    expect(final.black.x).toBeCloseTo(74.31, 0);
    expect(final.black.y).toBeCloseTo(51.5, 0);
    expect(final.white.w).toBeCloseTo(17.45, 0);
    expect(final.black.w).toBeCloseTo(17.45, 0);
  });

  test("nothing moves once the composition has settled", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForTimeout(1_900); // past the last sun landing (~1.46s)
    const read = () =>
      page.evaluate(() => {
        const r = (s: string) => {
          const b = document.querySelector(s)!.getBoundingClientRect();
          return [b.x, b.y, b.width, b.height].map((n) => +n.toFixed(2));
        };
        return {
          art: r(".dao-ident__serpent"),
          white: r(".dao-ident__sun--white"),
          black: r(".dao-ident__sun--black"),
          words: r(".dao-ident__words"),
          scrollW: document.documentElement.scrollWidth,
        };
      });
    const a = await read();
    await page.waitForTimeout(450);
    const b = await read();
    expect(b).toEqual(a);

    // no transform residue on any layer
    const residue = await page.evaluate(() =>
      [".dao-ident__serpent", ".dao-ident__sun--white", ".dao-ident__sun--black"].map((s) => {
        const cs = getComputedStyle(document.querySelector(s)!);
        return { s, t: cs.transform, o: cs.opacity };
      }),
    );
    // the artwork itself carries no transform at all
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(residue[0].t);
    for (const r of residue) expect(Number(r.o)).toBeGreaterThan(0.9);
    // the suns rest on their centring translate only - no travel left
    for (const r of residue.slice(1)) {
      const m = r.t.match(/matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/);
      expect(m, `${r.s} should rest on a pure translate`).not.toBeNull();
    }
  });

  test("reduced motion still resolves to the identical final composition", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForTimeout(900);
    const state = await page.evaluate(() => {
      const wrap = document.querySelector(".dao-ident__markwrap")!.getBoundingClientRect();
      const box = (s: string) => {
        const b = document.querySelector(s)!.getBoundingClientRect();
        return {
          x: +(((b.left + b.width / 2 - wrap.left) / wrap.width) * 100).toFixed(1),
          y: +(((b.top + b.height / 2 - wrap.top) / wrap.height) * 100).toFixed(1),
        };
      };
      return {
        clip: getComputedStyle(document.querySelector(".dao-ident__serpentreveal")!).clipPath,
        artOpacity: getComputedStyle(document.querySelector(".dao-ident__serpent")!).opacity,
        white: box(".dao-ident__sun--white"),
        black: box(".dao-ident__sun--black"),
      };
    });
    // the mark is never withheld: fully painted, unclipped, suns in place
    expect(state.clip).toBe("none");
    expect(Number(state.artOpacity)).toBeGreaterThan(0.9);
    expect(state.white.x).toBeCloseTo(25.6, 0);
    expect(state.black.x).toBeCloseTo(74.3, 0);
    expect(state.white.y).toBeCloseTo(48.5, 0);
    expect(state.black.y).toBeCloseTo(51.5, 0);
    await ctx.close();
  });
});

test.describe("Global navigation - celestial sun mark", () => {
  test("the serpent chip is replaced by the official celestial sun", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(600, 500);
    const mark = page.locator(".dao-chrome__mark");
    await expect(mark).toHaveCount(1);
    const cs = await mark.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        mask: s.maskImage || s.webkitMaskImage,
        w: s.width,
        h: s.height,
        gap: getComputedStyle(el.parentElement!).gap,
      };
    });
    expect(cs.mask).toContain("/assets/graphics/sun.webp");
    expect(cs.mask).not.toContain("serpent");
    // footprint: the chip keeps the serpent chip's 28px height and the 12px
    // gap to 8TH STATE
    expect(cs.h).toBe("28px");
    expect(cs.w).toBe("28px");
    expect(cs.gap).toBe("12px");
    await expect(page.locator(".dao-chrome__word")).toHaveText("8TH STATE");
  });

  test("the sun keeps the adaptive chrome colour system", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(600, 500);
    const mark = page.locator(".dao-chrome__mark");
    // over the dark showreel: paper
    await expect(page.locator(".dao-chrome")).not.toHaveClass(/dao-chrome--light/);
    await expect(mark).toHaveCSS("background-color", "rgb(242, 237, 227)");

    // over a light/paper ground the same element inverts to ink - the mark
    // rides the existing theme, it does not hard-code one colour
    await page.evaluate(() => {
      const s = document.querySelector('[data-dao-scene="light"]') as HTMLElement;
      window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().top + 8 });
    });
    await page.mouse.move(600, 500);
    await expect(page.locator(".dao-chrome")).toHaveClass(/dao-chrome--light/);
    await expect(mark).toHaveCSS("background-color", "rgb(19, 18, 16)");
  });

  test("the mark asset really loads on every route", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (r) => {
      if (/sun\.webp|celestial-sun\.webp|serpent-infinity\.webp/.test(r.url()) && r.status() >= 400)
        failed.push(`${r.status()} ${r.url()}`);
    });
    for (const route of ["/", "/work", "/services", "/studio-lab"]) {
      await gotoRoute(page, route);
      await page.mouse.move(600, 500);
      await expect(page.locator(".dao-chrome__mark")).toBeVisible();
    }
    expect(failed, failed.join(", ")).toEqual([]);
  });
});

/**
 * §15-§18: every major section boundary on every production route. The old
 * treatment painted the previous ground over the top of the next section
 * through a torn mask; the new rule is that the boundary is not drawn at all.
 * Two things are asserted: the deprecated components/classes never render,
 * and the pixels across each boundary really do go straight from material A
 * to material B with no strip of anything else in between.
 */
const ROUTES = [
  "/",
  "/work",
  "/work?category=film-video",
  "/work/aom-summer-collection",
  "/services",
  "/studio",
  "/studio-lab",
  "/process",
  "/georgia-production",
  "/contact",
  "/start-a-project",
];

test.describe("Section boundaries - no torn edges, no colour seams", () => {
  for (const route of ROUTES) {
    test(`${route} renders no deprecated torn-boundary treatment`, async ({ page }) => {
      await gotoRoute(page, route);
      for (const sel of [
        ".dao-tear",
        ".dao-cut",
        ".dwk__planetear",
        ".dpj__openingtear",
        '[class*="tear"]:not(.dao-ident):not(.dao-nav):not(.dao-veil)',
      ]) {
        await expect(page.locator(sel), `${sel} must not render on ${route}`).toHaveCount(0);
      }
      // No element inside the page content still wears the torn-edge
      // silhouette as a section boundary - pseudo-elements included, which
      // is where the old overhangs lived. The moving sheets (Studio Ident
      // exit, nav curtain, route veils) are not section boundaries and live
      // outside <main>.
      const torn = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll<HTMLElement>("main, main *").forEach((el) => {
          for (const pseudo of [null, "::before", "::after"]) {
            const cs = getComputedStyle(el, pseudo ?? undefined);
            const m = `${cs.maskImage} ${cs.webkitMaskImage}`;
            if (m.includes("torn-edge") || m.includes("torn-boundary")) {
              out.push(`${el.className || el.tagName}${pseudo ?? ""}`);
            }
          }
        });
        return out;
      });
      // the only torn masks left in page content are the physical paper
      // CARDS - a photograph pinned on a torn sheet - never a section seam
      for (const cls of torn) expect(cls, cls).toMatch(/bluepaper|work__sheet|nav__preview/);
    });
  }
});

/**
 * Every boundary that used to carry a torn treatment, by route and by the
 * element whose edge it is. "top" = the next section's leading edge (the old
 * .dao-tear / .dao-cut overlay painted the previous ground over it); "bottom"
 * = a section whose own material used to hang past its edge into the next one
 * (.dwk__planetear / .dpj__openingtear).
 */
const FORMER_TEARS: { route: string; sel: string; edge: "top" | "bottom"; was: string }[] = [
  { route: "/", sel: ".dao-work", edge: "top", was: "paper tear from the Studio act" },
  { route: "/", sel: ".dao-svc", edge: "top", was: "ink tear from Selected Work" },
  { route: "/", sel: ".dao-lab", edge: "top", was: "paper tear from Services" },
  { route: "/", sel: ".dao-contact", edge: "top", was: "green tear from the Lab" },
  { route: "/work", sel: ".dwk__plane", edge: "bottom", was: "blue plane torn overhang" },
  {
    route: "/work/aom-summer-collection",
    sel: ".dpj__opening",
    edge: "bottom",
    was: "blue opening torn overhang",
  },
  { route: "/work/aom-summer-collection", sel: ".dpj__credits", edge: "top", was: "paper cut" },
  { route: "/work/aom-summer-collection", sel: ".dpj__next", edge: "top", was: "ink cut" },
  { route: "/services", sel: ".dsv__g2", edge: "top", was: "paper cut" },
  { route: "/services", sel: ".dsv__g3", edge: "top", was: "ink cut" },
  { route: "/services", sel: ".dsv__g4", edge: "top", was: "blue cut" },
  { route: "/studio", sel: ".dst__rooms", edge: "top", was: "paper cut" },
  { route: "/studio", sel: ".dst__handoff", edge: "top", was: "inverted ink cut" },
  { route: "/studio-lab", sel: ".dlb__notes", edge: "top", was: "green cut" },
  { route: "/studio-lab", sel: ".dlb__work", edge: "top", was: "paper cut" },
  { route: "/process", sel: ".dpr__practice", edge: "top", was: "paper cut" },
  { route: "/georgia-production", sel: ".dgp__plates", edge: "top", was: "paper cut" },
  { route: "/georgia-production", sel: ".dgp__support", edge: "top", was: "ink cut" },
];

test.describe("Section boundaries - no drawn divider at the former tears", () => {
  for (const { route, sel, edge, was } of FORMER_TEARS) {
    test(`${route} ${sel} ${edge} (${was}) meets the next material directly`, async ({ page }) => {
      await gotoRoute(page, route);
      await page.waitForTimeout(300);

      const local = await page.evaluate(
        async ({ s, e }) => {
          const el = document.querySelector(s);
          if (!el) return null;
          const doc = el.getBoundingClientRect();
          const y = Math.round((e === "top" ? doc.top : doc.bottom) + window.scrollY);
          window.scrollTo({ top: Math.max(0, y - 300), behavior: "instant" });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return y - window.scrollY;
        },
        { s: sel, e: edge },
      );
      expect(local, `${sel} must exist on ${route}`).not.toBeNull();
      const at = local as number;

      const vw = page.viewportSize()!.width;
      const band = await page.screenshot({ clip: { x: 0, y: at - 22, width: vw, height: 44 } });

      // The regression this guards is a DRAWN divider: a thin horizontal strip
      // of a third material between two sections - a flat colour filler, a
      // border, a gradient or shadow seam, or a gap showing the body through.
      // Its signature is a run of rows that are near-uniform across the full
      // width AND match neither the material above nor the material below.
      // Rows crossing imagery or type are not uniform, so a photographic
      // boundary is never mistaken for a seam.
      const bad = await page.evaluate(async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const xs: number[] = [];
        for (let i = 0; i < 24; i += 1) xs.push(Math.round(((i + 0.5) / 24) * img.width));

        const rows: { y: number; mean: number[]; uniform: boolean }[] = [];
        for (let y = 0; y < img.height; y += 1) {
          const px = xs.map((x) => {
            const i = (y * img.width + x) * 4;
            return [data[i], data[i + 1], data[i + 2]];
          });
          const mean = [0, 1, 2].map((k) => px.reduce((a, p) => a + p[k], 0) / px.length);
          let spread = 0;
          for (const p of px) {
            for (const k of [0, 1, 2]) spread = Math.max(spread, Math.abs(p[k] - mean[k]));
          }
          rows.push({ y, mean, uniform: spread < 22 });
        }
        const d = (a: number[], b: number[]) =>
          Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
        const above = rows[0];
        const below = rows[rows.length - 1];
        const out: string[] = [];
        for (const row of rows) {
          if (!row.uniform) continue;
          if (d(row.mean, above.mean) > 26 && d(row.mean, below.mean) > 26) {
            out.push(`row ${row.y} rgb(${row.mean.map(Math.round).join(",")})`);
          }
        }
        return out;
      }, band.toString("base64"));

      // an antialiased edge is a row or two; a drawn divider, a filler strip
      // or an exposed body gap is thicker than that
      expect(
        bad.length,
        `divider at ${sel} ${edge} on ${route}: ${bad.slice(0, 5).join(" | ")}`,
      ).toBeLessThanOrEqual(3);
    });
  }
});
