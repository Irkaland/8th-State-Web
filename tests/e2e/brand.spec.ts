import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Brand system pass - Studio Ident, the global celestial navigation mark and
 * the global removal of torn section boundaries.
 *
 *  §02-§04  the ident is the official lockup on the approved intro green
 *  §05-§09  the serpent is DRAWN along its own body, tail to head, while the
 *           white sun descends and the black sun rises into their loops
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
      const white = getComputedStyle(q(".dao-ident__sun--white"));
      const black = getComputedStyle(q(".dao-ident__sun--black"));
      return {
        // the serpent is an SVG <image> of the authentic artwork, revealed
        // through the generated draw mask
        serpentArt: document.querySelector(".dao-ident__serpent")!.getAttribute("href") ?? "",
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

  test("the serpent is drawn along its own body from the tail to the head", async ({ page }) => {
    // The reveal is a stroke-dashoffset animation over a mask path that runs
    // along the serpent's own centreline. That makes the contract directly
    // measurable: getPointAtLength on the mask path tells us exactly where the
    // reveal front is, in artwork coordinates, at any moment.
    await holdIdent(page);
    await page.addInitScript(() => {
      type S = { t: number; off: number; front: [number, number]; box: number[] };
      const store: S[] = [];
      (window as unknown as { __d: S[] }).__d = store;
      (window as unknown as { __done: boolean }).__done = false;
      let still = 0;
      let moved = false;
      const tick = () => {
        const ink = document.querySelector(".dao-ident__serpentink") as SVGPathElement | null;
        const svg = document.querySelector(".dao-ident__serpentdraw");
        if (ink && svg) {
          const len = ink.getTotalLength();
          const off = parseFloat(getComputedStyle(ink).strokeDashoffset) || 0;
          const drawn = Math.max(0, Math.min(len, len - off));
          const p = ink.getPointAtLength(drawn);
          const r = svg.getBoundingClientRect();
          const prev = store[store.length - 1];
          if (prev && Math.abs(prev.off - off) > 0.5) moved = true;
          still = prev && Math.abs(prev.off - off) < 0.01 ? still + 1 : 0;
          store.push({
            t: Math.round(performance.now()),
            off,
            front: [+p.x.toFixed(1), +p.y.toFixed(1)],
            box: [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(2)),
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
            __d: { t: number; off: number; front: [number, number]; box: number[] }[];
          }
        ).__d,
    );
    expect(s.length).toBeGreaterThan(30);

    // 1. it starts hidden: the dash is parked off the path, nothing painted
    expect(s[0].off, "frame one must be fully masked").toBeGreaterThan(0);
    const len = await page
      .locator(".dao-ident__serpentink")
      .evaluate((el) => (el as unknown as SVGPathElement).getTotalLength());
    expect(s[0].off).toBeGreaterThanOrEqual(len - 1);

    // 2. ONE direction only: the offset never rises, so the reveal front never
    //    retreats and never restarts
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i].off, `offset must only fall (frame ${i})`).toBeLessThanOrEqual(
        s[i - 1].off + 0.01,
      );
    }

    // 3. it ends fully open - no mask left over the finished mark
    expect(s.at(-1)!.off).toBe(0);

    // 4. the artwork NEVER moves: same box on every sampled frame
    for (const key of [0, 1, 2, 3]) {
      const vs = s.map((f) => f.box[key]);
      expect(Math.max(...vs) - Math.min(...vs), "the mark must not move or resize").toBeLessThan(
        0.5,
      );
    }

    // 5. the reveal front walks the body TAIL -> HEAD, in artwork
    //    coordinates (viewBox 1120x544). Regions rather than points, because
    //    the mask path deliberately overshoots each tip by half a stroke so
    //    the butt-capped dash still closes the tail point and the snout.
    //      tail  x 540-820, y 320-544   lower middle-right, with the scratches
    //      head  x 380-560, y 30-220    the snout, upper middle-left
    const inTail = (f: [number, number]) => f[0] > 540 && f[0] < 820 && f[1] > 320 && f[1] <= 544;
    const inHead = (f: [number, number]) => f[0] > 380 && f[0] < 560 && f[1] > 30 && f[1] < 220;
    expect(inTail(s[0].front), `starts at the tail, got ${s[0].front}`).toBe(true);
    expect(inHead(s.at(-1)!.front), `ends at the snout, got ${s.at(-1)!.front}`).toBe(true);

    // 6. the head is LAST: the front only enters the head region in the final
    //    stretch of the animation, never early
    const firstHead = s.findIndex((f) => inHead(f.front));
    expect(firstHead, "the front must reach the head").toBeGreaterThan(-1);
    expect(firstHead / s.length, "the head must not appear early").toBeGreaterThan(0.6);
    // ... and nothing in the head region is drawn before that
    expect(s.slice(0, firstHead).some((f) => inHead(f.front))).toBe(false);

    // 7. and it is a body-following draw, not a wipe: the front's x coordinate
    //    is NOT monotonic (it travels right, then left across the crossing,
    //    then right again as it rounds the loops), while its arc progress is
    const xs = s.map((f) => f.front[0]);
    const monotoneX =
      xs.every((v, i) => i === 0 || v >= xs[i - 1]) ||
      xs.every((v, i) => i === 0 || v <= xs[i - 1]);
    expect(monotoneX, "a horizontal wipe would move the front in one x direction").toBe(false);
  });

  test("the finished mark is the approved static composition", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await page.waitForTimeout(2_000); // past the 1600ms draw

    const s = await page.evaluate(() => {
      const svg = document.querySelector(".dao-ident__serpentdraw")!;
      const ink = document.querySelector(".dao-ident__serpentink")!;
      const img = document.querySelector(".dao-ident__serpent")!;
      const wrap = document.querySelector(".dao-ident__markwrap")!;
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(2));
      };
      return {
        offset: getComputedStyle(ink).strokeDashoffset,
        imgTransform: getComputedStyle(img).transform,
        svgTransform: getComputedStyle(svg).transform,
        svgOpacity: getComputedStyle(svg).opacity,
        imgOpacity: getComputedStyle(img).opacity,
        clip: getComputedStyle(svg).clipPath,
        href: img.getAttribute("href"),
        maskAttr: img.getAttribute("mask"),
        svgBox: box(svg),
        wrapBox: box(wrap),
      };
    });
    // the mask is fully open, so the silhouette is the artwork's own
    expect(s.offset).toBe("0px");
    // no residue of any kind
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(s.imgTransform);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(s.svgTransform);
    expect(s.svgOpacity).toBe("1");
    expect(s.imgOpacity).toBe("1");
    expect(s.clip).toBe("none");
    // still the authentic artwork, still masked by the generated path
    expect(s.href).toContain("serpent-infinity.webp");
    expect(s.maskAttr).toContain("dao-ident-serpent-draw");
    // and it fills the approved mark box exactly
    expect(s.svgBox).toEqual(s.wrapBox);

    // nothing shifts afterwards
    await page.waitForTimeout(450);
    const again = await page.evaluate(() => {
      const r = document.querySelector(".dao-ident__serpentdraw")!.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(2));
    });
    expect(again).toEqual(s.svgBox);
  });

  test("the reveal stroke itself is never visible", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    const guide = await page.evaluate(() => {
      const ink = document.querySelector(".dao-ident__serpentink")!;
      return {
        insideMask: ink.closest("mask") !== null,
        // a stroke inside a <mask> contributes alpha, never paint
        strokeColour: getComputedStyle(ink).stroke,
        fill: getComputedStyle(ink).fill,
        // no stray copy of the path outside the mask
        pathsOutsideMask: [...document.querySelectorAll(".dao-ident svg path")].filter(
          (p) => p.closest("mask") === null,
        ).length,
      };
    });
    expect(guide.insideMask, "the draw path must live inside a <mask>").toBe(true);
    expect(guide.pathsOutsideMask, "no guide path may be rendered").toBe(0);
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
      const ink = document.querySelector(".dao-ident__serpentink")!;
      return {
        // §21: the tail-to-head draw is skipped entirely and the mask is held
        // wide open, so the whole mark simply fades in
        drawAnimation: getComputedStyle(ink).animationName,
        dashoffset: getComputedStyle(ink).strokeDashoffset,
        drawOpacity: getComputedStyle(document.querySelector(".dao-ident__serpentdraw")!).opacity,
        artOpacity: getComputedStyle(document.querySelector(".dao-ident__serpent")!).opacity,
        white: box(".dao-ident__sun--white"),
        black: box(".dao-ident__sun--black"),
      };
    });
    // the mark is never withheld: fully painted, unmasked, suns in place
    expect(state.drawAnimation).toBe("none");
    expect(state.dashoffset).toBe("0px");
    expect(Number(state.drawOpacity)).toBeGreaterThan(0.9);
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
