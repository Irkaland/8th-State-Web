import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * WHAT WE MAKE - the approved production dossier.
 *
 * SUPERSEDES the capability-index version of this file. Act 04 used to print
 * the nine-capability taxonomy in four groups, with an expanding row and a
 * worked-example still; the approved design replaces it with a printed dossier
 * of the studio's five TOP-LEVEL services. Assertions that still describe the
 * page are kept as they were - the ground, the material, the dark scene, the
 * contrast floor, the red Selected Work field. Assertions that described the
 * old structure are re-aimed at what now answers the same question rather than
 * deleted, and each says what changed and why.
 *
 * The capability taxonomy itself did not go anywhere: it is the catalogue on
 * /services, which this section links into, and its own coverage lives in
 * content-taxonomy.spec.ts and ux-refinement-pass.spec.ts.
 */

const BLUE = [35, 116, 179] as const;

/** parse a computed rgb()/rgba() string into channels */
function rgb(value: string): [number, number, number] {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`not a colour: ${value}`);
  const [r, g, b] = m[1].split(",").map((n) => parseFloat(n));
  return [r!, g!, b!];
}

/** relative luminance, WCAG */
function lum([r, g, b]: readonly [number, number, number]): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

function contrast(a: readonly [number, number, number], b: readonly [number, number, number]) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** first family in a computed font-family stack, unquoted and lowercased */
const first = (stack: string) => stack.split(",")[0]!.replace(/["']/g, "").trim().toLowerCase();

async function css(page: Page, selector: string, props: string[]) {
  return page.evaluate(
    ([sel, list]) => {
      const el = document.querySelector(sel as string);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      for (const p of list as string[]) out[p] = cs.getPropertyValue(p);
      return out;
    },
    [selector, props] as const,
  );
}

/** the dossier, revealed and settled */
async function dossier(page: Page, route = "/") {
  await gotoRoute(page, route);
  const section = page.locator(".dao-wwm");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveClass(/is-in/);
  await page.waitForTimeout(900);
  return section;
}

test.describe("§27 the printed blue field", () => {
  test("the ground is the approved brand blue", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-wwm", ["background-color"]);
    expect(got).not.toBeNull();
    expect(rgb(got!["background-color"]!)).toEqual([...BLUE]);
  });

  test("the paper material is actually present, and stronger than the paper default", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-wwm > .dao-grain--strong")).toHaveCount(1);
    await expect(page.locator(".dao-wwm > .dao-weave")).toHaveCount(1);

    const grain = await css(page, ".dao-wwm > .dao-grain--strong", [
      "opacity",
      "mix-blend-mode",
      "background-image",
    ]);
    // pitched well above the 0.4 the paper-ground sections use, or the texture
    // disappears into a saturated colour field
    expect(parseFloat(grain!["opacity"]!)).toBeGreaterThan(0.55);
    expect(grain!["mix-blend-mode"]).toBe("multiply");
    expect(grain!["background-image"]).toContain("paper-grain");

    const weave = await css(page, ".dao-wwm > .dao-weave", ["opacity", "background-image"]);
    expect(parseFloat(weave!["opacity"]!)).toBeGreaterThan(0.14);
    expect(weave!["background-image"]).toContain("canvas-weave");
  });

  test("the section declares itself a DARK scene so the chrome inverts", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-wwm")).toHaveAttribute("data-dao-scene", "dark");
  });

  test("every text layer is readable on the blue", async ({ page }) => {
    await dossier(page);
    for (const sel of [
      ".dao-wwm__title",
      ".dao-wwm__lede",
      ".dao-wwm__name",
      ".dao-wwm__kw",
      ".dao-wwm__mast",
      ".dao-wwm__n",
      ".dao-wwm__chain",
      ".dao-wwm__all",
    ]) {
      const got = await css(page, sel, ["color"]);
      expect(got, sel).not.toBeNull();
      const ratio = contrast(rgb(got!["color"]!), BLUE);
      expect(ratio, `${sel} ${got!["color"]} on blue`).toBeGreaterThan(2.4);
    }
  });

  test("no text descendant is still coloured for the paper ground", async ({ page }) => {
    await dossier(page);
    const offenders = await page.evaluate(() => {
      const svc = document.querySelector(".dao-wwm")!;
      const bad: string[] = [];
      for (const el of svc.querySelectorAll<HTMLElement>("h2, p, span, a")) {
        if (!el.textContent?.trim()) continue;
        if (el.closest("[aria-hidden='true']")) continue;
        const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        const [r, g, b] = m[1].split(",").map(Number) as [number, number, number];
        const l = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
        if (l < 0.3) bad.push(`${el.className || el.tagName} ${getComputedStyle(el).color}`);
      }
      return bad;
    });
    expect(offenders).toEqual([]);
  });

  test("the production traces are decoration and behave like it", async ({ page }) => {
    await dossier(page);
    const marks = page.locator(".dao-wwm__marks");
    await expect(marks).toHaveAttribute("aria-hidden", "true");
    expect(await marks.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
    // nothing decorative is reachable by keyboard
    expect(await page.locator(".dao-wwm__marks a, .dao-wwm__marks button").count()).toBe(0);
  });
});

