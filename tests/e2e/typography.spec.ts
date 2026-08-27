import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Global brand typography + UI polish pass.
 *
 *  §01  the cinematic ACT chapter system no longer renders anywhere
 *  §02  Latin: Adevas display / strong Optika editorial / readable Optika copy
 *  §03  Georgian resolves to its own stack, independent of the Latin one
 *  §04  the burger navigation is Glacier (Latin) / ALK Sanet (Georgian)
 *  §06  media frames have clean straight geometry and are slightly thinner
 *  §07  the Selected Work act is #d03e26 printed stock
 *  §08  its frames are black
 *  §09-§12  text-only route CTAs carry the brand's decorative stroke
 *
 * Font families are asserted on the FIRST family in the computed stack, which
 * is the face actually chosen; the tail of each stack is the approved
 * fallback chain and is deliberately not asserted.
 */

/** first family in a computed font-family stack, unquoted and lowercased */
const first = (stack: string) => stack.split(",")[0].replace(/["']/g, "").trim().toLowerCase();

async function famOf(page: Page, sel: string) {
  return first(
    await page
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily),
  );
}

test.describe("Typography system - Latin", () => {
  test("major display headings resolve to Adevas", async ({ page }) => {
    await gotoRoute(page, "/");
    // the brief's own examples, plus their equivalents on other routes
    for (const sel of [".dao-work__title", ".dao-svc__title", ".dao-lab__title"]) {
      expect(await famOf(page, sel), `${sel} must be the display face`).toContain("adevas");
    }
    // role, not size: these are deliberately NOT the same physical size
    const sizes = await page.evaluate(() =>
      [".dao-work__title", ".dao-lab__title"].map((s) =>
        parseFloat(getComputedStyle(document.querySelector(s)!).fontSize),
      ),
    );
    expect(sizes[0]).not.toBeCloseTo(sizes[1], 0);

    for (const [route, sel] of [
      ["/work", ".dwk__title"],
      ["/studio-lab", ".dlb__title"],
      ["/start-a-project", ".dbr__title"],
      ["/contact", ".dct__title"],
    ] as const) {
      await gotoRoute(page, route);
      expect(await famOf(page, sel), `${route} ${sel}`).toContain("adevas");
    }
  });

  test("medium editorial copy is strong Optika, not the display face", async ({ page }) => {
    await gotoRoute(page, "/");
    const st = await page.locator(".dao-intro__statement").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { fam: cs.fontFamily, weight: cs.fontWeight, text: el.textContent?.trim() ?? "" };
    });
    // the brief's example statement
    expect(st.text).toContain("multidisciplinary production company");
    expect(first(st.fam)).toContain("optika");
    expect(Number(st.weight), "must read as bold/strong Optika").toBeGreaterThanOrEqual(600);

    for (const [route, sel] of [
      ["/services", ".dsv__intro"],
      ["/studio", ".dst__statement"],
      ["/process", ".dpr__practicetext"],
    ] as const) {
      await gotoRoute(page, route);
      const cs = await page
        .locator(sel)
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return { fam: s.fontFamily, w: s.fontWeight };
        });
      expect(first(cs.fam), `${route} ${sel}`).toContain("optika");
      expect(Number(cs.w), `${route} ${sel} weight`).toBeGreaterThanOrEqual(600);
    }
  });

  test("small copy is Optika at a readable weight, never hairline", async ({ page }) => {
    await gotoRoute(page, "/");
    const cs = await page
      .locator(".dao-label")
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { fam: s.fontFamily, w: s.fontWeight };
      });
    expect(first(cs.fam)).toContain("optika");
    // Optika ships 400/500/600 - small copy sits at 500, not 300 or lighter
    expect(Number(cs.w)).toBeGreaterThanOrEqual(500);
  });
});

test.describe("Typography system - Georgian", () => {
  test("Georgian resolves to its own stack, independent of Latin", async ({ page }) => {
    await gotoRoute(page, "/ka");
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
    // the Georgian document must NOT use the Latin display face
    const display = await famOf(page, ".dao-work__title");
    expect(display, "Georgian display must not fall back to Adevas").not.toContain("adevas");
    // ... and it must be a real brand Georgian face, never a system font
    expect(display).toMatch(/sanet|agrotesk/);

    const editorial = await famOf(page, ".dao-intro__statement");
    expect(editorial).toMatch(/sanet|agrotesk|neobau/);
    expect(editorial).not.toMatch(/arial|helvetica|times|serif$|sans-serif$/);
  });

  test("EN and KA resolve to different display faces", async ({ page }) => {
    await gotoRoute(page, "/");
    const en = await famOf(page, ".dao-work__title");
    await gotoRoute(page, "/ka");
    const ka = await famOf(page, ".dao-work__title");
    expect(en).not.toBe(ka);
  });
});

