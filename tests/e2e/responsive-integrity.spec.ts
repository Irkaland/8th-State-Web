import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * §P5: the three responsive contracts this phase established.
 *
 * These are geometry and reachability contracts with tolerances, not pixel
 * snapshots - the point is that the layout stays sane as the viewport narrows,
 * not that it renders to an exact size.
 *
 *   Team     the portrait must never grow when the screen gets narrower. It did:
 *            crossing 381px -> 380px took it from 80.7x100.6 to 96.8x120.7 while
 *            the name column lost 16px at the width with least to spare.
 *   Georgia  the A-D index descriptions are real translated content with no
 *            other home on the page. They were display:none below 720px.
 *   Services the film carousel's third frame is deliberately off-frame
 *            (left: -14%), which is art direction - but it must stay operable.
 *   Document no route may scroll horizontally at any width.
 */

const MOBILE = [430, 414, 390, 380, 375, 360, 320] as const;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

/** widest visible box of an element, in CSS pixels */
const boxOf = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  }, selector);

test.describe("§P5 Team - the portrait never grows on a narrower screen", () => {
  test("portrait width is monotonic non-increasing from 430px down to 320px", async ({ page }) => {
    const seen: { w: number; portrait: number }[] = [];
    for (const w of MOBILE) {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/team");
      await settle(page);
      const b = await boxOf(page, ".dtm__person .dtm__frame");
      expect(b, `no portrait at ${w}px`).not.toBeNull();
      seen.push({ w, portrait: b!.w });
    }
    // widths descend, so each portrait must be <= the previous one (1px tolerance
    // for sub-pixel grid rounding)
    for (let i = 1; i < seen.length; i++) {
      expect(
        seen[i].portrait,
        `portrait grew from ${seen[i - 1].portrait}px at ${seen[i - 1].w}px to ${seen[i].portrait}px at ${seen[i].w}px`,
      ).toBeLessThanOrEqual(seen[i - 1].portrait + 1);
    }
  });

  test("crossing the 380px breakpoint does not resize the portrait", async ({ page }) => {
    const at = async (w: number) => {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/team");
      await settle(page);
      return (await boxOf(page, ".dtm__person .dtm__frame"))!;
    };
    const above = await at(381);
    const below = await at(380);
    expect(Math.abs(below.w - above.w), `381px ${above.w} vs 380px ${below.w}`).toBeLessThanOrEqual(1);
    expect(Math.abs(below.h - above.h), `381px ${above.h} vs 380px ${below.h}`).toBeLessThanOrEqual(1);
  });

  test("the portrait keeps its crop", async ({ page }) => {
    // the contact-sheet aspect ratio is part of the approved composition
    for (const w of [430, 380, 320]) {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/team");
      await settle(page);
      const b = (await boxOf(page, ".dtm__person .dtm__frame"))!;
      expect(b.w / b.h, `aspect at ${w}px`).toBeCloseTo(0.802, 1);
    }
  });
});

test.describe("§P5 Georgia - the index descriptions survive on mobile", () => {
  for (const locale of ["en", "ka"] as const) {
    test(`${locale.toUpperCase()}: every A-D description is rendered and visible at mobile widths`, async ({ page }) => {
      for (const w of [430, 390, 320]) {
        await page.setViewportSize({ width: w, height: 844 });
        await gotoRoute(page, locale === "en" ? "/georgia-production" : "/ka/georgia-production");
        await settle(page);
        const state = await page.evaluate(() => {
          const els = [...document.querySelectorAll(".dgp__indexdesc")];
          return els.map((el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || "").trim().length,
              display: cs.display,
              visible: cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0,
            };
          });
        });
        expect(state.length, `index rows at ${w}px`).toBeGreaterThanOrEqual(4);
        expect(
          state.filter((s) => s.visible).length,
          `${state.filter((s) => !s.visible).length} description(s) hidden at ${w}px`,
        ).toBe(state.length);
        expect(state.every((s) => s.text > 0), "an index description rendered empty").toBe(true);
      }
    });
  }

  test("the description sits on its own line, not squeezed beside the name", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoRoute(page, "/georgia-production");
    await settle(page);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".dgp__indexrow")].slice(0, 4).map((row) => {
        const name = row.querySelector(".dgp__indexname")!.getBoundingClientRect();
        const desc = row.querySelector(".dgp__indexdesc")!.getBoundingClientRect();
        return { nameBottom: name.bottom, descTop: desc.top, descLeft: desc.left, nameLeft: name.left };
      }),
    );
    for (const r of rows) {
      // wrapped onto a new line: the description starts below the name, and is
      // left-aligned rather than pushed to a right rail
      expect(r.descTop).toBeGreaterThanOrEqual(r.nameBottom - 2);
      expect(r.descLeft).toBeLessThanOrEqual(r.nameLeft + 2);
    }
  });
});

test.describe("§P5 Services - the off-frame carousel control stays operable", () => {
  test("every carousel control is hit-testable from 430px down to 320px", async ({ page }) => {
    for (const w of MOBILE) {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/services");
      await settle(page);
      const controls = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll(".dsv__filmframe, .dsv__name")].map((el) => {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          const r = el.getBoundingClientRect();
          const visL = Math.max(r.left, 0), visR = Math.min(r.right, vw);
          const visible = Math.max(0, visR - visL);
          let reachable = false;
          if (visible > 0) {
            const at = document.elementFromPoint(visL + visible / 2, r.top + r.height / 2);
            reachable = !!at && (at === el || el.contains(at) || at.contains(el));
          }
          return { label: el.getAttribute("aria-label") || (el.textContent || "").trim().slice(0, 16), visible: Math.round(visible), reachable };
        });
      });
      for (const c of controls) {
        expect(c.visible, `"${c.label}" has no on-screen area at ${w}px`).toBeGreaterThan(24);
        expect(c.reachable, `"${c.label}" is not hit-testable at ${w}px`).toBe(true);
      }
    }
  });
});

test.describe("§P5 no route scrolls horizontally", () => {
  const ROUTES = ["/services", "/team", "/georgia-production", "/"] as const;
  for (const route of ROUTES) {
    test(`${route} has no document overflow across the mobile range`, async ({ page }) => {
      for (const w of MOBILE) {
        await page.setViewportSize({ width: w, height: 844 });
        await gotoRoute(page, route);
        await settle(page);
        const over = await page.evaluate(() => {
          const de = document.documentElement;
          return { scrollW: de.scrollWidth, clientW: de.clientWidth };
        });
        expect(
          over.scrollW,
          `${route} scrolls horizontally at ${w}px (${over.scrollW} > ${over.clientW})`,
        ).toBeLessThanOrEqual(over.clientW + 1);
      }
    });
  }
});
