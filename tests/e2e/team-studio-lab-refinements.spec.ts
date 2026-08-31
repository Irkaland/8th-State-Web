import { test, expect, type Page } from "@playwright/test";

/**
 * TEAM + STUDIO LAB refinements.
 *
 * Three defects, each with a measured cause rather than a guessed one:
 *
 *  1. Every Team portrait was a different size. The card is a <button>, and a
 *     button's `width: auto` is shrink-to-fit rather than the stretch a div
 *     takes - so each card was only as wide as its own longest line of text and
 *     the frame inside inherited it. At 1440 that ran from a 159px frame for
 *     "Keto Kiladze" to the 286px cap for "Lasha Bedianashvili": the portraits
 *     were being sized by the length of a person's name.
 *
 *  2. A red outline was drawn 8px outside the WHOLE card on focus - a second
 *     rectangle competing with the one frame the design actually has.
 *
 *  3. Studio Lab opened on a huge empty field on phones. The ornament is
 *     absolutely positioned on desktop and costs no layout; the mobile override
 *     turned it back into a 249px in-flow block above the body, pushing the
 *     title to 422px into an 812px viewport.
 */

const DESKTOP = { width: 1440, height: 1000 };

async function enter(page: Page, path: string) {
  await page.goto(path);
  await page
    .locator(".dao-ident")
    .waitFor({ state: "hidden", timeout: 15000 })
    .catch(() => {});
}

/** every portrait frame's rendered box, in document order */
function frames(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".dtm__frame")].map((f) => {
      const r = f.getBoundingClientRect();
      const btn = f.closest("[data-dtm-card]");
      return {
        slug: btn?.getAttribute("data-dtm-card") ?? "?",
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    }),
  );
}

test.describe("Team desktop: one portrait size", () => {
  test.use({ viewport: DESKTOP });

  test("all 13 portraits match the canonical frame", async ({ page }) => {
    await enter(page, "/team");
    const got = await frames(page);
    expect(got).toHaveLength(13);

    // Mariam is the reference the design is read from. After the fix her frame
    // IS the designed size, so every other portrait has to equal it.
    const canonical = got.find((f) => f.slug === "mariam-kandiashvili");
    expect(canonical, "the reference portrait is missing").toBeTruthy();
    expect(canonical!.w).toBeGreaterThan(0);

    // 1px for subpixel rounding, and nothing more - the defect this catches was
    // a 130px spread, not a rounding difference
    for (const f of got) {
      expect(
        Math.abs(f.w - canonical!.w),
        `${f.slug} width ${f.w} vs ${canonical!.w}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(f.h - canonical!.h),
        `${f.slug} height ${f.h} vs ${canonical!.h}`,
      ).toBeLessThanOrEqual(1);
    }
    // and the shape the design specifies, not an accidental one
    expect(canonical!.w / canonical!.h).toBeCloseTo(0.8, 1);
  });

  for (const width of [1600, 1280, 1024] as const) {
    test(`portraits stay uniform at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await enter(page, "/team");
      const got = await frames(page);
      const sizes = new Set(got.map((f) => `${f.w}x${f.h}`));
      expect([...sizes], `portraits differ at ${width}`).toHaveLength(1);
    });
  }
});

test.describe("Team: focus is perceivable without boxing the card", () => {
  test.use({ viewport: DESKTOP });

  test("no outline around the whole card, and the name carries the state", async ({ page }) => {
    await enter(page, "/team");
    const state = await page.evaluate(() => {
      const btn = document.querySelectorAll<HTMLElement>("[data-dtm-card]")[2];
      const read = () => {
        const cs = getComputedStyle(btn);
        const name = btn.querySelector(".dtm__pname") as HTMLElement | null;
        const ncs = name ? getComputedStyle(name) : null;
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          borderTopWidth: cs.borderTopWidth,
          decoration: ncs?.textDecorationLine ?? "",
          decorationColor: ncs?.textDecorationColor ?? "",
          decorationThickness: ncs?.textDecorationThickness ?? "",
        };
      };
      const before = read();
      btn.focus();
      return { before, after: read(), focused: document.activeElement === btn };
    });

    expect(state.focused).toBe(true);
    // THE fix: no rectangle drawn around the card
    expect(state.after.outlineStyle, "the whole-card outline is back").toBe("none");
    expect(state.after.borderTopWidth, "a border replaced the outline").toBe("0px");

    // but focus is still announced visually, and it CHANGES on focus - a state
    // that looks identical focused and unfocused is not an indicator
    expect(state.after.decoration, "focus is not perceivable").toContain("underline");
    expect(state.after.decoration).not.toBe(state.before.decoration);
    expect(state.after.decorationThickness).not.toBe("auto");
  });
});