test.describe("Burger navigation typography", () => {
  async function openMenu(page: Page) {
    await page.mouse.move(600, 400);
    await page.getByRole("button", { name: /open menu|მენიუ/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }

  test("English navigation labels are Glacier, not Adevas", async ({ page }) => {
    await gotoRoute(page, "/");
    await openMenu(page);
    const fam = await famOf(page, ".dao-nav__link");
    expect(fam).toContain("glacier");
    expect(fam).not.toContain("adevas");
  });

  test("Georgian navigation labels are ALK Sanet", async ({ page }) => {
    await gotoRoute(page, "/ka");
    await openMenu(page);
    const fam = await famOf(page, ".dao-nav__link");
    expect(fam).toContain("sanet");
    expect(fam).not.toContain("adevas");
  });

  test("the 01-08 numbering is untouched in both locales", async ({ page }) => {
    for (const route of ["/", "/ka"]) {
      await gotoRoute(page, route);
      await openMenu(page);
      const nums = await page.evaluate(() =>
        [...document.querySelectorAll(".dao-nav__num")].map((n) => n.textContent?.trim()),
      );
      for (const n of ["01", "02", "03", "04", "05", "06", "07", "08"]) {
        expect(nums, `${route} keeps ${n}`).toContain(n);
      }
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("ACT storytelling system removed", () => {
  const ROUTES = [
    "/",
    "/work",
    "/work/aom-summer-collection",
    "/services",
    "/studio",
    "/studio-lab",
    "/process",
    "/georgia-production",
    "/contact",
    "/start-a-project",
  ];

  for (const route of ROUTES) {
    test(`${route} renders no ACT chapter marker`, async ({ page }) => {
      for (const loc of ["", "/ka"]) {
        await gotoRoute(page, `${loc}${route === "/" ? "/" : route}`);
        const text = await page.locator("body").innerText();
        // English and Georgian chapter markers alike
        expect(text, `${loc}${route} EN marker`).not.toMatch(/\bACT\s*0\d\b/i);
        expect(text, `${loc}${route} KA marker`).not.toMatch(/აქტი\s*0\d/);
        // and the wrappers they lived in are gone, not just emptied
        await expect(
          page.locator(".dao-contact__label, .dao-lab__label, .dao-intro__corner"),
        ).toHaveCount(0);
      }
    });
  }

  test("section landmarks keep an accessible name", async ({ page }) => {
    await gotoRoute(page, "/");
    // removing the visible marker must not leave the sections unnamed
    const names = await page.evaluate(() =>
      [...document.querySelectorAll("main section[aria-label]")].map((s) =>
        s.getAttribute("aria-label"),
      ),
    );
    expect(names.length).toBeGreaterThan(2);
    for (const n of names) {
      expect(n, "accessible names must survive").toBeTruthy();
      expect(n, "but without the chapter prefix").not.toMatch(/^Act\s*0\d/i);
    }
  });
});

test.describe("Selected Work - red stock and black frames", () => {
  test("the section ground is #d03e26 printed stock", async ({ page }) => {
    await gotoRoute(page, "/");
    const sec = page.locator(".dao-work");
    await expect(sec).toHaveCSS("background-color", "rgb(208, 62, 38)");
    // and it is material, not a flat digital fill: the act keeps a texture
    // overlay of its own rather than a separate transparent strip
    const overlay = await sec
      .locator(".dao-weave, .dao-grain, .dao-grain--strong")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { img: cs.backgroundImage, blend: cs.mixBlendMode, op: cs.opacity };
      });
    expect(overlay.img).toMatch(/canvas-weave|paper-grain/);
    expect(Number(overlay.op)).toBeGreaterThan(0);
  });

  test("the project frame is black with clean straight geometry", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.locator(".dao-work__stage").scrollIntoViewIfNeeded();
    const f = await page
      .locator(".dao-work__sheet")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        const after = getComputedStyle(el, "::after");
        return {
          bg: cs.backgroundColor,
          radius: cs.borderRadius,
          mask: cs.maskImage || (cs as unknown as { webkitMaskImage: string }).webkitMaskImage,
          clip: cs.clipPath,
          afterContent: after.content,
          afterMask:
            after.maskImage || (after as unknown as { webkitMaskImage: string }).webkitMaskImage,
          inset: [cs.left, cs.top, cs.right, cs.bottom].map((v) => Math.abs(parseFloat(v))),
        };
      });
    // §08 black
    expect(f.bg).toBe("rgb(0, 0, 0)");
    // §06 clean straight geometry: no torn band, no mask, no clip, square
    expect(f.afterMask, "the torn lower termination must be gone").toBe("none");
    expect(f.afterContent).toBe("none");
    expect(f.mask).toBe("none");
    expect(f.clip).toBe("none");
    expect(f.radius).toBe("0px");
    // §06 thinner than before (was 28/26/24) but still an intentional frame
    for (const v of f.inset) {
      expect(v).toBeLessThan(24);
      expect(v).toBeGreaterThan(6);
    }
  });

  test("no media frame anywhere still wears a torn edge", async ({ page }) => {
    for (const route of ["/", "/work", "/work/aom-summer-collection", "/services", "/studio-lab"]) {
      await gotoRoute(page, route);
      const torn = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll("main *").forEach((el) => {
          for (const p of [null, "::before", "::after"]) {
            const cs = getComputedStyle(el, p ?? undefined);
            const m = `${cs.maskImage} ${(cs as unknown as { webkitMaskImage: string }).webkitMaskImage}`;
            if (m.includes("torn-edge")) out.push(`${el.className || el.tagName}${p ?? ""}`);
          }
        });
        return out;
      });
      expect(torn, `${route}: ${torn.join(", ")}`).toEqual([]);
    }
  });
});

