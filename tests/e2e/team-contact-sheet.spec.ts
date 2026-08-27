import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * /team - the contact sheet, as built.
 *
 * The frame assertions are the point of this file: the approved correction is a
 * COMPLETE four-sided hand-drawn perimeter, so the geometry is measured rather
 * than assumed - four mask layers, per-axis sizing, and a rendered ink band on
 * every one of the four edges.
 */

/**
 * Bring a card fully into view and let the page settle, THEN return it.
 *
 * Playwright scrolls an element into view before clicking it. Measuring the
 * roster around an un-parked click therefore records Playwright's scroll, not
 * the page's - which is exactly the movement the morph tests exist to rule out.
 */
async function park(page: Page, nth: number) {
  const card = page.locator(".dtm__person").nth(nth);
  // instant, not smooth: the site sets scroll-behavior: smooth, so a plain
  // scrollIntoView is still animating when the click lands - and that animation,
  // not the page, is what an unparked measurement records
  await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(300);
  return card;
}

type Sample = { left: number; top: number; w: number; h: number; phase: string };

/**
 * Record the sheet's own box on the page's animation frames.
 *
 * Reading geometry over a per-frame round trip would race the transition; this
 * collects the whole travel in the page and hands it back afterwards, so the
 * assertions can be about the JOURNEY (where it starts, that it interpolates,
 * where it ends) rather than about any single frame.
 */
async function sampleTravel(page: Page, act: () => Promise<void>, settleMs: number) {
  await page.evaluate(() => {
    (window as unknown as { __dtm: unknown[] }).__dtm = [];
    const log = (window as unknown as { __dtm: unknown[] }).__dtm;
    const tick = () => {
      const el = document.querySelector(".dtm__morph");
      if (el) {
        const r = el.getBoundingClientRect();
        log.push({
          left: Math.round(r.left),
          top: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height),
          phase: document.querySelector(".dtm__stage")?.getAttribute("data-dtm-phase") ?? "gone",
        });
      }
      if (log.length < 200) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await act();
  await page.waitForTimeout(settleMs);
  return (await page.evaluate(() => (window as unknown as { __dtm: unknown[] }).__dtm)) as Sample[];
}

async function openFirst(page: Page) {
  const first = page.locator(".dtm__person").first();
  await first.click();
  await expect(page.locator(".dtm__dossier")).toHaveCount(1);
  return first;
}

/* ------------------------------------------------------- frame (§01) ------ */

test.describe("§01 the portrait frame is a complete four-sided perimeter", () => {
  test("composes four mask layers, two per axis, each pinned to a thin band", async ({ page }) => {
    await gotoRoute(page, "/team");
    const f = await page
      .locator(".dtm__frame")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el, "::after");
        return {
          image: cs.maskImage || cs.webkitMaskImage,
          size: cs.maskSize,
          position: cs.maskPosition,
          repeat: cs.maskRepeat,
          bg: cs.backgroundColor,
          shadow: cs.boxShadow,
          inset: [cs.top, cs.right, cs.bottom, cs.left].join(" "),
        };
      });
    expect((f.image.match(/ink-rule-h/g) || []).length).toBe(2);
    expect((f.image.match(/ink-rule-v/g) || []).length).toBe(2);
    expect(f.size).toBe("100% 6px, 100% 6px, 6px 100%, 6px 100%");
    expect(f.position).toBe("0px 0px, 0px 100%, 0px 0px, 100% 0px");
    expect(f.shadow).toBe("none");
    expect(f.inset).toBe("-5px -5px -5px -5px");
  });

  test("paints ink on all four edges, at the same thin weight", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await gotoRoute(page, "/team");
    const frame = page.locator(".dtm__person").first().locator(".dtm__frame");
    await frame.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    const box = (await frame.boundingBox())!;
    const pad = 24;
    const shot = await page.screenshot({
      clip: {
        x: box.x - pad,
        y: box.y - pad,
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      },
    });

    // decode the PNG in the browser, where a canvas is available
    const edges = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const { data, width: W, height: H } = ctx.getImageData(0, 0, c.width, c.height);
      const lum = (x: number, y: number) => {
        const i = (y * W + x) * 4;
        return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      };
      const scan = (side: string) => {
        const along = side === "top" || side === "bottom" ? W : H;
        let hit = 0;
        let total = 0;
        const thick: number[] = [];
        for (let i = 6; i < along - 6; i += 1) {
          let best = 999;
          let ref = 0;
          for (let d = 0; d < 40; d += 1) {
            const x = side === "left" ? d : side === "right" ? W - 1 - d : i;
            const y = side === "top" ? d : side === "bottom" ? H - 1 - d : i;
            const l = lum(x, y);
            if (l > ref) ref = l;
            if (l < best) best = l;
          }
          total += 1;
          const drop = ref - best;
          if (drop > 25) {
            hit += 1;
            let t = 0;
            for (let d = 0; d < 40; d += 1) {
              const x = side === "left" ? d : side === "right" ? W - 1 - d : i;
              const y = side === "top" ? d : side === "bottom" ? H - 1 - d : i;
              if (ref - lum(x, y) > drop * 0.45) t += 1;
            }
            thick.push(t);
          }
        }
        thick.sort((a, b) => a - b);
        return {
          side,
          coverage: (100 * hit) / total,
          median: thick[Math.floor(thick.length / 2)] ?? 0,
        };
      };
      return ["top", "right", "bottom", "left"].map(scan);
    }, shot.toString("base64"));

    for (const e of edges) {
      // a closed rectangle: the pen dries out here and there, but every side is
      // drawn end to end. A missing or letterboxed side scores far below this.
      expect(e.coverage, `${e.side} edge continuity`).toBeGreaterThan(88);
      // and stays thin - the correction asks for a drawn line, not a border
      expect(e.median, `${e.side} edge thickness`).toBeGreaterThan(0);
      expect(e.median, `${e.side} edge thickness`).toBeLessThanOrEqual(4);
    }
    // uniform: no side may be twice another, which was the original defect
    const meds = edges.map((e) => e.median);
    expect(Math.max(...meds)).toBeLessThanOrEqual(Math.min(...meds) * 2);
  });

  test("inks to brand red on hover, without moving the card", async ({ page }) => {
    await gotoRoute(page, "/team");
    const first = page.locator(".dtm__person").first();
    // settle the scroll BEFORE measuring: hover() scrolls the element into view,
    // which would otherwise look like the card moving
    await first.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    const before = await first.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.top), h: Math.round(r.height) };
    });
    await first.hover();
    await page.waitForTimeout(400);
    const state = await first.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const f = el.querySelector(".dtm__frame")!;
      return {
        ink: getComputedStyle(f, "::after").backgroundColor,
        y: Math.round(r.top),
        h: Math.round(r.height),
        transform: getComputedStyle(el).transform,
      };
    });
    expect(state.ink).toBe("rgb(208, 62, 38)");
    // §07: no lift, no scale
    expect(state.y).toBe(before.y);
    expect(state.h).toBe(before.h);
    expect(state.transform === "none" || state.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
  });

  test("uses the same complete frame on the Selected Work thumbnails", async ({ page }) => {
    await gotoRoute(page, "/team");
    const sizes = await page.evaluate(() => {
      // the rule is shared, so it holds for a work frame even when none renders
      const el = document.querySelector(".dtm__frame")!;
      return getComputedStyle(el, "::after").maskSize;
    });
    expect(sizes).toBe("100% 6px, 100% 6px, 6px 100%, 6px 100%");
    const css = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((s) => {
          try {
            return [...s.cssRules].map((r) => r.cssText);
          } catch {
            return [];
          }
        })
        .filter((t) => t.includes(".dtm__wframe::after"))
        .join(" "),
    );
    expect(css).toContain("ink-rule-h.svg");
    expect(css).toContain("ink-rule-v.svg");
  });
});

