import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE CTA ARROW, AS RENDERED.
 *
 * The unit guards keep the drawn path in one module. These keep the rendered
 * result honest: every arrow-bearing CTA on every surface carries the same
 * drawn mark at the same geometry, in the CTA's own colour, and no CTA has gone
 * back to a text glyph - which is the thing that made the family inconsistent
 * in the first place, because a bare U+2192 is resolved from whatever font the
 * device feels like, emoji fonts included.
 *
 * Two families keep their glyphs BY DESIGN and are asserted to still have them:
 * the project sequence's PREVIOUS/NEXT navigation and the Lab's back links.
 * They are navigation, not the CTA family.
 */

/** the approved mark, wherever it is drawn */
const DRAWN = 'svg:has(path[d^="M1 6.4"])';

const ROUTES = [
  "/",
  "/studio",
  "/process",
  "/services",
  "/work",
  "/team",
  "/studio-lab",
  "/georgia-production",
  "/start-a-project",
] as const;

/** walk the page so reveal-on-scroll CTAs mount */
async function walk(page: Page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 120));
  });
}

async function survey(page: Page) {
  return page.evaluate(() => {
    const transformed = (el: Element) => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        const t = getComputedStyle(n).transform;
        if (t && t !== "none" && !/^matrix\(1, 0, 0, 1/.test(t)) return true;
      }
      return false;
    };
    const drawn = [...document.querySelectorAll("svg")].filter((s) =>
      s.querySelector('path[d^="M1 6.4"]'),
    );
    const marks = drawn.map((s) => {
      const r = s.getBoundingClientRect();
      const host = s.parentElement!;
      return {
        cls: s.getAttribute("class") ?? "",
        host: host.className.toString().slice(0, 40),
        hidden: !s.getClientRects().length,
        transformed: transformed(s),
        w: r.width,
        ratio: r.height ? r.width / r.height : 0,
        /* is this mark sized by .dao-arrow itself, or by a surface rule that
           was approved at its own box (22x8 in the What We Make register,
           34x10 on a Lab step, 54x13 on the Georgia CTA)? Only the first is
           the family this pass introduced, and only it carries the exact
           geometry contract. */
        sizedByCta:
          (s.getAttribute("class") ?? "").includes("dao-arrow") &&
          Math.abs(
            r.width - Math.min(46, Math.max(22, 2.6 * parseFloat(getComputedStyle(host).fontSize))),
          ) < 1.5,
        color: getComputedStyle(s).color,
        hostColor: getComputedStyle(host).color,
      };
    });
    /* an arrow glyph still inside something clickable */
    const glyphs: string[] = [];
    document.querySelectorAll("a, button").forEach((el) => {
      if (!/[→↗⟶]/.test(el.textContent ?? "")) return;
      // the two navigation families that keep theirs
      if (el.closest(".dpj__seqlink, .dsl__back, .dsc__back, .dao-mback")) return;
      glyphs.push(
        `${el.className.toString().slice(0, 40)} :: ${(el.textContent ?? "").trim().slice(0, 40)}`,
      );
    });
    return {
      marks,
      glyphs,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

for (const width of [1440, 390] as const) {
  test.describe(`the CTA arrow at ${width}`, () => {
    for (const route of ROUTES) {
      test(`${route}: one mark, one geometry, the CTA's own colour`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoRoute(page, route);
        await walk(page);
        const { marks, glyphs, overflow } = await survey(page);

        expect(glyphs, `a CTA still carries a text arrow on ${route}`).toEqual([]);
        expect(overflow, `${route} scrolls sideways at ${width}`).toBeLessThanOrEqual(1);

        for (const m of marks) {
          // §8: the CTA family paints itself from the CTA text. The older
          // surface-specific marks (.dsvc__worksarrow and friends) were
          // approved with their own colour and opacity and are left alone.
          if (m.cls.includes("dao-arrow")) {
            expect(m.color, `${m.host} arrow does not inherit its CTA colour`).toBe(m.hostColor);
          }
          if (m.hidden || m.transformed) continue;
          // never an icon, never a banner: 22px is the smallest size the drawn
          // system is approved at and 54px the largest (the Georgia CTA)
          expect(m.w, `${m.host} arrow is ${m.w.toFixed(1)}px wide`).toBeGreaterThanOrEqual(21);
          expect(m.w, `${m.host} arrow is ${m.w.toFixed(1)}px wide`).toBeLessThanOrEqual(56);
          // and the CTA family - the arrows this pass normalised - is the mark
          // at its true 46 x 12 proportion, at every type size and width
          if (m.sizedByCta) {
            expect(
              Math.abs(m.ratio - 46 / 12),
              `${m.host} CTA arrow is distorted (${m.w.toFixed(1)} x ${(m.w / m.ratio).toFixed(1)})`,
            ).toBeLessThan(0.05);
          }
        }
      });
    }

    test(`the route CTAs actually carry the mark at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const [route, selector] of [
        ["/", ".dao-intro__cta"],
        ["/", ".dao-work__all"],
        ["/process", ".dao-cta"],
        ["/studio", ".dst__slatecta"],
        ["/team", ".dtm__closecta"],
        ["/georgia-production", ".dgp__ctalink"],
        ["/start-a-project", ".dao-cta"],
      ] as const) {
        await gotoRoute(page, route);
        await walk(page);
        const cta = page.locator(selector).first();
        await cta.scrollIntoViewIfNeeded();
        await expect(cta.locator(DRAWN), `${route} ${selector} lost its arrow`).toHaveCount(1);
        // and the label is untouched by the swap
        expect((await cta.innerText()).trim().length, `${selector} lost its label`).toBeGreaterThan(
          2,
        );
      }
    });
  });
}

test.describe("the navigation arrows are not part of this family", () => {
  test("PREVIOUS / NEXT keep their own marks", async ({ page }) => {
    await gotoRoute(page, "/work/iced-classic-meama");
    const seq = page.locator(".dpj__seqends");
    await seq.scrollIntoViewIfNeeded();
    const text = await seq.innerText();
    expect(text, "the sequence navigation must keep its arrows").toMatch(/[←→]/);
    // and the end-of-archive CTA, which IS the CTA family, carries the drawn mark
    const end = page.locator(".dpj__seqlink--end");
    if (await end.count()) await expect(end.locator(DRAWN)).toHaveCount(1);
  });

  test("the Lab back link keeps its own mark", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const back = page.locator(".dsl__back").first();
    if (await back.count()) {
      expect(await back.innerText()).toContain("←");
      await expect(back.locator(DRAWN)).toHaveCount(0);
    }
  });
});