test.describe("Decorative text-link stroke", () => {
  test("a text-only route CTA carries the brand stroke, collapsed by default", async ({ page }) => {
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    await cta.scrollIntoViewIfNeeded();
    const s = await cta.evaluate((el) => {
      const a = getComputedStyle(el, "::after");
      return {
        mask: a.maskImage || (a as unknown as { webkitMaskImage: string }).webkitMaskImage,
        clip: a.clipPath,
        bg: a.backgroundColor,
        pe: a.pointerEvents,
      };
    });
    // the official hand-drawn rule, not a border-bottom
    expect(s.mask).toContain("pencil-rule-h");
    // collapsed until hover
    expect(s.clip).toContain("100%");
    // never eats the click target
    expect(s.pe).toBe("none");
    await expect(cta).toHaveCSS("border-bottom-width", "0px");
  });

  test("hover reveals it left to right and leaving retracts it", async ({ page }) => {
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    await cta.scrollIntoViewIfNeeded();
    const clip = () => cta.evaluate((el) => getComputedStyle(el, "::after").clipPath);
    const box = await cta.boundingBox();

    // clip-path is inset(top right bottom left): the stroke is exposed by the
    // RIGHT inset falling from 100% to 0 while the LEFT inset stays pinned at
    // 0, so it grows from the left edge. Sample through the reveal and check
    // both halves of that claim.
    const insets = async () => {
      const raw = await clip();
      const m = raw.match(/inset\(([^)]*)\)/);
      const parts = (m ? m[1] : "").trim().split(/\s+/);
      return {
        right: parts.length >= 2 ? parts[1] : "0px",
        left: parts.length >= 4 ? parts[3] : "0px",
      };
    };
    expect((await insets()).right).toBe("100%");

    // Sampled INSIDE the page on rAF rather than over 14 CDP round-trips. The
    // transition is 340ms and under parallel load the round-trips alone can
    // outlast it, so an out-of-page sampler reads an already-finished animation
    // and "it animates rather than snapping" fails for a reason that has
    // nothing to do with the CSS. The recorder is armed FIRST and left running
    // (CSS :hover only responds to a real pointer, so the hover has to be the
    // genuine one), then the samples are collected afterwards.
    await cta.evaluate((el) => {
      const w = window as unknown as { __clipSamples?: { right: string; left: string }[] };
      w.__clipSamples = [];
      const t0 = performance.now();
      const tick = () => {
        const raw = getComputedStyle(el, "::after").clipPath;
        const m = raw.match(/inset\(([^)]*)\)/);
        const parts = (m ? m[1] : "").trim().split(/\s+/);
        w.__clipSamples!.push({
          right: parts.length >= 2 ? parts[1]! : "0px",
          left: parts.length >= 4 ? parts[3]! : "0px",
        });
        if (performance.now() - t0 < 1200) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await cta.hover();
    await page.waitForTimeout(1300);
    const samples = await page.evaluate(
      () =>
        (window as unknown as { __clipSamples: { right: string; left: string }[] }).__clipSamples,
    );
    // it ends fully revealed
    await expect.poll(async () => (await insets()).right, { timeout: 3000 }).toBe("0px");
    // the left edge never moves - it is never revealed from the right
    for (const s of samples) {
      expect(parseFloat(s.left) || 0, "the left edge must stay pinned").toBe(0);
    }
    // the right inset only ever falls, so the reveal is one-directional ...
    const pcts = samples
      .map((s) => (s.right.endsWith("%") ? parseFloat(s.right) : 0))
      .filter((n) => !Number.isNaN(n));
    for (let i = 1; i < pcts.length; i += 1) {
      expect(pcts[i], "the reveal front only advances").toBeLessThanOrEqual(pcts[i - 1] + 0.01);
    }
    // ... and it animates rather than snapping open
    expect(new Set(pcts).size, "the reveal is animated, not instant").toBeGreaterThan(2);

    // no layout shift while it animates
    const after = await cta.boundingBox();
    expect(after!.x).toBeCloseTo(box!.x, 1);
    expect(after!.y).toBeCloseTo(box!.y, 1);
    expect(after!.height).toBeCloseTo(box!.height, 1);

    await page.mouse.move(10, 10);
    await expect.poll(clip, { timeout: 3000 }).toContain("100%");
  });

  test("keyboard focus reveals it and the link still routes", async ({ page }) => {
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    await cta.scrollIntoViewIfNeeded();
    await cta.focus();
    await expect
      .poll(() => cta.evaluate((el) => getComputedStyle(el, "::after").clipPath), { timeout: 3000 })
      .not.toContain("100%");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work$/);
  });

  test("filled buttons, chips, burger rows and the EN/KA switcher are excluded", async ({
    page,
  }) => {
    await gotoRoute(page, "/start-a-project");
    const carries = await page.evaluate(() => {
      const out: Record<string, boolean> = {};
      const probe = (key: string, sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const a = getComputedStyle(el, "::after");
        out[key] =
          `${a.maskImage} ${(a as unknown as { webkitMaskImage: string }).webkitMaskImage}`.includes(
            "pencil-rule-h",
          );
      };
      probe("chipCta", ".dao-chipcta");
      probe("chip", ".dbr__chip");
      probe("formButton", "button[type='submit']");
      probe("langSwitch", ".dao-chrome .dao-lang a");
      probe("burgerButton", ".dao-burger");
      return out;
    });
    for (const [k, v] of Object.entries(carries)) {
      expect(v, `${k} must not carry the decorative stroke`).toBe(false);
    }
    // and the burger rows themselves
    await gotoRoute(page, "/");
    await page.mouse.move(600, 400);
    await page.getByRole("button", { name: /open menu/i }).click();
    const navRow = await page.evaluate(() => {
      const a = getComputedStyle(document.querySelector(".dao-nav__link")!, "::after");
      return `${a.maskImage} ${(a as unknown as { webkitMaskImage: string }).webkitMaskImage}`;
    });
    expect(navRow).not.toContain("pencil-rule-h");
  });

  test("reduced motion keeps the stroke but drops the animation", async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    await cta.scrollIntoViewIfNeeded();
    const s = await cta.evaluate((el) => {
      const a = getComputedStyle(el, "::after");
      return { dur: a.transitionDuration, mask: a.maskImage || "" };
    });
    expect(s.mask).toContain("pencil-rule-h");
    // effectively instant - engines report either 0s or a sub-millisecond value
    expect(parseFloat(s.dur), "no animation under reduced motion").toBeLessThan(0.01);
    await ctx.close();
  });

  test("touch devices get a clean tappable CTA with no dead hover", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    await cta.scrollIntoViewIfNeeded();
    // hover has no meaning here, so the stroke is not painted at all
    const display = await cta.evaluate((el) => getComputedStyle(el, "::after").display);
    expect(display).toBe("none");
    // ... and tapping still routes
    await cta.tap();
    await expect(page).toHaveURL(/\/work$/);
    await ctx.close();
  });
});