/* ------------------------------------------------ roster + departments ---- */

test.describe("the roster is one continuous contact sheet", () => {
  /**
   * SUPERSEDES "groups people under editorial headings, in the approved order"
   * and "renders no empty department". The roster used to be a stack of
   * per-department sections, each with a number, a heading, a count and a rule.
   * Both assertions are inverted here rather than dropped, so the change of
   * model stays legible: the studio reads as one company, and department is now
   * profile metadata rather than a divider in the landing grid.
   */
  test("shows no department heading, number, count or separator", async ({ page }) => {
    await gotoRoute(page, "/team");
    for (const sel of [
      ".dtm__deptname",
      ".dtm__deptno",
      ".dtm__deptc",
      ".dtm__deptrule",
      ".dtm__depthead",
      ".dtm__section",
    ]) {
      expect(await page.locator(sel).count(), sel).toBe(0);
    }
    // and no heading in the roster names a department either
    const roster = await page.locator(".dtm__sheet").innerText();
    expect(roster).not.toMatch(/\bPRODUCTION\b/);
    expect(roster).not.toMatch(/\bDIRECTION\b/);
    // still no filter bar
    expect(await page.locator("[role='tablist'], .dtm__filters").count()).toBe(0);
  });

  test("puts every person in ONE grid, in the prev/next order", async ({ page }) => {
    await gotoRoute(page, "/team");
    expect(await page.locator(".dtm__grid").count()).toBe(1);
    const inGrid = await page.locator(".dtm__grid .dtm__person").count();
    const total = await page.locator(".dtm__person").count();
    expect(total).toBeGreaterThan(1);
    expect(inGrid).toBe(total);
    // the visible sequence and the keyboard sequence are the same list
    const slugs = await page
      .locator(".dtm__person")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-dtm-card")));
    expect(slugs).toEqual([
      "production-01",
      "production-02",
      "production-03",
      "direction-01",
      "direction-02",
    ]);
  });

  test("runs the grid as one flow, with no gap where a department used to break", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const tops = await page
      .locator(".dtm__person")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    const rows = [...new Set(tops)].sort((a, b) => a - b);
    // five seats at four columns is two rows - not one row per department
    expect(rows.length).toBe(2);
    // and the second row follows the first by one row's pitch, not by a section break
    const heights = await page
      .locator(".dtm__person")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(rows[1] - rows[0]).toBeLessThan(Math.max(...heights) + 80);
  });

  test("still states the department inside the person's own profile", async ({ page }) => {
    await gotoRoute(page, "/team");
    const card = await park(page, 4);
    await card.click();
    await expect(page.locator('.dtm__stage[data-dtm-phase="open"]')).toHaveCount(1);
    // the fifth seat is in Direction, and its profile says so
    await expect(page.locator(".dtm__dept")).toContainText("DIRECTION");
  });

  test("states the page over two lines, not as a Meet the Team banner", async ({ page }) => {
    await gotoRoute(page, "/team");
    const title = await page.locator(".dtm__title").innerText();
    expect(title.replace(/\s+/g, " ").toUpperCase()).toBe("THE PEOPLE BEHIND THE WORK");
    expect(title.split("\n").filter(Boolean)).toHaveLength(2);
  });

  test("shows every seat as a marked blank, never as a person", async ({ page }) => {
    await gotoRoute(page, "/team");
    const slots = await page.locator(".dtm__slot").count();
    const people = await page.locator(".dtm__person").count();
    expect(slots).toBe(people);
    const text = await page.locator(".dtm__sheet").innerText();
    expect(text).toContain("NAME PENDING");
    // and the roster says it is unconfirmed, so the count is not a claim
    await expect(page.locator(".dtm__provisional")).toHaveCount(1);
  });
});

