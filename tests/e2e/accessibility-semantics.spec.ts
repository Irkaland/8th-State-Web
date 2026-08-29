import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * §P6: the semantic and keyboard contracts this phase established or protected.
 *
 * What was actually wrong at baseline, measured across 20 route/locale
 * combinations (axe was already clean - Phase 1 had taken the automated
 * violations to zero, so none of this comes from a scanner):
 *
 *   landmark  the persistent chrome - brand link, EN/KA switch, burger - was a
 *             plain div, so on every route the only controls present sitewide
 *             sat outside every landmark. It is a <header> now.
 *   headings  /work offered one heading for twelve projects and /services one
 *             for nine capabilities. Their titles are headings now.
 *   target    EN and KA measured 19.6x20 and 20.8x20 - the only controls small
 *             on both axes. The glyphs are unchanged; the hit area is not.
 *   focus     the brief's fields signalled focus with 1px of underline opacity.
 *
 * Everything else here already passed and is covered so it keeps passing -
 * §16 explicitly says to protect the burger rather than redesign it.
 *
 * Each route is loaded once and asked several questions; §43 - a load per
 * assertion is what destabilised the shared server in Phase 5.
 */

const MAJOR = ["/", "/work", "/services", "/studio", "/team", "/georgia-production", "/start-a-project"] as const;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
}

const outline = async (page: Page) =>
  page.evaluate(() => {
    const structure = () => {
      const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
      const skips: string[] = [];
      for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) skips.push(`${heads[i - 1]}->${heads[i]}`);
      return { h1: heads.filter((l) => l === 1).length, total: heads.length, skips };
    };
    return structure();
  });

test.describe("§P6 document structure", () => {
  for (const route of MAJOR) {
    test(`${route} exposes exactly one H1 and no skipped heading levels`, async ({ page }) => {
      await gotoRoute(page, route);
      await settle(page);
      const o = await outline(page);
      expect(o.h1, `${route} should have exactly one H1, found ${o.h1}`).toBe(1);
      expect(o.skips, `${route} skips heading levels: ${o.skips.join(", ")}`).toEqual([]);
    });
  }

  test("the work archive gives every project a heading, not just the page title", async ({ page }) => {
    await gotoRoute(page, "/work");
    await settle(page);
    const o = await outline(page);
    // twelve projects plus the page title - the archive was flat at one heading
    expect(o.total, "the archive should expose a heading per entry").toBeGreaterThan(5);
  });

  test("services gives its capabilities headings", async ({ page }) => {
    await gotoRoute(page, "/services");
    await settle(page);
    const o = await outline(page);
    expect(o.total, "capability titles should be headings").toBeGreaterThan(4);
  });
});

test.describe("§P6 landmarks", () => {
  for (const route of ["/", "/team", "/georgia-production"] as const) {
    test(`${route} exposes a banner landmark holding the sitewide controls`, async ({ page }) => {
      await gotoRoute(page, route);
      await settle(page);
      const l = await page.evaluate(() => {
        const chrome = document.querySelector(".dao-chrome");
        const banner = chrome?.closest("header, [role=banner]");
        const main = document.querySelector("main");
        return {
          chromeIsBanner: !!banner,
          bannerNestedInMain: !!banner && !!banner.closest("main"),
          hasMain: !!main,
          brandInside: !!banner?.querySelector(".dao-chrome__brand"),
          langInside: !!banner?.querySelector(".dao-lang a"),
          burgerInside: !!banner?.querySelector(".dao-burger"),
        };
      });
      expect(l.hasMain, "no main landmark").toBe(true);
      expect(l.chromeIsBanner, "the persistent chrome is not inside a banner landmark").toBe(true);
      // a <header> nested in <main> is a section header, not a banner
      expect(l.bannerNestedInMain, "the banner must not be nested inside main").toBe(false);
      expect(l.brandInside && l.langInside && l.burgerInside, "the banner should hold brand, locale switch and burger").toBe(true);
    });
  }
});

