import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Route-transition cleanup + green chrome + yellow orbit refinement.
 *
 *  §02-§04  every moving transition panel ends on a clean rectangular edge -
 *           no torn silhouette, and nothing drawn in its place
 *  §05-§06  the global chrome backing is #126149 at the production opacity
 *  §07-§08  the post-showreel section is #f0ab11 at 60% over paper stock
 *  §09-§13  a black hand-drawn ink ring replaces the dashed orbit; every
 *           orbiting glyph and label is black, minimal and unboxed
 *  §14      PRJ-01 - 24 FPS is gone
 */

const INK = "rgb(19, 18, 16)";
const PAPER = "rgb(242, 237, 227)";
const WASH = "rgba(240, 171, 17, 0.6)";
const GREEN_BACKING = "rgba(18, 97, 73";
const RED_BACKING = "rgba(208, 62, 38";

/** Park the yellow section under the viewport and let its lerp settle. */
async function toIntro(page: Page, offset = 90) {
  await page.evaluate((off) => {
    const s = document.querySelector(".dao-intro")!;
    window.scrollTo({
      top: window.scrollY + s.getBoundingClientRect().top + off,
      behavior: "instant",
    });
  }, offset);
  await page.waitForTimeout(900);
}

/**
 * Keep a moving sheet on screen long enough to inspect it, by swallowing the
 * one timer that unmounts it. These are deliberately separate: freezing the
 * ident (2450) as well would leave it covering the chrome forever whenever a
 * pre-hydration skip keypress is lost, and every click after that would time
 * out on a covered target.
 */
const holdVeil = (page: Page) => freezeTimer(page, 1000); // PageVeil unmount
const holdIdent = (page: Page) => freezeTimer(page, 2450); // ident auto-leave

async function freezeTimer(page: Page, blocked: number) {
  await page.addInitScript((ms0) => {
    const orig = window.setTimeout;
    type ST = (h: TimerHandler, ms?: number, ...rest: unknown[]) => number;
    (window as unknown as { setTimeout: ST }).setTimeout = (h, ms, ...rest) =>
      ms === ms0 ? 0 : (orig as unknown as ST).call(window, h, ms, ...rest);
  }, blocked);
}

/**
 * The contract for "clean straight horizontal edge": the torn silhouette was
 * a masked band hanging off the panel as a pseudo-element, so the panel must
 * carry no such band and must not itself be masked, clipped or rounded - and
 * §04 forbids replacing it with a border, shadow or divider.
 */
async function expectRectangularPanel(page: Page, sel: string) {
  const s = await page.evaluate((q) => {
    const el = document.querySelector(q)!;
    const own = getComputedStyle(el);
    const pseudo = (p: string) => {
      const cs = getComputedStyle(el, p);
      return {
        content: cs.content,
        mask: cs.maskImage || (cs as unknown as { webkitMaskImage: string }).webkitMaskImage,
      };
    };
    return {
      after: pseudo("::after"),
      before: pseudo("::before"),
      mask: own.maskImage || (own as unknown as { webkitMaskImage: string }).webkitMaskImage,
      clip: own.clipPath,
      radius: own.borderRadius,
      borderWidth: [
        own.borderTopWidth,
        own.borderRightWidth,
        own.borderBottomWidth,
        own.borderLeftWidth,
      ],
      shadow: own.boxShadow,
    };
  }, sel);

  // the torn band is gone, in both pseudo slots
  expect(s.after.mask, `${sel}::after must carry no mask`).toBe("none");
  expect(s.after.content, `${sel} must have no ::after band`).toBe("none");
  expect(s.before.mask, `${sel}::before must carry no mask`).toBe("none");
  // the panel itself is a plain rectangle
  expect(s.mask, `${sel} must not be masked`).toBe("none");
  expect(s.clip, `${sel} must not be clipped`).toBe("none");
  expect(s.radius, `${sel} must have square corners`).toBe("0px");
  // §04: and no visible divider replaced it
  for (const bw of s.borderWidth) expect(bw, `${sel} must have no border`).toBe("0px");
  expect(s.shadow, `${sel} must cast no shadow`).toBe("none");
}