test.describe("Personnel file on a phone: the header holds", () => {
  for (const [width, height] of [
    [390, 664],
    [375, 640],
    [320, 568],
  ] as const) {
    test(`nothing scrolls above the controls at ${width}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height });
      await enter(page, "/team");
      await page.locator("[data-dtm-card]").nth(1).click();
      await page.locator(".dtm__dossier").waitFor({ timeout: 10000 });
      // the sheet morphs open from the card; wait for it to actually arrive
      await page
        .waitForFunction(
          (h) =>
            (document.querySelector(".dtm__morph") as HTMLElement)?.getBoundingClientRect().height >
            h * 0.6,
          height,
          { timeout: 15000 },
        )
        .catch(() => {});
      await page.waitForTimeout(600);

      const read = () =>
        page.evaluate(() => {
          const d = document.querySelector(".dtm__dossier") as HTMLElement;
          const slug = d.querySelector(".dtm__slug") as HTMLElement;
          const dr = d.getBoundingClientRect();
          const sr = slug.getBoundingClientRect();
          const cs = getComputedStyle(slug);
          // sample across the whole header band, edges included - the sliver
          // that used to show was in the gutter, not the middle
          // "belongs to the header" is containment, not a class name - the
          // header legitimately contains the number, the department and the
          // whole nav row, and naming them one by one would only ever be a
          // list that goes stale
          const hits: string[] = [];
          for (const fx of [0.01, 0.25, 0.5, 0.75, 0.99])
            for (const fy of [0.08, 0.5, 0.92]) {
              const el = document.elementFromPoint(
                sr.left + sr.width * fx,
                sr.top + sr.height * fy,
              );
              if (!el || !(slug === el || slug.contains(el)))
                hits.push(String(el?.className || el?.tagName || "nothing"));
            }
          return {
            offsetInScrollport: Math.round(sr.top - dr.top),
            bg: cs.backgroundColor,
            position: cs.position,
            maxScroll: d.scrollHeight - d.clientHeight,
            scrollTop: Math.round(d.scrollTop),
            hits: [...new Set(hits)],
            controls: [...d.querySelectorAll(".dtm__tcta")].map((b) =>
              Math.round(b.getBoundingClientRect().height),
            ),
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });

      const top = await read();
      expect(top.position, "the header must stay put while the body moves").toBe("sticky");
      // opaque: a header you can see the profile through is the whole defect
      expect(top.bg).toMatch(/^rgb\(/);
      expect(top.bg, "a translucent header lets the portrait through").not.toMatch(/rgba/);
      // it starts at the very top of the scrollport, so there is no band above
      // it for content to ride up into
      expect(top.offsetInScrollport).toBe(0);
      // BACK TO THE SHEET / PREVIOUS / NEXT PERSON - the approved dossier
      // names its way out instead of marking it with a cross
      expect(top.controls, "BACK / PREVIOUS / NEXT").toHaveLength(3);
      for (const h of top.controls) expect(h).toBeGreaterThanOrEqual(44);
      expect(top.overflowX).toBeLessThanOrEqual(1);

      // scroll the profile the way a reader does
      await page.evaluate(() => {
        (document.querySelector(".dtm__dossier") as HTMLElement).scrollTop = 10_000;
      });
      await page.waitForTimeout(500);
      const bottom = await read();

      if (top.maxScroll > 0) {
        expect(bottom.scrollTop, "the profile body did not scroll").toBeGreaterThan(0);
      }
      // and after all that, the band still belongs entirely to the header
      expect(bottom.offsetInScrollport).toBe(0);
      expect(
        bottom.hits,
        `these are painting through the header band: ${bottom.hits.join(", ")}`,
      ).toEqual([]);
      expect(top.hits, "something was over the header before scrolling").toEqual([]);
      // the controls are still usable
      await expect(page.locator(".dtm__tcta--back")).toBeVisible();
      await page.locator(".dtm__tcta--back").click();
      await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    });
  }
});

test.describe("Studio Lab on a phone: the section opens on its title", () => {
  for (const [width, height] of [
    [430, 740],
    [390, 664],
    [375, 640],
    [320, 568],
  ] as const) {
    test(`the title is reached without an empty screen at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await enter(page, "/");
      const r = await page.evaluate(() => {
        const sec = document.querySelector(".dao-lab") as HTMLElement;
        sec.scrollIntoView({ block: "start" });
        const top = sec.getBoundingClientRect().top;
        const off = (s: string) => {
          const e = sec.querySelector(s);
          return e ? Math.round(e.getBoundingClientRect().top - top) : null;
        };
        return {
          vh: window.innerHeight,
          title: off(".dao-lab__title"),
          copy: off(".dao-lab__copy"),
          cta: off(".dao-lab__cta"),
          ornPosition: getComputedStyle(sec.querySelector(".dao-lab__orn")!).position,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      // A range, not a pixel. The floor keeps this honest - the section still
      // has to breathe, and "fix the gap" must not become "delete the spacing".
      // The ceiling is what the defect was: the title used to sit at 422 on an
      // 812 viewport, more than half a screen of empty field before it.
      expect(r.title, "the title lost its breathing room").toBeGreaterThan(90);
      expect(r.title, "the oversized gap is back").toBeLessThan(r.vh * 0.45);

      // the ornament stays, and stays out of the flow
      expect(r.ornPosition, "the ornament is displacing the composition again").toBe("absolute");

      // and the reading order still descends
      expect(r.copy!).toBeGreaterThan(r.title!);
      expect(r.cta!).toBeGreaterThan(r.copy!);
      expect(r.overflowX).toBeLessThanOrEqual(1);
    });
  }

  test("the desktop composition is untouched", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enter(page, "/");
    const pos = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dao-lab__orn")!).position,
    );
    expect(pos, "desktop always placed the ornament absolutely").toBe("absolute");
  });
});
