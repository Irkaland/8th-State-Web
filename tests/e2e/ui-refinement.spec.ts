import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * UI/UX refinement pass - the RENDERED behaviour of the fixes, at the widths
 * the brief names. What lives in files rather than in layout (which asset a
 * mark ships as, which declarations carry each fix) is asserted in
 * tests/unit/ui-refinement.test.ts instead.
 *
 *   01  the Studio Lab card: calmer, a third smaller, still across the seam
 *   02  the closing sun: top rays intact, and it does not stretch the band
 *   03  the two dark Studio surfaces: one material, no gap and no seam
 *   03  the Start a Project bird: vector, so never drawn past its own source
 *   04  the three major service headings: the display face
 *   05  the favicon: the red brandbook sun, with no stale path
 *   06  the Studio Lab filter slash: gone once the row wraps
 *   07  the burger labels: one scale in English
 *   08  the brief options: one alignment
 *   10  ALL SERVICES: the arrow is never orphaned
 *   11  no horizontal overflow on any touched route, either locale
 *
 * Every test loads a handful of pages and each hard load replays the Studio
 * Ident, so the loops are deliberately kept per-width rather than sweeping
 * every combination inside one test.
 */
const PHONES = [430, 390, 375, 360, 320];
const ALL = [1440, 1024, 768, ...PHONES];

/**
 * Open the burger and wait for the sheet to be addressable. Located by
 * aria-controls rather than by accessible name: the name is translated, and
 * half of what this file measures is the Georgian menu.
 */
async function openMenu(page: Page) {
  await page.locator('button.dao-burger[aria-controls="dao-nav"]').click();
  await expect(page.locator(".dao-nav")).toHaveAttribute("aria-hidden", "false");
  await page.waitForTimeout(600);
}

/* ------------------------------------------------- 01 the Studio Lab card -- */