test.describe("Typography introduces no horizontal overflow", () => {
  for (const [w, h] of [
    [430, 932],
    [390, 844],
    [375, 812],
    [360, 780],
    [320, 700],
  ] as const) {
    test(`no horizontal scroll at ${w}px in both locales`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        isMobile: true,
        hasTouch: true,
      });
      const page = await ctx.newPage();
      for (const route of [
        "/",
        "/ka",
        "/georgia-production",
        "/ka/georgia-production",
        "/ka/studio-lab",
      ]) {
        await gotoRoute(page, route);
        const moved = await page.evaluate(() => {
          const x0 = window.scrollX;
          window.scrollTo(9999, window.scrollY);
          const m = window.scrollX;
          window.scrollTo(x0, window.scrollY);
          return m;
        });
        expect(moved, `${route} at ${w}px must not scroll sideways`).toBe(0);
      }
      await ctx.close();
    });
  }
});

test.describe("EN/KA switching still works", () => {
  test("the switcher routes and re-resolves typography", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await page.mouse.move(300, 400);
    const enFam = await famOf(page, ".dst__make");
    await page
      .getByRole("link", { name: /Georgian/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ka\/studio$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
    const kaFam = await famOf(page, ".dst__make");
    // SUPERSEDED: this heading was the display face (Adevas) until the typography
    // cleanup pass moved "Make something with us." to strong Optika. The point of
    // the test is unchanged - the face must still RE-RESOLVE across the locale
    // switch, because --dao-f-ui is re-pointed to the Georgian stack under
    // html[lang="ka"] - so it now asserts that against the new EN face.
    expect(enFam).toContain("optika");
    expect(kaFam).not.toContain("optika");
  });
});