test.describe("Route transitions - clean rectangular panels", () => {
  test("the route veil lifts on a straight edge and keeps its choreography", async ({ page }) => {
    await holdVeil(page);
    await gotoRoute(page, "/");
    await page.mouse.move(600, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    // let the sheet's masked row-rise settle before clicking, and give the
    // veil room to mount - both are animated, and a loaded machine is slow
    await expect(page.getByRole("dialog")).toBeVisible();
    const workLink = page.getByRole("dialog").getByRole("link", { name: "WORK" }).first();
    await expect(workLink).toBeVisible();
    await workLink.click();
    const veil = page.locator(".dao-veil");
    await veil.waitFor({ state: "attached", timeout: 15_000 });
    await expectRectangularPanel(page, ".dao-veil");

    // the motion itself is untouched: still lifts upward over 820ms SCENE
    await expect(veil).toHaveClass(/is-lifting/, { timeout: 4000 });
    const motion = await veil.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { dur: cs.transitionDuration, prop: cs.transitionProperty, t: cs.transform };
    });
    expect(motion.dur).toContain("0.82s");
    expect(motion.prop).toContain("transform");
    expect(motion.t).not.toBe("none");
  });

  test("the navigation curtain has no torn leading edge", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(600, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectRectangularPanel(page, ".dao-nav");
    // the curtain still travels (open/close choreography preserved)
    const dur = await page
      .locator(".dao-nav")
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(dur).toContain("0.52s");
  });

  test("the Studio Ident sheet has no torn trailing edge", async ({ page }) => {
    await holdIdent(page);
    await page.goto("/");
    await expect(page.locator(".dao-ident")).toBeVisible();
    await expectRectangularPanel(page, ".dao-ident");
    // the exit is still the same 1050ms lift
    const cs = await page
      .locator(".dao-ident")
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(cs).toContain("1.05s");
  });

  test("no moving panel references the torn-edge silhouette any more", async ({ page }) => {
    await holdVeil(page);
    await gotoRoute(page, "/work");
    const torn = await page.evaluate(() => {
      const out: string[] = [];
      for (const sel of [".dao-veil", ".dao-nav", ".dao-ident"]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        for (const p of [null, "::before", "::after"]) {
          const cs = getComputedStyle(el, p ?? undefined);
          const m = `${cs.maskImage} ${(cs as unknown as { webkitMaskImage: string }).webkitMaskImage}`;
          if (m.includes("torn-edge") || m.includes("torn-boundary")) out.push(sel + (p ?? ""));
        }
      }
      return out;
    });
    expect(torn, torn.join(", ")).toEqual([]);
  });
});

test.describe("Global chrome backing", () => {
  test("the translucent field is the brand green, not the brand red", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(700, 46);
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(document.querySelector(".dao-chrome")!, "::before");
      return { bg: s.backgroundImage, h: s.height, blur: s.backdropFilter, shadow: s.boxShadow };
    });
    expect(cs.bg).toContain(GREEN_BACKING);
    expect(cs.bg).not.toContain(RED_BACKING);
    // §05: opacity stops, height, and the absence of blur/shadow are unchanged
    expect(cs.bg).toContain("0.32");
    expect(cs.bg).toContain("0.18");
    expect(cs.h).toBe("118px");
    expect(["none", ""]).toContain(cs.blur);
    expect(cs.shadow).toBe("none");
  });

  test("the backing keeps the idle fade choreography", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.mouse.move(500, 500);
    const opacity = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector(".dao-chrome")!, "::before").opacity,
      );
    await expect.poll(opacity).toBe("1");
    await page.waitForTimeout(2_300);
    await expect(page.locator("html")).toHaveAttribute("data-dao-idle", "");
    await expect.poll(opacity, { timeout: 4_000 }).toBe("0");
    await page.mouse.move(520, 520);
    await expect(page.locator("html")).not.toHaveAttribute("data-dao-idle", "");
    await expect.poll(opacity, { timeout: 4_000 }).toBe("1");
  });

  test("the backing reads on every ground the chrome crosses", async ({ page }) => {
    for (const [route, sel] of [
      ["/", null],
      ["/", ".dao-intro"],
      ["/", ".dao-work"],
      ["/work", null],
      ["/studio-lab", null],
      ["/services", null],
    ] as const) {
      await gotoRoute(page, route);
      if (sel)
        await page.evaluate((q) => {
          const el = document.querySelector(q)!;
          window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top + 8 });
        }, sel);
      await page.mouse.move(700, 46);
      const bg = await page.evaluate(
        () => getComputedStyle(document.querySelector(".dao-chrome")!, "::before").backgroundImage,
      );
      expect(bg, `${route} ${sel ?? ""}`).toContain(GREEN_BACKING);
    }
  });
});

