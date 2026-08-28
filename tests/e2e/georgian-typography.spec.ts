import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * §P4: what the browser actually renders for Georgian.
 *
 * The unit test guards the architecture in the stylesheet. This one checks the
 * outcome, because the two can disagree in ways CSS alone will not show: a
 * stack can name a Georgian face and still hand the text to a system font for
 * the characters that face happens to lack, and a weight can be requested that
 * the rasterizer then fakes.
 *
 * Roles are tested, not text nodes, and the FIRST family of the computed stack
 * is the one asserted - the tail is the approved fallback chain.
 */

const KA_ROUTES = ["/ka", "/ka/studio", "/ka/services", "/ka/work", "/ka/team"] as const;

/** the families the brand owns; anything else rendering page text is a defect */
const BRAND = /^(Adevas|Optika|Glacier|ALK Sanet|Noto Sans Georgian)/;

/**
 * Characters no brand face contains. They are symbols rather than letters, they
 * behave identically in English, and there is no brand file to put them in - so
 * they are excluded by name rather than silently tolerated.
 */
const SYMBOL_ONLY = ["✓", "※"];

const firstFamily = async (page: Page, selector: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    return getComputedStyle(el)
      .fontFamily.split(",")[0]
      .replace(/["']/g, "")
      .trim();
  }, selector);

test.describe("§P4 Georgian renders in the brand's own faces", () => {
  for (const route of KA_ROUTES) {
    test(`${route} renders no page text in a system font`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium", "needs CDP platform-font reporting");
      await gotoRoute(page, route);
      await page.evaluate(() => document.fonts.ready);

      const cdp = await page.context().newCDPSession(page);
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");

      const count = await page.evaluate(() => {
        let i = 0;
        for (const el of document.querySelectorAll("*")) {
          const own = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent)
            .join("")
            .trim();
          if (own.length > 1 && el.getClientRects().length) el.setAttribute("data-fontcheck", String(i++));
        }
        return i;
      });

      const { root } = (await cdp.send("DOM.getDocument", { depth: 1 })) as { root: { nodeId: number } };
      const offenders: string[] = [];
      for (let i = 0; i < Math.min(count, 160); i++) {
        const { nodeId } = (await cdp.send("DOM.querySelector", {
          nodeId: root.nodeId,
          selector: `[data-fontcheck="${i}"]`,
        })) as { nodeId: number };
        if (!nodeId) continue;
        const { fonts } = (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })) as {
          fonts: { familyName: string; glyphCount: number }[];
        };
        const strange = fonts.filter((f) => !BRAND.test(f.familyName));
        if (!strange.length) continue;
        const text = await page.evaluate(
          (idx) => document.querySelector(`[data-fontcheck="${idx}"]`)?.textContent?.trim().slice(0, 40) ?? "",
          i,
        );
        // the monospace skip link is deliberately a system face for its Latin,
        // and a handful of symbols exist in no brand file at all
        const isSkipLink = await page.evaluate(
          (idx) => !!document.querySelector(`[data-fontcheck="${idx}"]`)?.closest(".skip-link"),
          i,
        );
        if (isSkipLink) continue;
        if (SYMBOL_ONLY.some((s) => text.includes(s))) continue;
        offenders.push(`${strange.map((f) => `${f.familyName}x${f.glyphCount}`).join(",")} in "${text}"`);
      }
      expect(offenders, offenders.join(" | ")).toEqual([]);
    });
  }
});

test.describe("§P4 no faked Georgian weight", () => {
  test("Georgian text suppresses weight synthesis, English does not", async ({ page }) => {
    await gotoRoute(page, "/ka");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("font-synthesis-weight")),
    ).toBe("none");

    await gotoRoute(page, "/");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("font-synthesis-weight")),
    ).toBe("auto");
  });

  test("the Georgian companion labels inside an English page are covered too", async ({ page }) => {
    await gotoRoute(page, "/");
    const spans = page.locator(".dao-nav__ka");
    const n = await spans.count();
    expect(n, "the burger should carry Georgian companions").toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const el = spans.nth(i);
      const isGeorgian = /[ა-ჿ]/.test((await el.textContent()) ?? "");
      if (!isGeorgian) continue;
      // every Georgian companion declares its language, so :lang(ka) reaches it
      await expect(el).toHaveAttribute("lang", "ka");
      expect(
        await el.evaluate((e) => getComputedStyle(e).getPropertyValue("font-synthesis-weight")),
      ).toBe("none");
    }
  });

  test("a Georgian heading is the same shape at 400 and at its requested weight", async ({ page }) => {
    // ALK Sanet has a single 400 style. With synthesis suppressed the requested
    // 600 must resolve to exactly the same outlines - that is the whole point.
    await gotoRoute(page, "/ka/services");
    await page.evaluate(() => document.fonts.ready);
    const { atRequested, at400 } = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;white-space:pre;font-size:64px;font-family:var(--f-sanet);";
      probe.textContent = "სერვისები";
      document.body.appendChild(probe);
      probe.style.fontWeight = "600";
      const atRequested = probe.getBoundingClientRect().width;
      probe.style.fontWeight = "400";
      const at400 = probe.getBoundingClientRect().width;
      probe.remove();
      return { atRequested, at400 };
    });
    expect(atRequested).toBeCloseTo(at400, 1);
  });
});

test.describe("§P4 the role map resolves per locale", () => {
  // `.dao` is where the UI role lands on the document; `body` carries the
  // globals.css system stack and would say nothing about the brand roles.
  test("Latin roles keep their own faces on an English page", async ({ page }) => {
    await gotoRoute(page, "/services");
    expect(await firstFamily(page, ".dao")).toMatch(/optika/i);
  });

  test("Georgian roles resolve to the Georgian face on a Georgian page", async ({ page }) => {
    await gotoRoute(page, "/ka/services");
    expect(await firstFamily(page, ".dao")).toMatch(/sanet/i);
  });

  test("the locale-invariant Latin role does not follow the locale swap", async ({ page }) => {
    // .dwk__name is set in --dao-f-latin so a project title renders in the same
    // face in both locales; it is deliberately absent from the Georgian override.
    const familyOf = async (route: string) => {
      await gotoRoute(page, route);
      return firstFamily(page, ".dwk__name");
    };
    const en = await familyOf("/work");
    const ka = await familyOf("/ka/work");
    expect(en, "no .dwk__name on /work").toBeTruthy();
    expect(ka).toBe(en);
  });
});