/* --------------------------------------------- expanded profile (§08/§11) - */

test.describe("§08/§11 the expanded profile", () => {
  /**
   * SUPERSEDES "opens in place, keeps the route, and pushes the rows below
   * down". The roster used to be pushed by an inserted grid row; it now stays
   * exactly where it was while the profile opens over it, so this asserts the
   * inverse - the same measurement, the opposite expectation.
   */
  test("opens over the roster without moving a single card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const second = await park(page, 1);
    // and the card that gets clicked is parked too, so nothing scrolls at all
    await park(page, 0);
    const before = await second.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), h: Math.round(r.height) };
    });
    const docBefore = await page.evaluate(() => document.body.scrollHeight);
    await openFirst(page);
    await page.waitForTimeout(700);
    const after = await second.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), h: Math.round(r.height) };
    });
    // nothing reflows: the sheet is fixed, and the seat it came from keeps its
    // box in the grid
    expect(after.top).toBe(before.top);
    expect(after.h).toBe(before.h);
    expect(await page.evaluate(() => document.body.scrollHeight)).toBe(docBefore);
    expect(new URL(page.url()).pathname).toBe("/team");
    expect(new URL(page.url()).searchParams.get("person")).toBeTruthy();
  });

  test("holds the page still - no scroll jump on open, exact restore on close", async ({
    page,
  }) => {
    // the regression this replaces measured scrollY 0 -> 1041 on open
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/team");
    const card = await park(page, 1);
    const at = await page.evaluate(() => Math.round(window.scrollY));
    // a real scroll offset, or the test would pass on a page that never moved
    expect(at).toBeGreaterThan(0);
    await card.click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    // the document behind it cannot be scrolled away underneath the sheet
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
      "hidden",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
  });

  test("grows out of the clicked card and settles centred", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const card = await park(page, 1);
    const origin = await card.locator(".dtm__frame").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    const seen = await sampleTravel(page, () => card.click(), 1000);
    expect(seen.length, "the travel produced frames").toBeGreaterThan(8);
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));

    // it starts life on the card. One frame of a 520ms ease can already have
    // moved a little, so the tolerance is a frame's worth - still a fraction of
    // the ~950px this box is about to travel.
    const first = seen[0];
    expect(Math.abs(first.left - origin.left), "starts at the card's left").toBeLessThanOrEqual(30);
    expect(Math.abs(first.top - origin.top), "starts at the card's top").toBeLessThanOrEqual(30);
    expect(Math.abs(first.w - origin.w), "starts at the card's width").toBeLessThanOrEqual(30);
    expect(Math.abs(first.h - origin.h), "starts at the card's height").toBeLessThanOrEqual(30);
    // and it starts far nearer the card than the sheet it becomes
    expect(first.w, "starts nowhere near sheet width").toBeLessThan(vp.w * 0.4);

    // it travels, rather than cutting straight to the sheet
    const mid = seen.filter((x) => x.w > origin.w + 40 && x.w < vp.w * 0.78);
    expect(mid.length, "the geometry is interpolated, not switched").toBeGreaterThan(3);
    expect(
      seen.some((x) => x.phase === "settling"),
      "the travel is a real state",
    ).toBe(true);

    // and it ends as a large centred sheet
    const last = seen[seen.length - 1];
    expect(last.phase).toBe("open");
    expect(Math.abs(last.left + last.w / 2 - vp.w / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(last.top + last.h / 2 - vp.h / 2)).toBeLessThanOrEqual(2);
    expect(last.w).toBeGreaterThan(vp.w * 0.8);
    // the height is a CAP, not a fixed size: this reserved seat is short, so the
    // sheet is short. What must hold is that it never exceeds the cap.
    expect(last.h).toBeLessThanOrEqual(Math.min(vp.h * 0.86, 900) + 1);
    expect(last.h).toBeGreaterThan(200);
    // it is inside the viewport - never something you have to scroll down to
    expect(last.w).toBeLessThan(vp.w);
    expect(last.h).toBeLessThan(vp.h);
    expect(last.left).toBeGreaterThan(0);
    expect(last.top).toBeGreaterThan(0);
  });

  test("the seat it came from is held, not collapsed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const card = await park(page, 0);
    const box = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    await openFirst(page);
    await page.waitForTimeout(700);
    const held = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        vis: getComputedStyle(el).visibility,
        disp: getComputedStyle(el).display,
      };
    });
    expect(held.vis).toBe("hidden");
    expect(held.disp).not.toBe("none");
    expect(held.w).toBe(box.w);
    expect(held.h).toBe(box.h);
  });

  test("reverses the travel on close and lands back on the card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const card = await park(page, 1);
    const origin = await card.locator(".dtm__frame").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    await card.click();
    await page.waitForTimeout(900);
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));

    const seen = await sampleTravel(page, () => page.keyboard.press("Escape"), 1100);
    expect(seen.length, "the close produced frames").toBeGreaterThan(8);

    // it leaves from the sheet's rest position...
    const first = seen[0];
    expect(first.w).toBeGreaterThan(vp.w * 0.8);
    // ...goes through the closing phase...
    expect(
      seen.some((x) => x.phase === "closing"),
      "close is a phase, not an unmount",
    ).toBe(true);
    // ...interpolates back rather than snapping...
    const mid = seen.filter((x) => x.w > origin.w + 40 && x.w < vp.w * 0.78);
    expect(mid.length, "the return is interpolated too").toBeGreaterThan(3);
    // ...and the last frame before it goes is standing on the card again
    const last = seen[seen.length - 1];
    expect(Math.abs(last.left - origin.left), "lands on the card's left").toBeLessThanOrEqual(30);
    expect(Math.abs(last.top - origin.top), "lands on the card's top").toBeLessThanOrEqual(30);
    expect(Math.abs(last.w - origin.w), "lands at the card's width").toBeLessThanOrEqual(30);
    expect(Math.abs(last.h - origin.h), "lands at the card's height").toBeLessThanOrEqual(30);

    // then it is gone, the card is back, and focus is on it
    await expect(page.locator(".dtm__stage")).toHaveCount(0);
    await expect(card).toBeFocused();
    expect(await card.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  });

  test("Back closes the profile instead of leaving Team", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    await page.waitForTimeout(700);
    await page.goBack();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    // still on the roster, query cleared
    expect(new URL(page.url()).pathname).toBe("/team");
    expect(new URL(page.url()).searchParams.get("person")).toBeNull();
    await expect(page.locator(".dtm__grid").first()).toBeVisible();
  });

  test("stepping does not stack history, so one Back still returns to the roster", async ({
    page,
  }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    await page.waitForTimeout(700);
    await page.locator(".dtm__nav .dtm__tcta").nth(1).click();
    await page.waitForTimeout(400);
    await page.locator(".dtm__nav .dtm__tcta").nth(1).click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get("person")).toBe("production-03");
    await page.goBack();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get("person")).toBeNull();
  });

  test("stepping never collapses back to the roster", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    await openFirst(page);
    await page.waitForTimeout(750);
    const before = await page.evaluate(() => {
      const r = document.querySelector(".dtm__morph")!.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    await page.locator(".dtm__nav .dtm__tcta").nth(1).click();
    // sampled immediately: the sheet must not shrink towards a card at any point
    for (let i = 0; i < 6; i++) {
      const now = await page.evaluate(() => {
        const el = document.querySelector(".dtm__morph");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          w: Math.round(r.width),
          h: Math.round(r.height),
          phase: document.querySelector(".dtm__stage")?.getAttribute("data-dtm-phase"),
        };
      });
      expect(now, "sample " + i).not.toBeNull();
      expect(now!.phase, "sample " + i).toBe("open");
      expect(now!.w, "sample " + i).toBe(before.w);
      expect(now!.h, "sample " + i).toBe(before.h);
      await page.waitForTimeout(60);
    }
  });

  /**
   * SUPERSEDES "is not a modal: no dialog role, no overlay, no scroll lock".
   * Every one of those four assertions is now inverted, because the interaction
   * it described has been replaced rather than relaxed. What is NOT inverted is
   * the editorial character: the backdrop stays a light wash, not a dark scrim,
   * and the sheet keeps its plain rectangular edge.
   */
  test("is a dialog: overlay, fixed sheet, scroll lock - but not a generic modal", async ({
    page,
  }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    await page.waitForTimeout(700);
    const state = await page.evaluate(() => {
      const d = document.querySelector(".dtm__dossier")!;
      const morph = document.querySelector(".dtm__morph")!;
      const back = document.querySelector(".dtm__backdrop")!;
      const bs = getComputedStyle(back);
      const ds = getComputedStyle(d);
      return {
        role: d.getAttribute("role"),
        modal: d.getAttribute("aria-modal"),
        morphPosition: getComputedStyle(morph).position,
        htmlOverflow: getComputedStyle(document.documentElement).overflow,
        backdrop: bs.backgroundColor,
        backdropFilter: bs.backdropFilter,
        radius: ds.borderTopLeftRadius,
        shadow: ds.boxShadow,
      };
    });
    expect(state.role).toBe("dialog");
    expect(state.modal).toBe("true");
    expect(state.morphPosition).toBe("fixed");
    expect(state.htmlOverflow).toBe("hidden");
    // a light ink wash, still well short of a dark modal scrim
    expect(state.backdrop).toMatch(/^rgba\(19, 18, 16, 0\.2/);
    expect(state.backdropFilter === "none" || state.backdropFilter === "").toBe(true);
    // and the sheet is still paper: square corners, no drop shadow
    expect(state.radius).toBe("0px");
    expect(state.shadow).toBe("none");
  });

  test("holds the keyboard inside the sheet while it is up", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    await page.waitForTimeout(700);
    // tab all the way round; focus must never leave the sheet
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest(".dtm__morph"));
      expect(inside, "tab " + (i + 1)).toBe(true);
    }
  });

  test("closes when the page behind it is clicked", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const first = await openFirst(page);
    await page.waitForTimeout(700);
    await page.locator(".dtm__backdrop").click({ position: { x: 8, y: 8 } });
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await expect(first).toBeFocused();
  });

  test("announces state, takes focus, closes on Escape and restores focus", async ({ page }) => {
    await gotoRoute(page, "/team");
    const first = page.locator(".dtm__person").first();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".dtm__dossier")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    // and the query is cleared again
    expect(new URL(page.url()).searchParams.get("person")).toBeNull();
  });

  test("opens from the keyboard alone", async ({ page }) => {
    await gotoRoute(page, "/team");
    const first = page.locator(".dtm__person").first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
  });

  test("steps to the next person and disables the ends", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    await expect(page.locator(".dtm__nav .dtm__tcta").first()).toBeDisabled();
    await page.locator(".dtm__nav .dtm__tcta").nth(1).click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get("person")).toBe("production-02");
    await expect(page.locator(".dtm__nav .dtm__tcta").first()).toBeEnabled();
  });

  test("deep links straight into a person", async ({ page }) => {
    await gotoRoute(page, "/team?person=direction-01");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await expect(page.locator(".dtm__dept")).toContainText("DIRECTION");
  });

  test("shows only the blocks that have content", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    // a reserved seat has nothing, so there are no labelled blanks at all
    expect(await page.locator(".dtm__fieldk").count()).toBe(0);
    expect(await page.locator(".dtm__work").count()).toBe(0);
    expect(await page.locator(".dtm__links").count()).toBe(0);
    // and it says why, rather than opening onto a void
    await expect(page.locator(".dtm__awaiting")).toHaveCount(1);
  });
});