test.describe("Post-showreel section - yellow stock and the ink orbit", () => {
  test("the ground is the approved yellow at 60% over the paper stock", async ({ page }) => {
    await gotoRoute(page, "/");
    await toIntro(page);
    const sec = page.locator(".dao-intro");
    const cs = await sec.evaluate((el) => {
      const s = getComputedStyle(el);
      return { img: s.backgroundImage, color: s.backgroundColor, opacity: s.opacity };
    });
    // a wash LAYER over the paper ground ...
    expect(cs.img).toContain(WASH);
    expect(cs.color).toBe(PAPER);
    // ... never a parent opacity, which would fade the type and the ink
    expect(cs.opacity).toBe("1");

    // §08: the paper material survives on top of the wash
    const grain = await sec
      .locator(".dao-grain")
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { img: s.backgroundImage, blend: s.mixBlendMode, op: s.opacity };
      });
    expect(grain.img).toContain("paper-grain");
    expect(grain.blend).toBe("multiply");
    expect(Number(grain.op)).toBeGreaterThan(0);

    // and the content on it is not faded by the wash: the type is fully
    // opaque, and the central mark keeps its own approved printed treatment
    // (0.94 + multiply, untouched by this pass)
    await expect(page.locator(".dao-intro__statement")).toHaveCSS("opacity", "1");
    await expect(page.locator(".dao-intro__cta")).toHaveCSS("opacity", "1");
    await expect(page.locator(".dao-intro__logomark")).toHaveCSS("opacity", "0.94");
  });

  test("the dashed orbit is gone, replaced by a black ink ring", async ({ page }) => {
    await gotoRoute(page, "/");
    await toIntro(page);

    // no dashed/dotted circle anywhere in the section any more
    const dashed = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll(".dao-intro *").forEach((el) => {
        const s = getComputedStyle(el);
        if (["dashed", "dotted"].includes(s.borderTopStyle) && parseFloat(s.borderTopWidth) > 0)
          out.push(el.className.toString());
      });
      return out;
    });
    expect(dashed, dashed.join(", ")).toEqual([]);

    const ring = page.locator(".dao-intro__ring");
    await expect(ring).toHaveCount(1);
    const cs = await ring.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        mask: s.maskImage || (s as unknown as { webkitMaskImage: string }).webkitMaskImage,
        bg: s.backgroundColor,
        borderWidth: s.borderTopWidth,
        square: Math.abs(r.width - r.height) < 2,
        w: r.width,
      };
    });
    // a hand-drawn vector gesture, painted with the ink token (§10)
    expect(cs.mask).toContain("ink-ring.svg");
    expect(cs.bg).toBe(INK);
    expect(cs.borderWidth).toBe("0px");
    expect(cs.square, "the ring stays circular").toBe(true);
    expect(cs.w).toBeGreaterThan(200);
  });

  test("every orbiting glyph and label is black and minimal", async ({ page }) => {
    await gotoRoute(page, "/");
    await toIntro(page);

    // §11: all decorative orbital glyphs use the ink token
    const glyphs = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-intro__orbit .dao-mask")].map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(glyphs.length).toBeGreaterThan(4);
    for (const bg of glyphs) expect(bg).toBe(INK);

    // §12/§13: the labels are plain black text - no chip, fill, pad or shadow
    const labels = page.locator(".dao-intro__chip");
    await expect(labels).not.toHaveCount(0);
    const n = await labels.count();
    for (let i = 0; i < n; i += 1) {
      const cs = await labels.nth(i).evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          bgImg: s.backgroundImage,
          color: s.color,
          shadow: s.boxShadow,
          pad: s.padding,
          weight: s.fontWeight,
          transform: s.textTransform,
          tracking: s.letterSpacing,
          size: s.fontSize,
        };
      });
      expect(cs.bg).toBe("rgba(0, 0, 0, 0)");
      expect(cs.bgImg).toBe("none");
      expect(cs.color).toBe(INK);
      expect(cs.shadow).toBe("none");
      expect(cs.pad).toBe("0px");
      // §13: a real heavier face - was 500
      expect(Number(cs.weight)).toBeGreaterThanOrEqual(600);
      // tracking and case preserved
      expect(parseFloat(cs.tracking) / parseFloat(cs.size)).toBeCloseTo(0.26, 2);
    }
    // the three service names are all present as plain text
    const text = await page.locator(".dao-intro").innerText();
    for (const label of ["FILM & VIDEO", "PHOTOGRAPHY", "STUDIO LAB"]) {
      expect(text.toUpperCase()).toContain(label);
    }
  });

  test("PRJ-01 - 24 FPS is gone from the section", async ({ page }) => {
    await gotoRoute(page, "/");
    await toIntro(page);
    await expect(page.locator(".dao-intro")).not.toContainText("24 FPS");
    await expect(page.locator(".dao-intro")).not.toContainText("PRJ-01");
    // the remaining production code (the year) joins the black system
    const codes = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-intro__code")].map((el) => ({
        t: el.textContent?.trim(),
        c: getComputedStyle(el).color,
      })),
    );
    for (const c of codes) {
      expect(c.t).not.toMatch(/FPS|PRJ/);
      expect(c.c).toBe(INK);
    }
  });

  test("the ring never crosses the copy on any mobile width", async ({ browser }) => {
    for (const [w, h] of [
      [430, 932],
      [390, 844],
      [375, 812],
      [360, 780],
      [320, 700],
    ] as const) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        isMobile: true,
        hasTouch: true,
        extraHTTPHeaders: { "x-dao-hard-load": "allow" },
      });
      const page = await ctx.newPage();
      await gotoRoute(page, "/");
      await toIntro(page, 0);
      const res = await page.evaluate(() => {
        const sec = document.querySelector(".dao-intro")!.getBoundingClientRect();
        const copy = document.querySelector(".dao-intro__center")!.getBoundingClientRect();
        const rings = [...document.querySelectorAll(".dao-intro__ring--m")];
        const hits: string[] = [];
        for (const el of rings) {
          const cs = getComputedStyle(el);
          if (cs.display === "none") continue;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          // the stroke sits at 486/500 of the box half-width (see the generator)
          const rad = (r.width / 2) * (486 / 500);
          for (let deg = 0; deg < 360; deg += 0.5) {
            const t = (deg * Math.PI) / 180;
            const x = cx + Math.cos(t) * rad;
            const y = cy + Math.sin(t) * rad;
            if (y < sec.top || y > sec.bottom) continue; // clipped away
            if (x > copy.left && x < copy.right && y > copy.top && y < copy.bottom)
              hits.push(`${Math.round(x)},${Math.round(y)}`);
          }
        }
        return {
          rings: rings.length,
          masked: rings.every((el) => {
            const cs = getComputedStyle(el);
            const m =
              cs.maskImage || (cs as unknown as { webkitMaskImage: string }).webkitMaskImage;
            return m.includes("ink-ring.svg");
          }),
          inked: rings.every((el) => getComputedStyle(el).backgroundColor === "rgb(19, 18, 16)"),
          hits: hits.slice(0, 3),
        };
      });
      expect(res.rings, `${w}px constellation rings`).toBe(2);
      expect(res.masked, `${w}px rings use the ink-ring vector`).toBe(true);
      expect(res.inked, `${w}px rings are black`).toBe(true);
      expect(res.hits, `${w}px: the ring must not cross the statement`).toEqual([]);
      await ctx.close();
    }
  });

  test("reduced motion keeps the yellow ground and the ink ring", async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      extraHTTPHeaders: { "x-dao-hard-load": "allow" },
    });
    const page = await ctx.newPage();
    await gotoRoute(page, "/");
    await toIntro(page);
    await expect(page.locator(".dao-intro")).toHaveCSS("opacity", "1");
    const cs = await page
      .locator(".dao-intro")
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(cs).toContain(WASH);
    const ring = await page.locator(".dao-intro__ring").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        mask: s.maskImage || (s as unknown as { webkitMaskImage: string }).webkitMaskImage,
        bg: s.backgroundColor,
      };
    });
    expect(ring.mask).toContain("ink-ring.svg");
    expect(ring.bg).toBe(INK);
    await ctx.close();
  });
});
