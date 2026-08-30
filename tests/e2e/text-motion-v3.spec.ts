import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * RESPONSIVE TEXT MOTION SYSTEM V3 - the rendered contract.
 *
 * The source-level contract (families, tiers, tokens, one observer, no text
 * splitting) is asserted in tests/unit/text-motion.test.ts. What can only be
 * checked in a browser is what this file checks: that the system never leaves
 * anything unreadable.
 *
 * THE CENTRAL GUARANTEE IS §41. A motion family only resolves inside a revealed
 * ancestor - `is-in` is what every family listens for - so a family class added
 * somewhere without one stays at its pre-state, which for most families means
 * opacity 0. That is invisible text, and it is silent: nothing throws, nothing
 * logs, the markup is present, and the automated accessibility checks pass
 * because the text is in the tree. The sweep below is the guard against it, on
 * every public route, in both locales, at every scroll depth.
 */

const ROUTES = [
  "/",
  "/work",
  "/work/aom-summer-collection",
  "/services",
  "/studio",
  "/team",
  "/studio-lab",
  "/studio-lab/photography",
  "/process",
  "/georgia-production",
  "/contact",
  "/start-a-project",
];

type Offender = { cls: string; text: string; opacity: string; clip: string; top: number };

/**
 * Entrance families that are IN VIEW and have not resolved.
 *
 * Only the viewport is asked about, because an element further down the page is
 * legitimately waiting for its own scroll entrance - that is the system working.
 * The question §41 actually poses is "can the reader see what is in front of
 * them", so that is the question the sweep asks, repeatedly, all the way down.
 */
async function unresolvedInView(page: Page): Promise<Offender[]> {
  return page.evaluate(() => {
    const FAMILIES = ["mo-a", "mo-b", "mo-c", "mo-d", "mo-e", "mo-f", "mo-g"];
    const out: Offender[] = [];
    const vh = window.innerHeight;
    for (const fam of FAMILIES) {
      for (const el of document.querySelectorAll<HTMLElement>(`.${fam}`)) {
        const box = el.getBoundingClientRect();
        // laid out away (a responsive alternate), or not on screen
        if (box.width === 0 && box.height === 0) continue;
        // AT the reveal boundary, not merely touching it. An element still
        // sitting in the bottom band of the viewport is by definition inside the
        // runtime's own threshold and is not yet expected to have resolved -
        // holding it to account would be asserting that scroll entrances do not
        // exist. Anything above that band, and substantially on screen, is
        // content the reader has actually arrived at and must be able to read.
        if (box.top > vh * 0.85) continue;
        const shown = Math.min(box.bottom, vh) - Math.max(box.top, 0);
        if (shown < Math.min(box.height, 60)) continue;
        // decoration is not reading content
        if (el.closest("[aria-hidden='true']")) continue;
        // the element the family actually animates
        const target = (fam === "mo-a" || fam === "mo-b" ? el.firstElementChild : el) ?? el;
        const cs = getComputedStyle(target);
        const invisible = Number(cs.opacity) < 0.9 || /100%/.test(cs.clipPath || "");
        if (invisible) {
          out.push({
            cls: el.className,
            text: (el.textContent || "").trim().slice(0, 40),
            opacity: cs.opacity,
            clip: cs.clipPath,
            top: Math.round(box.top + window.scrollY),
          });
        }
      }
    }
    return out;
  });
}

/**
 * Let every entrance currently running finish before measuring.
 *
 * Deliberately scoped to the FAMILY elements' own animations. Several routes
 * carry perpetual ambient motion - the ticker, the Studio orbit's drift - so
 * waiting for the document to have no running animation at all never returns,
 * and the sweep would spend its whole budget on a condition that is false by
 * design.
 */
const FAMILY_SELECTOR = ".mo-a > span, .mo-b > span, .mo-c, .mo-d, .mo-e, .mo-f, .mo-g";

async function settle(page: Page) {
  // The observer fires asynchronously after the scroll, and a family's
  // transition does not exist until the class lands and styles recalculate.
  // Polling immediately would find nothing running and call that settled, then
  // measure the element a frame into its travel - so the wait starts AFTER the
  // reveal has had a chance to begin.
  await page.waitForTimeout(200);
  await page
    .waitForFunction(
      (sel) =>
        [...document.querySelectorAll(sel)].every((el) =>
          el.getAnimations().every((a) => a.playState !== "running"),
        ),
      FAMILY_SELECTOR,
      { timeout: 3000 },
    )
    .catch(() => {});
  await page.waitForTimeout(200);
}

/** Walk the whole page a viewport at a time, asserting nothing in view is hidden. */
async function sweep(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  const found: Offender[] = [];
  for (let y = 0; y < height; y += Math.round(vh * 0.8)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await settle(page);
    found.push(...(await unresolvedInView(page)));
  }
  return found;
}

test.describe("§41 no motion family is ever left unreadable", () => {
  for (const route of ROUTES) {
    for (const locale of ["", "/ka"]) {
      test(`${locale || "/en"} ${route} resolves every entrance it scrolls past`, async ({
        page,
      }) => {
        await gotoRoute(page, `${locale}${route === "/" ? "" : route}` || "/");
        expect(await sweep(page), "families still at their pre-state").toEqual([]);
      });
    }
  }
});

test.describe("§24 reduced motion shows final states, immediately", () => {
  test("never arms the runtime, so nothing is hidden waiting for a class", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/");
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute("data-dao-motion")),
    ).toBe(false);
  });

  test("leaves no family hidden and no transition running", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/team");
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        ".mo-a, .mo-b, .mo-c, .mo-d, .mo-e, .mo-f, .mo-g, .dao-rise > *, .dao-fade, .dao-side",
      )) {
        const cs = getComputedStyle(el);
        if (Number(cs.opacity) < 0.9 && el.getBoundingClientRect().height > 0) {
          out.push(`hidden: ${el.className}`);
        }
        // globals.css collapses every transition to 0.001ms under the
        // preference; dao-motion.css removes them outright. Either is a final
        // state that arrives with no perceptible travel.
        if (!["0s", "0.001ms"].includes(cs.transitionDuration.split(",")[0].trim())) {
          out.push(`${el.className}: ${cs.transitionDuration}`);
        }
      }
      return out;
    });
    expect(bad).toEqual([]);
  });
});

test.describe("§41 the site is readable with the runtime switched off", () => {
  test("no entrance hides content when JavaScript never arms it", async ({ browser }) => {
    // the strictest form of the guarantee: a page that never runs a line of our
    // JavaScript must still be fully legible, because every hidden pre-state is
    // scoped to an attribute only our script sets
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/team");
    const hidden = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        ".mo-a > span, .mo-c, .mo-d, .mo-f, .dao-fade, .dao-side",
      )) {
        if (Number(getComputedStyle(el).opacity) < 0.9) out.push(el.className || el.tagName);
      }
      return out;
    });
    expect(hidden, "content hidden with no runtime").toEqual([]);
    await context.close();
  });
});

test.describe("§23 reveals happen once", () => {
  test("scrolling back up does not replay an entrance", async ({ page }) => {
    await gotoRoute(page, "/work");
    await page.evaluate(() => window.scrollTo({ top: 2200, behavior: "instant" }));
    await settle(page);
    const revealed = await page.evaluate(() => document.querySelectorAll(".is-in").length);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.querySelectorAll(".is-in").length);
    // never fewer: the class is added and never removed, so nothing can replay
    expect(after).toBeGreaterThanOrEqual(revealed);
  });
});