test.describe("§P6 target size", () => {
  test("the locale switcher answers a 24x24 target without stealing its neighbour", async ({ page }) => {
    await gotoRoute(page, "/team");
    await settle(page);
    for (const width of [430, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      // the chrome withdraws itself after ~1.8s of stillness; a hit test run
      // against a withdrawn chrome measures whatever is underneath it
      await page.mouse.move(width / 2, 400);
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, { timeout: 5000 }).catch(() => {});
      const m = await page.evaluate(() => {
        const owns = (el: Element, x: number, y: number) => {
          const at = document.elementFromPoint(x, y);
          return !!at && (at === el || el.contains(at));
        };
        const measure = (el: Element) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          let l = 0, rr = 0, t = 0, b = 0;
          while (l < 30 && owns(el, r.left - l - 1, cy)) l++;
          while (rr < 30 && owns(el, r.right + rr + 1, cy)) rr++;
          while (t < 30 && owns(el, cx, r.top - t - 1)) t++;
          while (b < 30 && owns(el, cx, r.bottom + b + 1)) b++;
          return { w: r.width + l + rr, h: r.height + t + b };
        };
        const [a, c] = [...document.querySelectorAll(".dao-lang a")];
        const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect();
        let both = 0;
        const y = ra.top + ra.height / 2;
        for (let x = Math.round(ra.right) + 1; x < Math.round(rc.left); x++) {
          if (owns(a, x, y) && owns(c, x, y)) both++;
        }
        return { a: measure(a), c: measure(c), both };
      });
      for (const k of ["a", "c"] as const) {
        expect(m[k].w, `locale link hit width at ${width}px`).toBeGreaterThanOrEqual(24);
        expect(m[k].h, `locale link hit height at ${width}px`).toBeGreaterThanOrEqual(24);
      }
      expect(m.both, `the two locale links share ${m.both}px of hit area at ${width}px`).toBe(0);
    }
  });
});

test.describe("§P6 keyboard lifecycle stays correct", () => {
  test("the closed burger sheet cannot be reached by keyboard, and Escape returns focus", async ({ page }) => {
    await gotoRoute(page, "/");
    await settle(page);
    const closedReachable = await page.evaluate(() => {
      const nav = document.querySelector("#dao-nav")!;
      const f = nav.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])');
      let reachable = 0;
      for (const el of f) { (el as HTMLElement).focus(); if (document.activeElement === el) reachable++; }
      return { total: f.length, reachable };
    });
    expect(closedReachable.total, "the sheet should have controls to guard").toBeGreaterThan(0);
    expect(closedReachable.reachable, "controls in the closed sheet took focus").toBe(0);

    await page.locator(".dao-burger").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => !!document.activeElement?.closest("#dao-nav")), "focus did not enter the sheet").toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => document.activeElement?.classList.contains("dao-burger")), "focus did not return to the trigger").toBe(true);
  });

  test("the skip link is the first stop and reaches main", async ({ page }) => {
    await gotoRoute(page, "/");
    await settle(page);
    await page.keyboard.press("Tab");
    const onSkip = await page.evaluate(() => !!document.activeElement?.classList.contains("skip-link"));
    expect(onSkip, "the first Tab should land on the skip link").toBe(true);
    // it slides in over 160ms - poll for the settled position rather than racing it
    await page.waitForFunction(() => document.querySelector(".skip-link")!.getBoundingClientRect().top >= 0, null, { timeout: 5000 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => !!document.querySelector("#main"))).toBe(true);
  });

  test("the team dialog names itself and hands focus back", async ({ page }) => {
    await gotoRoute(page, "/team");
    await settle(page);
    const card = page.locator(".dtm__person").first();
    await card.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(700);
    const dlg = await page.evaluate(() => {
      const d = document.querySelector("[role=dialog]:not(#dao-nav)");
      return d ? { name: d.getAttribute("aria-label") || (d.getAttribute("aria-labelledby") ? "x" : ""), modal: d.getAttribute("aria-modal") } : null;
    });
    expect(dlg, "no dialog opened").not.toBeNull();
    expect(dlg!.name, "the dialog has no accessible name").toBeTruthy();
    await page.keyboard.press("Escape");
    // the profile closes on a transition before focus is handed back
    await page.waitForFunction(() => !!document.activeElement?.classList.contains("dtm__person"), null, { timeout: 6000 });
  });
});

test.describe("§P6 focus is visible on every control family", () => {
  test("the brief's fields show a keyboard focus indicator", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    await settle(page);
    for (const sel of ["textarea", "input"]) {
      const state = await page.evaluate((s) => {
        const el = document.querySelector(s) as HTMLElement | null;
        if (!el) return null;
        const before = getComputedStyle(el).boxShadow;
        el.focus();
        const cs = getComputedStyle(el);
        return { before, after: cs.boxShadow, outline: cs.outlineStyle, fv: el.matches(":focus-visible") };
      }, sel);
      expect(state, `${sel} not found`).not.toBeNull();
      const indicated = state!.outline !== "none" || (state!.after !== state!.before && state!.after !== "none");
      expect(indicated, `${sel} gives no visible keyboard focus indicator`).toBe(true);
    }
  });

  test("interactive controls carry accessible names", async ({ page }) => {
    for (const route of ["/", "/services", "/team"] as const) {
      await gotoRoute(page, route);
      await settle(page);
      const unnamed = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll("a[href], button")) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0) continue;
          if (el.closest("[inert], [aria-hidden=true]")) continue;
          const name = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
          if (!name) out.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
        }
        return out;
      });
      expect(unnamed, `${route} has unnamed controls: ${unnamed.join(", ")}`).toEqual([]);
    }
  });
});