/* ------------------------------------------------------- mobile (§12) ----- */

test.describe("§12 mobile", () => {
  for (const width of [430, 390, 375, 360, 320]) {
    test(`one person per row, no overflow, at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/team", "/ka/team"]) {
        await gotoRoute(page, route);
        const m = await page.evaluate(() => {
          const grid = document.querySelector(".dtm__grid") as HTMLElement;
          const card = document.querySelector(".dtm__person") as HTMLElement;
          const cs = getComputedStyle(card);
          return {
            gridDisplay: getComputedStyle(grid).flexDirection,
            cols: cs.gridTemplateColumns.split(" ").length,
            minH: parseFloat(cs.minHeight),
            over: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        // the roster is a column of rows, and each row is portrait + text
        expect(m.gridDisplay, `${route} @${width}`).toBe("column");
        expect(m.cols, `${route} @${width}`).toBe(2);
        expect(m.minH).toBeGreaterThanOrEqual(44);
        expect(m.over, `${route} @${width} overflow`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("the profile is full width with a reachable close, and does not overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoRoute(page, "/team");
    await openFirst(page);
    const m = await page.evaluate(() => {
      const slug = document.querySelector(".dtm__slug") as HTMLElement;
      const close = [...document.querySelectorAll(".dtm__nav .dtm__tcta")].pop() as HTMLElement;
      return {
        sticky: getComputedStyle(slug).position,
        closeH: close.getBoundingClientRect().height,
        over: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(m.sticky).toBe("sticky");
    expect(m.closeH).toBeGreaterThanOrEqual(44);
    expect(m.over).toBeLessThanOrEqual(0);
  });

  for (const width of [430, 390, 375, 360, 320]) {
    test(
      "the same morph, near-full-screen and inside the viewport, at " + width,
      async ({ page }) => {
        await page.setViewportSize({ width, height: 780 });
        await gotoRoute(page, "/team");
        const card = await park(page, 1);
        const at = await page.evaluate(() => Math.round(window.scrollY));
        await card.click();
        await expect(page.locator(".dtm__dossier")).toHaveCount(1);
        await page.waitForTimeout(950);
        const m = await page.evaluate(() => {
          const el = document.querySelector(".dtm__morph") as HTMLElement;
          const r = el.getBoundingClientRect();
          const doss = document.querySelector(".dtm__dossier") as HTMLElement;
          return {
            left: Math.round(r.left),
            top: Math.round(r.top),
            w: Math.round(r.width),
            h: Math.round(r.height),
            vw: window.innerWidth,
            vh: window.innerHeight,
            position: getComputedStyle(el).position,
            // a long profile has to be readable, so the sheet scrolls itself
            scrollable: getComputedStyle(doss).overflowY,
            over: document.documentElement.scrollWidth - window.innerWidth,
            y: Math.round(window.scrollY),
          };
        });
        // it is the same object: fixed, over the page, not a new page
        expect(m.position, "@" + width).toBe("fixed");
        // near-full-screen, and still wholly inside the viewport
        expect(m.w, "@" + width + " width").toBeGreaterThan(m.vw * 0.9);
        expect(m.left + m.w, "@" + width + " right edge").toBeLessThanOrEqual(m.vw);
        expect(m.top, "@" + width + " top edge").toBeGreaterThanOrEqual(0);
        expect(m.top + m.h, "@" + width + " bottom edge").toBeLessThanOrEqual(m.vh);
        expect(m.scrollable, "@" + width).toBe("auto");
        // nothing pushed sideways, and the roster did not move underneath
        expect(m.over, "@" + width + " overflow").toBeLessThanOrEqual(0);
        expect(m.y, "@" + width + " scroll held").toBe(at);
        // and closing puts the page back exactly as it was
        await page.locator(".dtm__dossier .dtm__tcta").last().click();
        await expect(page.locator(".dtm__stage")).toHaveCount(0);
        expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
      },
    );
  }
});

/* -------------------------------------------- reduced motion (§11) -------- */

test.describe("§11 reduced motion", () => {
  test("no travel at all, and every part of the interaction still works", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    // emulated on the page rather than declared as a fixture, so this does not
    // depend on the option being present in the installed Playwright
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoRoute(page, "/team");
    const card = await park(page, 1);
    const at = await page.evaluate(() => Math.round(window.scrollY));

    // the sheet never stands on the card: it is simply present, centred
    const seen = await sampleTravel(page, () => card.click(), 500);
    expect(seen.length).toBeGreaterThan(4);
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    for (const [n, f] of seen.entries()) {
      expect(f.phase, "frame " + n + " never travels").toBe("open");
      expect(f.w, "frame " + n + " is already the sheet").toBeGreaterThan(vp.w * 0.8);
    }

    // and the rest of the contract is untouched
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    await expect(page.locator(".dtm__dossier")).toBeFocused();
    expect(
      await page.locator(".dtm__dossier").evaluate((el) => el.getAttribute("aria-modal")),
    ).toBe("true");
    // the parked card is the SECOND seat, so next is the third
    await page.locator(".dtm__nav .dtm__tcta").nth(1).click();
    await page.waitForTimeout(200);
    expect(new URL(page.url()).searchParams.get("person")).toBe("production-03");
    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__stage")).toHaveCount(0);
    // after stepping, the sheet belongs to the third seat - so that is the card
    // it returns to, and the card that takes focus. Returning to the seat the
    // journey started from would land the sheet on the wrong person.
    await expect(page.locator(".dtm__person").nth(2)).toBeFocused();
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    expect(new URL(page.url()).searchParams.get("person")).toBeNull();
  });
});

/* ----------------------------------------------------- EN / KA (§13) ------ */

test.describe("§13 EN and KA", () => {
  test("both locales render the roster in their own language", async ({ page }) => {
    await gotoRoute(page, "/team");
    const en = await page.locator(".dtm__title").innerText();
    await gotoRoute(page, "/ka/team");
    const ka = await page.locator(".dtm__title").innerText();
    expect(en).toMatch(/THE PEOPLE/);
    expect(ka).toMatch(/[Ⴀ-ჿ]/);
    // the roster carries no department headings any more, so what has to be
    // Georgian is the roster copy itself
    expect(await page.locator(".dtm__deptname").count()).toBe(0);
    expect(await page.locator(".dtm__provisional").innerText()).toMatch(/[Ⴀ-ჿ]/);
    const card = await park(page, 0);
    await card.click();
    await expect(page.locator('.dtm__stage[data-dtm-phase="open"]')).toHaveCount(1);
    // and the department, which now lives in the profile, is Georgian there
    expect(await page.locator(".dtm__dept").innerText()).toMatch(/[Ⴀ-ჿ]/);
  });

  test("leaves no English marked blank on the Georgian route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/ka/team");
    const roster = await page.locator(".dtm__sheet").innerText();
    expect(roster).not.toMatch(/NAME PENDING|PORTRAIT PENDING|ROLE PENDING/);
    // the marked blanks are still THERE - they just read in Georgian
    expect(await page.locator(".dtm__slot").count()).toBeGreaterThan(0);
    expect(await page.locator(".dtm__pendingmark").first().innerText()).toMatch(/[Ⴀ-ჿ]/);
    const card = await park(page, 0);
    await card.click();
    await expect(page.locator('.dtm__stage[data-dtm-phase="open"]')).toHaveCount(1);
    const sheet = await page.locator(".dtm__dossier").innerText();
    expect(sheet).not.toMatch(/NAME PENDING|PORTRAIT PENDING|ROLE PENDING/);
    expect(sheet).toMatch(/[Ⴀ-ჿ]/);
  });

  test("the profile opens in KA too, and keeps the /ka prefix", async ({ page }) => {
    await gotoRoute(page, "/ka/team");
    await openFirst(page);
    expect(new URL(page.url()).pathname).toBe("/ka/team");
    await expect(page.locator(".dtm__awaiting")).toHaveCount(1);
    expect(await page.locator(".dtm__awaiting").innerText()).toMatch(/[Ⴀ-ჿ]/);
  });
});

/* -------------------------------------------------- Studio → Team (§15) --- */

test("§15 the Studio slate still routes to the team", async ({ page }) => {
  await gotoRoute(page, "/studio");
  const slate = page.locator("[data-dao-team-cta]");
  await expect(slate).toHaveAttribute("href", "/team");
  await slate.click();
  await page.waitForURL(/\/team$/);
  await expect(page.locator(".dtm__title")).toBeVisible();
  await gotoRoute(page, "/ka/studio");
  await expect(page.locator("[data-dao-team-cta]")).toHaveAttribute("href", "/ka/team");
});

/* ----------------------------------------------------- responsive QA ------ */

test.describe("no horizontal overflow on /team", () => {
  for (const width of [1440, 1024, 768, 430, 390, 375, 360, 320]) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/team", "/ka/team"]) {
        await gotoRoute(page, route);
        let over = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(over, `${route} @${width} closed`).toBeLessThanOrEqual(0);
        await openFirst(page);
        over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${route} @${width} open`).toBeLessThanOrEqual(0);
      }
    });
  }
});

