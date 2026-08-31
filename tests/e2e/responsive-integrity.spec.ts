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
 *
 * Every contract here is decided by CSS, so each route is loaded ONCE and then
 * resized: media queries re-evaluate on resize, and a load-per-width would put
 * ~54 extra navigations through the one shared server for no extra coverage.
 */

const MOBILE = [430, 414, 390, 380, 375, 360, 320] as const;

/** resize in place and let layout settle - no navigation */
async function atWidth(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

async function open(page: Page, route: string) {
  await page.setViewportSize({ width: MOBILE[0], height: 844 });
  await gotoRoute(page, route);
  await page.evaluate(() => document.fonts.ready);
}

const frameBox = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector(".dtm__person .dtm__frame");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  });

test.describe("§P5 Team - the portrait never grows on a narrower screen", () => {
  test("portrait width is monotonic non-increasing from 430px down to 320px", async ({ page }) => {
    await open(page, "/team");
    const seen: { w: number; portrait: number }[] = [];
    for (const w of MOBILE) {
      await atWidth(page, w);
      const b = await frameBox(page);
      expect(b, `no portrait at ${w}px`).not.toBeNull();
      seen.push({ w, portrait: b!.w });
    }
    for (let i = 1; i < seen.length; i++) {
      expect(
        seen[i].portrait,
        `portrait grew from ${seen[i - 1].portrait}px at ${seen[i - 1].w}px to ${seen[i].portrait}px at ${seen[i].w}px`,
      ).toBeLessThanOrEqual(seen[i - 1].portrait + 1);
    }
  });

  test("crossing the 380px breakpoint does not resize the portrait", async ({ page }) => {
    await open(page, "/team");
    await atWidth(page, 381);
    const above = (await frameBox(page))!;
    await atWidth(page, 380);
    const below = (await frameBox(page))!;
    expect(Math.abs(below.w - above.w), `381px ${above.w} vs 380px ${below.w}`).toBeLessThanOrEqual(
      1,
    );
    expect(Math.abs(below.h - above.h), `381px ${above.h} vs 380px ${below.h}`).toBeLessThanOrEqual(
      1,
    );
  });

  test("the portrait keeps its crop", async ({ page }) => {
    // the contact-sheet aspect ratio is part of the approved composition
    await open(page, "/team");
    for (const w of [430, 380, 320]) {
      await atWidth(page, w);
      const b = (await frameBox(page))!;
      expect(b.w / b.h, `aspect at ${w}px`).toBeCloseTo(0.802, 1);
    }
  });
});

/**
 * The support register's descriptions are real translated content - what each
 * item of local scope actually covers - and they appear nowhere else on the
 * site, so a phone that hides them loses them entirely. That was the original
 * defect and it is still what these guard.
 *
 * The register itself changed: it printed four of the studio's eight scope
 * items under invented letters A-D, and now prints all eight under their own
 * numbers. So the count asserted here rises from 4 to 8 - the guarantee is the
 * same one, over twice as much content.
 */
test.describe("§P5 Georgia - the register descriptions survive on mobile", () => {
  for (const locale of ["en", "ka"] as const) {
    test(`${locale.toUpperCase()}: every scope description is rendered and visible at mobile widths`, async ({
      page,
    }) => {
      await open(page, locale === "en" ? "/georgia-production" : "/ka/georgia-production");
      for (const w of [430, 390, 320]) {
        await atWidth(page, w);
        const state = await page.evaluate(() =>
          [...document.querySelectorAll(".dgp__itemdesc")].map((el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || "").trim().length,
              visible:
                cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0,
            };
          }),
        );
        expect(state.length, `register rows at ${w}px`).toBe(8);
        expect(
          state.filter((s) => s.visible).length,
          `${state.filter((s) => !s.visible).length} description(s) hidden at ${w}px`,
        ).toBe(state.length);
        expect(
          state.every((s) => s.text > 0),
          "a register description rendered empty",
        ).toBe(true);
      }
    });
  }

  test("the description sits under its own item, not squeezed beside it", async ({ page }) => {
    await open(page, "/georgia-production");
    await atWidth(page, 390);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".dgp__item")].map((row) => {
        const name = row.querySelector(".dgp__itemtitle")!.getBoundingClientRect();
        const desc = row.querySelector(".dgp__itemdesc")!.getBoundingClientRect();
        return {
          nameBottom: name.bottom,
          descTop: desc.top,
          descLeft: desc.left,
          nameLeft: name.left,
        };
      }),
    );
    expect(rows.length).toBe(8);
    for (const r of rows) {
      // on its own line under the item, and indented to the item's own column
      // rather than pushed out to a right rail - the rail is what left a phone
      // with nowhere to put it
      expect(r.descTop).toBeGreaterThanOrEqual(r.nameBottom - 2);
      expect(Math.abs(r.descLeft - r.nameLeft)).toBeLessThanOrEqual(2);
    }
  });
});

test.describe("§P5 Services - the department register stays operable", () => {
  // The catalogue s film carousel is gone with the redesign, and so is the
  // running department folio that briefly replaced it as this page s
  // off-frame control. The register is what carries the five departments now:
  // it is not a scrolling rail, so the rule tightens rather than relaxes -
  // every row must be FULLY on frame and hit-testable at every mobile width,
  // not merely reachable by scrolling sideways.
  test("every register row is on frame and hit-testable from 430px down to 320px", async ({
    page,
  }) => {
    await open(page, "/services");
    for (const w of MOBILE) {
      await atWidth(page, w);
      const rows = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll(".dsvc__row")].map((el) => {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          const r = el.getBoundingClientRect();
          const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return {
            label: (el.querySelector(".dsvc__rowname")?.textContent || "").trim(),
            right: Math.round(r.right),
            vw,
            height: Math.round(r.height),
            reachable: !!at && (at === el || el.contains(at) || at.contains(el)),
          };
        });
      });
      expect(rows.length, `no register rows at ${w}px`).toBe(5);
      for (const r of rows) {
        expect(r.right, `"${r.label}" runs off the frame at ${w}px`).toBeLessThanOrEqual(r.vw + 1);
        expect(r.height, `"${r.label}" is under the touch floor at ${w}px`).toBeGreaterThanOrEqual(
          44,
        );
        expect(r.reachable, `"${r.label}" is not hit-testable at ${w}px`).toBe(true);
      }
    }
  });
});

test.describe("§P5 no route scrolls horizontally", () => {
  const ROUTES = ["/services", "/team", "/georgia-production", "/"] as const;
  for (const route of ROUTES) {
    test(`${route} has no document overflow across the mobile range`, async ({ page }) => {
      await open(page, route);
      for (const w of MOBILE) {
        await atWidth(page, w);
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