test.describe("01 the Studio Lab card", () => {
  test("is a third smaller and noticeably calmer on the desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio");
    const m = await page.locator(".dst__labpanel").evaluate((el) => {
      const rooms = document.querySelector(".dst__rooms")!;
      const d = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return {
        w: (el as HTMLElement).offsetWidth,
        h: (el as HTMLElement).offsetHeight,
        deg: (Math.atan2(d.b, d.a) * 180) / Math.PI,
        top: el.getBoundingClientRect().top + scrollY,
        roomsTop: rooms.getBoundingClientRect().top + scrollY,
      };
    });
    // it was 576px wide at this width; a third off lands near 388
    expect(m.w).toBeGreaterThan(340);
    expect(m.w).toBeLessThan(430);
    // still the business-card proportion, never squared up
    expect(m.w / m.h).toBeGreaterThan(1.5);
    expect(m.w / m.h).toBeLessThan(1.75);
    // 23 -> 15 -> 7.5: a real turn, never a level UI card (see the Studio pass)
    expect(m.deg).toBeGreaterThan(5);
    expect(m.deg).toBeLessThan(11);
    // and the intentional overlap across the light/dark boundary survives
    expect(m.top).toBeLessThan(m.roomsTop - 8);
  });

  test("keeps its type and its botanical in proportion as it shrinks", async ({ page }) => {
    for (const w of [1440, 1024, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      await gotoRoute(page, "/studio");
      const s = await page.locator(".dst__labpanel").evaluate((el) => ({
        card: (el as HTMLElement).offsetWidth,
        type: parseFloat(getComputedStyle(el.querySelector(".dst__lablines")!).fontSize),
        // offsetWidth, not the bounding rect: the card is turned, so a rect
        // would measure the rotated envelope rather than the botanical
        stem: (el.querySelector(".dst__labstem") as HTMLElement).offsetWidth,
      }));
      // both are measured against the CARD, so both hold their share of it
      expect(s.type / s.card, `type @${w}`).toBeGreaterThan(0.045);
      expect(s.type / s.card, `type @${w}`).toBeLessThan(0.075);
      expect(s.stem / s.card, `botanical @${w}`).toBeGreaterThan(0.12);
      expect(s.stem / s.card, `botanical @${w}`).toBeLessThan(0.22);
    }
  });

  for (const w of PHONES) {
    test(`is only moderately smaller on a phone, with room around it @${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/studio");
      const m = await page.locator(".dst__labpanel").evaluate((el) => {
        const r = el.getBoundingClientRect();
        const d = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        const inner = el.querySelector(".dst__labpanel-inner") as HTMLElement;
        return {
          card: (el as HTMLElement).offsetWidth,
          deg: (Math.atan2(d.b, d.a) * 180) / Math.PI,
          left: r.left,
          right: window.innerWidth - r.right,
          fits: inner.scrollHeight <= inner.clientHeight + 1,
          over: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      // 340 -> 300, not 340 -> 227: moderately smaller, still a statement
      expect(m.card, "width").toBeGreaterThan(Math.min(255, w * 0.7));
      // 12 -> 8 -> 4: halved with the desktop card, step for step
      expect(m.deg, "tilt").toBeGreaterThan(2);
      expect(m.deg, "tilt").toBeLessThan(6);
      // the ROTATED box keeps a real margin on both sides and never clips
      expect(m.left, "left margin").toBeGreaterThan(6);
      expect(m.right, "right margin").toBeGreaterThan(6);
      expect(m.fits, "copy fits").toBe(true);
      expect(m.over, "overflow").toBeLessThanOrEqual(0);
    });
  }
});

/* ------------------------------------------------------------ 02 the sun -- */

/**
 * SUPERSEDES "02 the closing sun renders whole and clear of the statement".
 *
 * Requiring the WHOLE mark inside the band meant the mark set the band's
 * height: 634px at 1440, against ~250px of actual content, which put a long
 * stretch of empty ink between "Nine capabilities..." and "Make something with
 * us." The approved trade is explicit and is now what this asserts:
 *
 *   - the TOP of the sun is protected - no upper ray may ever be sheared;
 *   - the band is the height of its OWN content, not of the graphic;
 *   - the sun's lower edge may therefore be cropped by the section boundary,
 *     deliberately, and that is fine;
 *   - and on desktop it still keeps clear of the statement, which is where
 *     there is room for it to.
 *
 * That is a stricter test than the version it replaces, because it pins both
 * halves of the trade rather than only the graphic.
 */
test.describe("02 the closing sun", () => {
  for (const w of ALL) {
    test(`keeps its top rays and does not stretch the band @${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await gotoRoute(page, "/studio");
      const m = await page.evaluate(() => {
        const band = document.querySelector(".dst__handoff")!.getBoundingClientRect();
        const el = document.querySelector(".dst__handoffsun")!;
        const r = el.getBoundingClientRect();
        const make = document.querySelector(".dst__make")!.getBoundingClientRect();
        const cta = document.querySelector(".dst__handoffbody .dao-cta")!.getBoundingClientRect();
        const hit = (b: DOMRect) =>
          !(b.right <= r.left || b.left >= r.right || b.bottom <= r.top || b.top >= r.bottom);
        return {
          h: r.height,
          top: r.top - band.top,
          left: r.left - band.left,
          right: band.right - r.right,
          bandH: band.height,
          // where the statement sits INSIDE the band - 90px of padding-top, as
          // it always did, rather than floating in the middle of a tall box
          makeTop: make.top - band.top,
          // and where the band ends relative to the last line of content
          tail: band.bottom - cta.bottom,
          collides: hit(make) || hit(cta),
          alpha: getComputedStyle(el).backgroundColor,
        };
      });
      // the three sides that must never be sheared
      expect(m.top, "top rays inside the band").toBeGreaterThan(0);
      expect(m.left, "left inside the band").toBeGreaterThanOrEqual(0);
      expect(m.right, "right inside the band").toBeGreaterThanOrEqual(0);
      // still an atmospheric print rather than an icon
      expect(m.h, "still large").toBeGreaterThan(200);
      // the band is its own content's height: the statement sits at the top
      // padding and the band ends just after the CTA
      expect(m.makeTop, "statement at the top of the band").toBeLessThan(110);
      expect(m.tail, "band ends just after the CTA").toBeLessThan(130);
      expect(m.bandH, "band not stretched to fit the graphic").toBeLessThan(320);
      if (w > 720) {
        // on desktop there is room beside the statement, so it is kept clear
        expect(m.collides, "clear of the statement and the CTA").toBe(false);
      } else {
        // on a phone there is not, so it sits BEHIND as one composition - which
        // is only acceptable because it is a 7%-cream print, not a fill
        const a = Number(/rgba?\([^)]*,\s*([\d.]+)\)/.exec(m.alpha)?.[1] ?? "1");
        expect(a, "a print behind the type, never a fill").toBeLessThanOrEqual(0.09);
      }
    });
  }
});