test.describe("§28 the five top-level services", () => {
  test("prints exactly five rows, numbered 01-05", async ({ page }) => {
    await dossier(page);
    const rows = page.locator(".dao-wwm__row");
    await expect(rows).toHaveCount(5);
    expect(await page.locator(".dao-wwm__n").allInnerTexts()).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });

  test("names them exactly as approved", async ({ page }) => {
    await dossier(page);
    expect(await page.locator(".dao-wwm__name").allInnerTexts()).toEqual([
      "AUDIOVISUAL PRODUCTION",
      "PRODUCTION DESIGN",
      "PHOTOGRAPHY",
      "CREATIVE & ART DIRECTION",
      "GRAPHIC & BROADCAST DESIGN",
    ]);
  });

  test("sets the service names in the DISPLAY face", async ({ page }) => {
    /**
     * SUPERSEDES "names are the strong editorial face, not the display face".
     *
     * That was the right call for an INDEX of nine capabilities - a list to be
     * scanned. The approved dossier is not an index: five departments, set
     * large, each with its own drawn stroke. The design puts them in Adevas,
     * and the section title with them, so the reversal is deliberate and it is
     * the approved design that decides it.
     */
    await dossier(page);
    const name = await css(page, ".dao-wwm__name", ["font-family"]);
    const title = await css(page, ".dao-wwm__title", ["font-family"]);
    expect(first(name!["font-family"]!)).toContain("adevas");
    expect(first(title!["font-family"]!)).toContain("adevas");
  });

  test("gives every row its own accent stroke, all five distinct", async ({ page }) => {
    await dossier(page);
    const strokes = await page.evaluate(() =>
      [...document.querySelectorAll<SVGPathElement>(".dao-wwm__namerule path")].map(
        (p) => p.getAttribute("stroke") ?? "",
      ),
    );
    expect(strokes).toHaveLength(5);
    expect(new Set(strokes).size, "five rows, five accents").toBe(5);
    // a drawn path, never a border
    for (const s of strokes) expect(s).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("is bilingual, and the Georgian is Georgian", async ({ page }) => {
    await dossier(page, "/ka");
    const names = await page.locator(".dao-wwm__name").allInnerTexts();
    expect(names).toHaveLength(5);
    for (const n of names) expect(n).toMatch(/[Ⴀ-ჿ]/);
    expect(await page.locator(".dao-wwm__title").innerText()).toMatch(/[Ⴀ-ჿ]/);
  });
});

test.describe("§29 the rows are real routes", () => {
  test("each row lands on the catalogue, and four on their own capability", async ({ page }) => {
    await dossier(page);
    const hrefs = await page
      .locator(".dao-wwm__row")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs).toEqual([
      "/services#film-video-production",
      "/services#production-design",
      "/services#photography",
      "/services#creative-direction",
      "/services",
    ]);
    // the prototype's placeholder must never ship
    for (const h of hrefs) expect(h).not.toBe("#services");
  });

  test("keeps the locale", async ({ page }) => {
    await dossier(page, "/ka");
    const hrefs = await page
      .locator(".dao-wwm__row")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    for (const h of hrefs) expect(h).toMatch(/^\/ka\/services/);
  });

  test("the anchor it names exists on /services and clears the fixed chrome", async ({ page }) => {
    await gotoRoute(page, "/services#photography");
    const target = page.locator("#photography");
    await expect(target).toHaveCount(1);
    const margin = await target.evaluate((el) => getComputedStyle(el).scrollMarginTop);
    expect(parseFloat(margin), "an anchor must not land under the chrome").toBeGreaterThan(80);
  });

  test("ALL SERVICES goes to the catalogue and is a real touch target", async ({ page }) => {
    await dossier(page);
    const cta = page.locator(".dao-wwm__all");
    await expect(cta).toHaveAttribute("href", "/services");
    const box = await cta.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("§30 the production plates", () => {
  test("show real archive stills, decoratively", async ({ page }) => {
    await dossier(page);
    const plates = await page.locator(".dao-wwm__plateimg img").evaluateAll((els) =>
      els.map((e) => ({
        alt: (e as HTMLImageElement).alt,
        loaded: (e as HTMLImageElement).naturalWidth > 0,
      })),
    );
    expect(plates).toHaveLength(5);
    for (const p of plates) {
      // §30: the caption names the plate and the row names the service, so a
      // meaningful alt would only repeat what the reader already has
      expect(p.alt).toBe("");
      expect(p.loaded, "a plate must be a real asset, not a broken path").toBe(true);
    }
  });

  test("each plate is captioned with its number and its kind", async ({ page }) => {
    await dossier(page);
    const caps = await page.locator(".dao-wwm__platecap").allInnerTexts();
    expect(caps).toHaveLength(5);
    expect(caps[0].replace(/\s+/g, " ")).toContain("PL. 01");
  });
});

test.describe("§31 the narrow composition", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("drops the plates and the heavy marks, and keeps the short keyword run", async ({
    page,
  }) => {
    await dossier(page);
    expect(await css(page, ".dao-wwm__plate", ["display"])).toEqual({ display: "none" });
    expect(await css(page, ".dao-wwm__mark--plan", ["display"])).toEqual({ display: "none" });
    // the registration mark and the crop corner stay at every width
    expect(await css(page, ".dao-wwm__mark--reg", ["display"])).not.toEqual({ display: "none" });
    // one keyword run is shown, the other is laid out away - never both
    const shown = await page.evaluate(() =>
      [
        ...document
          .querySelectorAll<HTMLElement>(".dao-wwm__row")[0]
          .querySelectorAll(".dao-wwm__kw"),
      ]
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.textContent?.trim() ?? ""),
    );
    expect(shown).toHaveLength(1);
    expect(shown[0]).toContain("DEVELOPMENT");
  });

  test("never overflows sideways", async ({ page }) => {
    await dossier(page);
    const overflow = await page.evaluate(() => {
      const svc = document.querySelector(".dao-wwm")!;
      return Math.max(
        svc.scrollWidth - svc.clientWidth,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("the rows are still full-width targets with no hover dependency", async ({ page }) => {
    await dossier(page);
    const rows = await page.locator(".dao-wwm__row").evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
    for (const r of rows) {
      expect(r.h, "a service row is a comfortable target").toBeGreaterThanOrEqual(44);
      expect(r.w).toBeGreaterThan(300);
    }
  });
});

test.describe("§17-§18 the global text-CTA underline", () => {
  /**
   * The dossier's own ALL SERVICES is not part of this group any more: the
   * approved design gives it a printed rule beneath the label rather than the
   * shared pencil-stroke reveal. The shared group itself is unchanged, and is
   * still checked here - one rule, not per-page copies.
   */
  test("every CTA in the shared group carries the same drawn rule", async ({ page }) => {
    await gotoRoute(page, "/");
    const heights = await page.evaluate(() =>
      [".dao-work__all", ".dao-intro__cta", ".dao-lab__cta"]
        .map((s) => {
          const el = document.querySelector(s);
          return el ? parseFloat(getComputedStyle(el, "::after").height) : null;
        })
        .filter((n): n is number => n !== null),
    );
    expect(heights.length).toBeGreaterThan(1);
    for (const h of heights) expect(h).toBeLessThanOrEqual(3);
    expect(new Set(heights).size, "one shared rule, not per-page copies").toBe(1);
  });

  test("is thinner than a highlighter and still organic", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-work__all")!;
      const cs = getComputedStyle(el, "::after");
      return { height: cs.height, mask: cs.maskImage || cs.webkitMaskImage, clip: cs.clipPath };
    });
    const h = parseFloat(got.height);
    expect(h, "a pencil rule, not a highlighter bar").toBeLessThanOrEqual(3);
    expect(h).toBeGreaterThanOrEqual(1);
    expect(got.mask).toContain("pencil-rule");
    expect(got.clip).toContain("inset");
  });

  test("it still reveals on hover", async ({ page }) => {
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-work__all");
    const clipOf = () => cta.evaluate((el) => getComputedStyle(el, "::after").clipPath as string);
    const before = await clipOf();
    await cta.hover();
    await expect.poll(clipOf, { timeout: 4000 }).not.toBe(before);
  });
});

test.describe("§19 the red Selected Work field reads as printed paper", () => {
  test("it is still the approved red", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-work", ["background-color"]);
    expect(rgb(got!["background-color"]!)).toEqual([208, 62, 38]);
  });

  test("the paper grain is present and clearly visible", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-work > .dao-grain--strong")).toHaveCount(1);
    const grain = await css(page, ".dao-work > .dao-grain--strong", [
      "opacity",
      "mix-blend-mode",
      "background-image",
    ]);
    expect(parseFloat(grain!["opacity"]!), "stronger than the paper default").toBeGreaterThan(0.4);
    expect(grain!["mix-blend-mode"]).toBe("multiply");
    expect(grain!["background-image"]).toContain("paper-grain");

    const weave = await css(page, ".dao-work > .dao-weave", ["opacity"]);
    expect(parseFloat(weave!["opacity"]!)).toBeGreaterThan(0.14);
  });

  test("the texture layers never intercept a click", async ({ page }) => {
    await gotoRoute(page, "/");
    for (const sel of [".dao-work > .dao-grain--strong", ".dao-work > .dao-weave"]) {
      const got = await css(page, sel, ["pointer-events"]);
      expect(got!["pointer-events"], sel).toBe("none");
    }
  });
});
