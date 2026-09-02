import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE APPROVED REFINEMENT PASS.
 *
 * What is protected here is what was asked for and what is easy to lose again:
 * the decorations that were removed stay removed, the red sun keeps its new
 * corner, the Lab's printed labels stay English on a Georgian page while the
 * copy around them stays Georgian, and the registration file keeps its clean
 * green paper.
 */

const KA = /[Ⴀ-ჿ]/;

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

test.describe("the Studio cover lost its three pale marks", () => {
  for (const width of [1440, 768, 390, 320] as const) {
    test(`nothing draws them at ${width}, in either locale`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/studio", "/ka/studio"]) {
        await gotoRoute(page, route);
        await walk(page);
        await expect(page.locator(".dst__decor")).toHaveCount(0);
        const marks = await page.evaluate(
          () =>
            [...document.querySelectorAll("*")].filter((e) => {
              const m =
                getComputedStyle(e).webkitMaskImage +
                " " +
                getComputedStyle(e).maskImage +
                " " +
                getComputedStyle(e).backgroundImage;
              return /bb-twin-birds|bb-flower-stem|bb-flourish/.test(m);
            }).length,
        );
        expect(marks, `${route} still draws a retired cover mark at ${width}`).toBe(0);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(over, `${route} scrolls sideways at ${width}`).toBeLessThanOrEqual(1);
      }
    });
  }
});

/*
 * The 'yellow canvas' block that stood here covered the intermediate Presents
 * act - its two removed birds and the red sun in its top right corner. That
 * whole act has since been removed from the homepage, so there is nothing left
 * for it to measure; the homepage now runs Showreel -> Studio Intro directly
 * and home.spec.ts owns that boundary.
 */

test.describe("the Lab's printed labels stay English on a Georgian page", () => {
  test("the page's own identity is English, its copy is not", async ({ page }) => {
    await gotoRoute(page, "/ka/studio-lab");
    await walk(page);
    const r = await page.evaluate(() => {
      const txt = (s: string) => document.querySelector(s)?.textContent?.trim() ?? "";
      return {
        mast: txt(".dsl__mast > span"),
        title: txt(".dsl__title"),
        hand: txt(".dsl__handtext"),
        lede: txt(".dsl__copy"),
        statement: txt(".dsl__statement"),
      };
    });
    expect(r.mast, "the masthead must not translate").not.toMatch(KA);
    expect(r.title, "STUDIO LAB must not translate").not.toMatch(KA);
    expect(r.hand, "the handwritten note must not translate").not.toMatch(KA);
    // and the copy around them is still Georgian
    expect(r.lede, "the lede must still be Georgian on /ka").toMatch(KA);
    expect(r.statement, "the statement must still be Georgian on /ka").toMatch(KA);
  });

  test("the registration file's labels are English, its course name is not", async ({ page }) => {
    await gotoRoute(page, "/ka/studio-lab");
    const btn = page.locator(".dsl__prreg").first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.locator(".dlr__sheet")).toBeVisible();
    const r = await page.evaluate(() => {
      const all = (s: string) =>
        [...document.querySelectorAll(s)].map((e) => e.textContent!.trim());
      const one = (s: string) => document.querySelector(s)?.textContent?.trim() ?? "";
      return {
        labels: all(".dlr__label"),
        options: all(".dlr__opt"),
        submit: one(".dlr__submit"),
        eyebrow: one(".dlr__eyebrow"),
        desk: one(".dlr__desk"),
        consent: one(".dlr__consenttext"),
        placeholder: document.querySelector<HTMLTextAreaElement>(".dlr__textarea")!.placeholder,
        courseName: one(".dlr__course"),
      };
    });
    expect(r.labels.length).toBe(8);
    for (const l of [
      ...r.labels,
      ...r.options,
      r.submit,
      r.eyebrow,
      r.desk,
      r.consent,
      r.placeholder,
    ])
      expect(l, `"${l}" must stay English in the file`).not.toMatch(KA);
    // the course itself is content, and stays Georgian
    expect(r.courseName, "the course name must still be Georgian").toMatch(KA);
  });
});

test.describe("the registration file is clean green paper", () => {
  for (const [w, h] of [
    [1440, 900],
    [768, 700],
    [390, 664],
    [320, 568],
  ] as const) {
    test(`no serpent and no stray rule at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoRoute(page, "/studio-lab");
      const btn = page.locator(".dsl__prreg").first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await expect(page.locator(".dlr__sheet")).toBeVisible();
      await expect(page.locator(".dlr__serpent")).toHaveCount(0);
      const r = await page.evaluate(() => ({
        serpentArt: [...document.querySelectorAll(".dlr *")].filter((e) => {
          const cs = getComputedStyle(e);
          return /serpent/.test(cs.backgroundImage + cs.webkitMaskImage + cs.maskImage);
        }).length,
        footRule: getComputedStyle(document.querySelector(".dlr__foot")!).borderTopWidth,
        // the boundaries that must NOT have been swept up with the dividers
        input: getComputedStyle(document.querySelector(".dlr__input")!).borderBottomWidth,
        chip: getComputedStyle(document.querySelector(".dlr__opt")!).borderTopWidth,
        close: getComputedStyle(document.querySelector(".dlr__close")!).borderTopWidth,
      }));
      expect(r.serpentArt, "the serpent is still drawn inside the file").toBe(0);
      expect(r.footRule, "the divider above the consent row is back").toBe("0px");
      expect(r.input, "an input lost its rule").not.toBe("0px");
      expect(r.chip, "a choice chip lost its border").not.toBe("0px");
      expect(r.close, "the close control lost its border").not.toBe("0px");
    });
  }

  test("BEGIN REGISTRATION has no rule under it, the quiet link keeps its underline", async ({
    page,
  }) => {
    await gotoRoute(page, "/studio-lab");
    await walk(page);
    const r = await page.evaluate(() => ({
      regcta: getComputedStyle(document.querySelector(".dsl__regcta")!).borderBottomWidth,
      quiet: getComputedStyle(document.querySelector(".dsl__ctaquiet")!).borderBottomWidth,
    }));
    expect(r.regcta, "the straight rule under the register CTA is back").toBe("0px");
    // the quiet link's underline is its affordance, not decoration
    expect(r.quiet, "the quiet link lost the underline that marks it a link").not.toBe("0px");
  });
});