/* ------------------------------------------- refinement pass (§01/§02) ---- */

test.describe("§01 exactly one close control", () => {
  test("the sheet offers previous, next and a single close", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    const controls = await page
      .locator(".dtm__dossier .dtm__tcta")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText.trim()));
    expect(controls).toHaveLength(3);
    expect(controls.filter((c) => /CLOSE/i.test(c))).toHaveLength(1);
    // and nothing resembling a second nav row at the foot
    expect(await page.locator(".dtm__dfoot").count()).toBe(0);
  });

  test("close is still reachable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await gotoRoute(page, "/team");
    await openFirst(page);
    const close = page.locator(".dtm__dossier .dtm__tcta").last();
    await expect(close).toBeVisible();
    const h = await close.evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(44);
    await close.click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
  });
});

test.describe("§02 the portrait footprint is reduced", () => {
  /** measured on the pre-refinement build, at the same viewports */
  const BEFORE = {
    1440: { roster: 438, profile: 395 },
    1024: { roster: 298, profile: 395 },
    390: { roster: 119, profile: 320 },
  } as const;

  for (const width of [1440, 1024, 390] as const) {
    test(`is about two thirds of its former size at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await gotoRoute(page, "/team");
      const roster = await page
        .locator(".dtm__frame")
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().width));
      await openFirst(page);
      await page.waitForTimeout(300);
      const profile = await page
        .locator(".dtm__bigframe .dtm__frame")
        .evaluate((el) => Math.round(el.getBoundingClientRect().width));

      const b = BEFORE[width];
      // the target is 65-70%; allow a little slack for grid rounding per width
      expect(roster / b.roster, `roster @${width}`).toBeLessThan(0.78);
      expect(roster / b.roster, `roster @${width}`).toBeGreaterThan(0.55);
      expect(profile / b.profile, `profile @${width}`).toBeLessThan(0.78);
      expect(profile / b.profile, `profile @${width}`).toBeGreaterThan(0.55);
    });
  }

  test("the frame stays complete and thin at the smaller size", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    const f = await page
      .locator(".dtm__frame")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el, "::after");
        return { size: cs.maskSize, shadow: cs.boxShadow, image: cs.maskImage };
      });
    expect(f.size).toBe("100% 6px, 100% 6px, 6px 100%, 6px 100%");
    expect((f.image.match(/ink-rule-h/g) || []).length).toBe(2);
    expect((f.image.match(/ink-rule-v/g) || []).length).toBe(2);
    expect(f.shadow).toBe("none");
  });
});

test.describe("§03-§12 the profile collapses and expands with its content", () => {
  test("a reserved seat shows no empty blocks and stays short", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoRoute(page, "/team");
    await openFirst(page);
    // the sheet must have SETTLED before it is measured: mid-travel the dossier
    // is deliberately larger than the box clipping it
    await expect(page.locator('.dtm__stage[data-dtm-phase="open"]')).toHaveCount(1);
    await page.waitForTimeout(120);
    const m = await page.evaluate(() => ({
      blocks: document.querySelectorAll(".dtm__blockk").length,
      fields: document.querySelectorAll(".dtm__fieldk").length,
      work: document.querySelectorAll(".dtm__work").length,
      portfolio: document.querySelectorAll(".dtm__portfolio").length,
      contact: document.querySelectorAll(".dtm__contact").length,
      awaiting: document.querySelectorAll(".dtm__awaiting").length,
      // SUPERSEDED measurement: the sheet used to be as tall as its content,
      // so a short profile made a short sheet. The sheet is now a fixed size, so
      // what has to stay short is the CONTENT inside it.
      content: Math.round(
        document.querySelector(".dtm__dossier > *:last-child")!.getBoundingClientRect().bottom -
          document.querySelector(".dtm__slug")!.getBoundingClientRect().top,
      ),
      scrolls:
        document.querySelector(".dtm__dossier")!.scrollHeight >
        document.querySelector(".dtm__dossier")!.clientHeight,
    }));
    // no labelled blanks, no meaningless dashes
    expect(m.blocks).toBe(0);
    expect(m.fields).toBe(0);
    expect(m.work).toBe(0);
    expect(m.portfolio).toBe(0);
    expect(m.contact).toBe(0);
    // it says why instead, in one line, and the sheet stays compact
    expect(m.awaiting).toBe(1);
    expect(m.content).toBeLessThan(620);
    // and a profile this short never needs scrolling to read
    expect(m.scrolls).toBe(false);
  });
});

/* -------------------------------------- §23-§29 external portfolio CTA ---- */

test.describe("§23-§29 the external portfolio CTA", () => {
  /**
   * The site's data carries no confirmed portfolio URL, and must not gain a fake
   * one, so what is asserted here is the ABSENT branch against real data plus the
   * non-interference contract. The present branch is rendered and asserted in
   * tests/unit/team-portfolio-cta.test.ts, which builds a synthetic card.
   */
  for (const [label, route] of [
    ["EN", "/team"],
    ["KA", "/ka/team"],
  ] as const) {
    test(`renders nothing at all when no portfolio exists (${label})`, async ({ page }) => {
      await gotoRoute(page, route);
      await openFirst(page);
      expect(await page.locator(".dtm__portfolio").count()).toBe(0);
      const text = await page.locator(".dtm__dossier").innerText();
      // no stand-in, no dead link, no "pending" label
      expect(text).not.toMatch(/portfolio/i);
      expect(await page.locator('.dtm__dossier a[href="#"]').count()).toBe(0);
      // and the sheet closes up rather than leaving a gap where it would sit
      expect(await page.locator(".dtm__actions").count()).toBe(0);
    });
  }

  test("its absence does not disturb close, previous or next", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    const controls = page.locator(".dtm__dossier .dtm__tcta");
    await expect(controls).toHaveCount(3);
    // next still steps
    await controls.nth(1).click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get("person")).toBe("production-02");
    // previous still steps back
    await page.locator(".dtm__dossier .dtm__tcta").first().click();
    await page.waitForTimeout(400);
    expect(new URL(page.url()).searchParams.get("person")).toBe("production-01");
    // close still closes and restores focus
    await page.locator(".dtm__dossier .dtm__tcta").last().click();
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    await expect(page.locator(".dtm__person").first()).toBeFocused();
  });

  test("SELECTED WORK stays internal, and is not confused with a portfolio", async ({ page }) => {
    await gotoRoute(page, "/team");
    await openFirst(page);
    // a reserved seat has no credits, so the block is absent rather than empty
    expect(await page.locator(".dtm__work").count()).toBe(0);
    // whenever it does render, every card is an internal /work route
    const external = await page.evaluate(
      () =>
        [...document.querySelectorAll(".dtm__wcard")].filter(
          (a) => (a as HTMLAnchorElement).target === "_blank",
        ).length,
    );
    expect(external).toBe(0);
  });

  for (const width of [390, 375]) {
    test(`the CTA slot does not break the mobile header at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/team");
      await openFirst(page);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(over).toBeLessThanOrEqual(0);
      expect(await page.locator(".dtm__portfolio").count()).toBe(0);
      // close is still the reachable control on mobile
      const close = page.locator(".dtm__dossier .dtm__tcta").last();
      expect(
        await close.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    });
  }
});