/* ------------------------------------------- the two blacks meet cleanly -- */

test.describe("03 the dark Studio surfaces are one material", () => {
  for (const w of ALL) {
    test(`no gap and no seam between them @${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await gotoRoute(page, "/studio");
      const m = await page.evaluate(() => {
        const rooms = document.querySelector(".dst__rooms")!;
        const handoff = document.querySelector(".dst__handoff")!;
        const R = rooms.getBoundingClientRect();
        const H = handoff.getBoundingClientRect();
        const card = document.querySelector(".dst__labpanel") as HTMLElement;
        return {
          // the actual defect: the phone card's 34px bottom margin collapsed
          // THROUGH the section and left a band of untextured page ink between
          // the two, with a hard edge either side of it
          gap: Math.round(H.top - R.bottom),
          sameGround:
            getComputedStyle(rooms).backgroundColor === getComputedStyle(handoff).backgroundColor,
          bothWeave:
            !!rooms.querySelector(":scope > .dao-weave") &&
            !!handoff.querySelector(":scope > .dao-weave"),
          // and the card's shadow must finish inside its own section rather
          // than being occluded by the next one, which drew the same edge.
          // Measured off the card's LAYOUT box, which is what box-shadow is
          // specified against - its rotated envelope reaches ~10px lower.
          shadowRoom:
            card.offsetParent === rooms
              ? Math.round(rooms.clientHeight - (card.offsetTop + card.offsetHeight))
              : null,
          contained: getComputedStyle(rooms).display,
        };
      });
      expect(m.gap, "the sections must meet, with nothing between them").toBe(0);
      expect(m.sameGround, "same ink").toBe(true);
      expect(m.bothWeave, "same material").toBe(true);
      if (w <= 720) {
        // the phone card is in flow; its drop shadow reaches ~45px below it
        expect(m.contained, "the section contains its last child's margin").toBe("flow-root");
        expect(m.shadowRoom, "room for the shadow to finish").toBeGreaterThanOrEqual(45);
      }
    });
  }
});

/* ------------------------------------------------- 03/09 the white bird --- */

test("03/09 the Start a Project bird is never drawn past its own source", async ({ page }) => {
  for (const w of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width: w, height: 900 });
    await gotoRoute(page, "/start-a-project");
    const m = await page.locator(".dbr__swallow").evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        mask: (cs.maskImage || cs.webkitMaskImage) as string,
        colour: cs.backgroundColor,
        w: r.width,
        h: r.height,
      };
    });
    // vector: there is no resolution to run out of, at any width or any DPR
    expect(m.mask, `@${w}`).toContain("swallow.svg");
    expect(m.mask, `@${w}`).not.toContain(".webp");
    // unchanged treatment and unchanged proportion
    expect(m.colour, `@${w}`).toBe("rgb(242, 237, 227)");
    expect(m.w / m.h, `@${w} proportion`).toBeCloseTo(900 / 994, 1);
    // and it stays a companion to the heading, never the page's subject
    expect(m.w, `@${w} not oversized`).toBeLessThan(w * 0.45);
  }
});

/* ------------------------------------------- 04 the three service titles -- */

test("04 the three major service headings are the display face", async ({ page }) => {
  for (const w of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width: w, height: 900 });
    await gotoRoute(page, "/services");
    const m = await page.evaluate(() => {
      const of = (sel: string) =>
        [...document.querySelectorAll(sel)].map((e) => {
          const cs = getComputedStyle(e);
          return {
            text: e.textContent!.trim(),
            family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(),
            weight: cs.fontWeight,
            clipped: e.scrollWidth > e.clientWidth + 1,
            right: e.getBoundingClientRect().right,
          };
        });
      return {
        display: [
          ...of(".dsv__g1names .dsv__name"),
          ...of(".dsv__g3names .dsv__name"),
          ...of(".dsv__g4 .dsv__name"),
        ],
        grid: of(".dsv__g2grid .dsv__name"),
        vw: window.innerWidth,
      };
    });
    expect(m.display.length, `@${w}`).toBe(5);
    for (const t of m.display) {
      expect(t.family, `@${w} ${t.text}`).toBe("adevas");
      // Adevas ships Regular only - anything heavier would be synthesised
      expect(t.weight, `@${w} ${t.text}`).toBe("400");
      // these get very large; they must still fit the page
      expect(t.clipped, `@${w} ${t.text} clipped`).toBe(false);
      expect(t.right, `@${w} ${t.text} inside the viewport`).toBeLessThanOrEqual(m.vw + 1);
    }
    // the group II grid is a different tier and deliberately keeps its face
    expect(m.grid.length, `@${w}`).toBe(4);
    for (const t of m.grid) expect(t.family, `@${w} ${t.text}`).toBe("optika");
  }
});

/* -------------------------------------------------------- 05 the favicon -- */

test("05 the browser is served the red brandbook sun", async ({ page }) => {
  const res = await page.request.get("/icon.svg");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/svg");
  const svg = await res.text();
  expect(svg).toContain("#d03e26");
  expect(svg, "the old placeholder disc is gone").not.toContain("#4E7CA8");
  expect((await page.request.get("/apple-icon.png")).status()).toBe(200);

  // and the document points at them, with nothing stale left behind
  await gotoRoute(page, "/");
  const icons = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')].map((l) =>
      l.getAttribute("href"),
    ),
  );
  expect(icons.length).toBeGreaterThan(0);
  for (const href of icons) expect(href).toMatch(/\/(icon\.svg|apple-icon\.png)/);
});

/* ------------------------------------------------- 06 the Lab Work slash -- */

test.describe("06 the Studio Lab filter separator", () => {
  for (const [label, prefix] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`is gone wherever the row wraps (${label})`, async ({ page }) => {
      for (const w of PHONES) {
        await page.setViewportSize({ width: w, height: 900 });
        await gotoRoute(page, `${prefix}/studio-lab`);
        const m = await page.locator(".dlb__filterrow").evaluate((row) => {
          const sep = row.querySelector(".dlb__filtersep") as HTMLElement | null;
          const link = row.querySelector(".dlb__labworklink") as HTMLElement;
          const lr = link.getBoundingClientRect();
          const arrow = link.querySelector("span")!.getBoundingClientRect();
          return {
            // no glyph AND no box: a display:none flex item takes no gap either
            sepWidth: sep ? sep.getBoundingClientRect().width : 0,
            sepShown: sep ? getComputedStyle(sep).display !== "none" : false,
            // the arrow stays on the label's line, with a real space before it
            arrowOnLine: Math.abs(arrow.top + arrow.height / 2 - (lr.top + lr.height / 2)) < 6,
            gapBeforeArrow: arrow.left - (lr.right - arrow.width - 0),
          };
        });
        expect(m.sepShown, `@${w} slash hidden`).toBe(false);
        expect(m.sepWidth, `@${w} slash takes no space`).toBe(0);
        expect(m.arrowOnLine, `@${w} arrow on the label's line`).toBe(true);
      }
    });
  }

  test("is still doing its job above the wrap", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio-lab");
    await expect(page.locator(".dlb__filtersep")).toBeVisible();
  });

  test("leaves a real space between LAB WORK and its arrow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoRoute(page, "/studio-lab");
    const gap = await page.locator(".dlb__labworklink").evaluate((el) => {
      const arrow = el.querySelector("span")!.getBoundingClientRect();
      const range = document.createRange();
      range.setStart(el.firstChild!, 0);
      range.setEnd(el.firstChild!, el.firstChild!.textContent!.trimEnd().length);
      return arrow.left - range.getBoundingClientRect().right;
    });
    expect(gap, "the arrow must not be jammed against the K").toBeGreaterThan(1);
  });
});

/* ----------------------------------------------------- 07 the burger menu -- */

test.describe("07 the burger navigation is one scale", () => {
  test("every English label is the same size", async ({ page }) => {
    for (const w of PHONES) {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/");
      await openMenu(page);
      const rows = await page.locator(".dao-nav__link").evaluateAll((els) =>
        els.map((e) => {
          const cs = getComputedStyle(e);
          return {
            text: e.textContent!.trim(),
            size: parseFloat(cs.fontSize),
            lines: Math.round(e.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
          };
        }),
      );
      expect(rows.length).toBe(8);
      const sizes = new Set(rows.map((r) => r.size.toFixed(2)));
      expect(sizes.size, `@${w} one scale, got ${[...sizes].join("/")}`).toBe(1);
      for (const r of rows) expect(r.lines, `@${w} ${r.text} on one line`).toBe(1);
    }
  });

  test("Georgian steps down only where its longest label cannot fit", async ({ page }) => {
    for (const w of PHONES) {
      await page.setViewportSize({ width: w, height: 844 });
      await gotoRoute(page, "/ka");
      await openMenu(page);
      const rows = await page.locator(".dao-nav__link").evaluateAll((els) =>
        els.map((e) => {
          const cs = getComputedStyle(e);
          return {
            text: e.textContent!.trim(),
            size: parseFloat(cs.fontSize),
            sm: e.classList.contains("dao-nav__link--sm"),
            lines: Math.round(e.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
          };
        }),
      );
      expect(rows.length).toBe(8);
      const shared = rows.find((r) => !r.sm)!.size;
      const stepped = rows.filter((r) => r.sm);
      // exactly one label steps down, and by far less than it used to
      expect(stepped.length, `@${w}`).toBe(1);
      expect(stepped[0].size / shared, `@${w} still primary hierarchy`).toBeGreaterThan(0.82);
      for (const r of rows) expect(r.lines, `@${w} ${r.text} on one line`).toBe(1);
    }
  });

  for (const [label, prefix] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`no width pushes the sheet sideways (${label})`, async ({ page }) => {
      for (const w of PHONES) {
        await page.setViewportSize({ width: w, height: 844 });
        await gotoRoute(page, `${prefix}/`);
        await openMenu(page);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(over, `@${w}`).toBeLessThanOrEqual(0);
      }
    });
  }
});

/* -------------------------------------------- 08 the brief option buttons -- */

test.describe("08 the Start a Project options are one system", () => {
  for (const [label, prefix] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`every option reads from the same edge (${label})`, async ({ page }) => {
      for (const w of PHONES) {
        await page.setViewportSize({ width: w, height: 900 });
        await gotoRoute(page, `${prefix}/start-a-project`);
        const m = await page.locator(".dbr__chip").evaluateAll((els) =>
          els.map((e) => {
            const r = e.getBoundingClientRect();
            const cs = getComputedStyle(e);
            // where the TEXT starts, not where the box does
            const range = document.createRange();
            range.setStart(e.firstChild!, 0);
            range.setEnd(e.firstChild!, e.firstChild!.textContent!.length);
            const rects = [...range.getClientRects()].filter((x) => x.width > 0);
            return {
              text: e.textContent!.trim(),
              align: cs.textAlign,
              padLeft: Math.round(Math.min(...rects.map((x) => x.left)) - r.left),
              lines: rects.length,
            };
          }),
        );
        expect(m.length).toBe(6);
        const pads = new Set(m.map((c) => c.padLeft));
        expect(pads.size, `@${w} one inset, got ${[...pads].join("/")}`).toBe(1);
        for (const c of m) expect(c.align, `@${w} ${c.text}`).toBe("left");
      }
    });
  }
});

/* ------------------------------------------------------ 10 the CTA arrow -- */

test.describe("10 a CTA label and its arrow are one object", () => {
  for (const [label, prefix] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`ALL SERVICES keeps its arrow (${label})`, async ({ page }) => {
      for (const w of ALL) {
        await page.setViewportSize({ width: w, height: 900 });
        await gotoRoute(page, `${prefix}/`);
        const m = await page.locator(".dao-svc__all").evaluate((el) => {
          el.scrollIntoView();
          const r = el.getBoundingClientRect();
          const arrow = el.querySelector("span")!.getBoundingClientRect();
          return {
            onOneLine: r.height < arrow.height * 1.8,
            arrowRightOfLabel: arrow.left > r.left,
            sameLine: Math.abs(arrow.top - r.top) < 4,
            over: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        expect(m.onOneLine, `@${w} one line`).toBe(true);
        expect(m.sameLine, `@${w} arrow on the label's line`).toBe(true);
        expect(m.arrowRightOfLabel, `@${w}`).toBe(true);
        expect(m.over, `@${w} overflow`).toBeLessThanOrEqual(0);
      }
    });
  }

  const ROUTES = ["/", "/services", "/studio", "/studio-lab"];
  for (const w of [1440, 1024, 390, 320]) {
    test(`no text CTA drops its arrow onto a line of its own @${w}`, async ({ page }) => {
      for (const prefix of ["", "/ka"]) {
        for (const route of ROUTES) {
          await page.setViewportSize({ width: w, height: 900 });
          await gotoRoute(page, `${prefix}${route}`);
          const orphans = await page.evaluate(() => {
            const out: string[] = [];
            for (const el of document.querySelectorAll<HTMLElement>(".dao-cta")) {
              const arrow = [...el.children].find((k) =>
                /^[→↗←↘]$/.test((k.textContent || "").trim()),
              );
              if (!arrow) continue;
              const ar = arrow.getBoundingClientRect();
              if (!ar.height) continue;
              const label = [...el.childNodes].filter((n) => n !== arrow);
              if (!label.length) continue;
              const range = document.createRange();
              range.setStartBefore(label[0]);
              range.setEndAfter(label[label.length - 1]);
              const rects = [...range.getClientRects()].filter((r) => r.height > 0 && r.width > 0);
              if (!rects.length) continue;
              const last = rects[rects.length - 1];
              const overlap = Math.min(last.bottom, ar.bottom) - Math.max(last.top, ar.top);
              if (overlap < Math.min(last.height, ar.height) * 0.4) {
                out.push(el.textContent!.trim().slice(0, 40));
              }
            }
            return out;
          });
          expect(orphans, `${prefix || "/en"}${route}`).toEqual([]);
        }
      }
    });
  }
});

/* ------------------------------------------------- 11 the responsive sweep - */

test.describe("11 no touched route overflows sideways", () => {
  const ROUTES = ["/", "/services", "/studio", "/studio-lab", "/start-a-project"];
  for (const w of ALL) {
    test(`in either locale @${w}`, async ({ page }) => {
      for (const prefix of ["", "/ka"]) {
        for (const route of ROUTES) {
          await page.setViewportSize({ width: w, height: 900 });
          await gotoRoute(page, `${prefix}${route}`);
          const over = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(over, `${prefix || "/en"}${route}`).toBeLessThanOrEqual(0);
        }
      }
    });
  }
});
