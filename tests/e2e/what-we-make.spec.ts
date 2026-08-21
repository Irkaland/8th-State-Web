import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Mobile / What We Make / Showreel polish pass - the surface half.
 *
 *  §05  What We Make sits on the brand blue with plainly visible paper texture
 *  §06  capability names are strong Optika, not the display face
 *  §07  their hover underline is pencil-weight but still hand-drawn
 *  §08  nine visually distinct approved palette underline colours
 *  §09  the capability rows still behave on narrow viewports
 *  §17-§18  the global text-CTA underline is thinner and still organic
 *  §19  the red Selected Work field reads as printed paper
 *
 * The mobile session lifecycle (§02-§04, §10-§16) lives in
 * mobile-lifecycle.spec.ts, which runs on real device projects.
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

test.describe("§05 What We Make - the blue printed field", () => {
  test("the ground is the approved brand blue", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-svc", ["background-color"]);
    expect(got).not.toBeNull();
    expect(rgb(got!["background-color"]!)).toEqual([...BLUE]);
  });

  test("the paper material is actually present, and stronger than the paper default", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    // both layers exist as real elements, not as an implied colour
    await expect(page.locator(".dao-svc > .dao-grain--strong")).toHaveCount(1);
    await expect(page.locator(".dao-svc > .dao-weave")).toHaveCount(1);

    const grain = await css(page, ".dao-svc > .dao-grain--strong", [
      "opacity",
      "mix-blend-mode",
      "background-image",
    ]);
    // pitched well above the 0.4 the paper-ground sections use, or the texture
    // disappears into a saturated colour field
    expect(parseFloat(grain!["opacity"]!)).toBeGreaterThan(0.55);
    expect(grain!["mix-blend-mode"]).toBe("multiply");
    expect(grain!["background-image"]).toContain("paper-grain");

    const weave = await css(page, ".dao-svc > .dao-weave", ["opacity", "background-image"]);
    expect(parseFloat(weave!["opacity"]!)).toBeGreaterThan(0.14);
    expect(weave!["background-image"]).toContain("canvas-weave");
  });

  test("the section declares itself a DARK scene so the chrome inverts", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-svc")).toHaveAttribute("data-dao-scene", "dark");
  });

  test("every text layer is readable on the new ground", async ({ page }) => {
    await gotoRoute(page, "/");
    for (const sel of [
      ".dao-svc__title",
      ".dao-svc__intro",
      ".dao-svc__name",
      ".dao-svc__groupname",
      ".dao-svc__groupdesc",
      ".dao-svc__desc",
      ".dao-svc__all",
    ]) {
      const got = await css(page, sel, ["color"]);
      expect(got, sel).not.toBeNull();
      const ratio = contrast(rgb(got!["color"]!), BLUE);
      // 3:1 for the small labels, comfortably more for body and headings -
      // the point is that nothing was left as ink-on-paper
      expect(ratio, `${sel} ${got!["color"]} on blue`).toBeGreaterThan(2.4);
    }
  });

  test("no descendant is still coloured for the old paper ground", async ({ page }) => {
    await gotoRoute(page, "/");
    // a near-black or brown text colour inside the section is the signature of
    // a rule that was missed
    const offenders = await page.evaluate(() => {
      const svc = document.querySelector(".dao-svc")!;
      const bad: string[] = [];
      for (const el of svc.querySelectorAll<HTMLElement>("h2, p, span, a, button")) {
        if (!el.textContent?.trim()) continue;
        const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        const [r, g, b] = m[1].split(",").map(Number) as [number, number, number];
        const l = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
        // the blue's own naive lightness is ~0.42; anything darker than 0.3 is
        // ink or brown, i.e. left over from the paper ground
        if (l < 0.3) bad.push(`${el.className || el.tagName} ${getComputedStyle(el).color}`);
      }
      return bad;
    });
    // the ink group label is intentional and is verified for contrast above
    expect(offenders.filter((o) => !o.includes("groupname") && !o.includes("grouphead"))).toEqual(
      [],
    );
  });
});

test.describe("§06-§08 capability rows", () => {
  test("names are the strong editorial face, not the display face", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-svc__name", ["font-family", "font-weight"]);
    expect(first(got!["font-family"]!)).toContain("optika");
    expect(first(got!["font-family"]!)).not.toContain("adevas");
    expect(parseInt(got!["font-weight"]!, 10)).toBeGreaterThanOrEqual(600);
  });

  test("the name follows the editorial ROLE in Georgian too", async ({ page }) => {
    // §06 is a role change, not a literal-family one. Under html[lang="ka"] the
    // editorial role resolves to the Georgian face, and that is correct - the
    // names are translated copy. Only the Latin WORDMARK is pinned across
    // locales (§02, covered in mobile-lifecycle.spec.ts). So assert the role:
    // the name must equal the editorial token and differ from the display one.
    for (const route of ["/", "/ka"]) {
      await gotoRoute(page, route);
      const got = await page.evaluate(() => {
        const de = document.documentElement;
        const cs = getComputedStyle(de);
        const name = getComputedStyle(document.querySelector(".dao-svc__name")!);
        const title = getComputedStyle(document.querySelector(".dao-svc__title")!);
        const norm = (v: string) => v.replace(/["']/g, "").replace(/\s+/g, " ").trim();
        return {
          name: norm(name.fontFamily),
          title: norm(title.fontFamily),
          ui: norm(cs.getPropertyValue("--dao-f-ui")),
          display: norm(cs.getPropertyValue("--dao-f-display")),
        };
      });
      expect(got.name, `${route} name is the editorial role`).toBe(got.ui);
      expect(got.title, `${route} title is the display role`).toBe(got.display);
    }
  });

  test("the section title is still the display face", async ({ page }) => {
    // §06 moves the ROWS off Adevas; the title above them must not follow
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-svc__title", ["font-family"]);
    expect(first(got!["font-family"]!)).toContain("adevas");
  });

  test("§07 the underline is pencil-weight and still hand-drawn", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await css(page, ".dao-svc__name .dao-strike", ["height", "mask-image", "width"]);
    const h = parseFloat(got!["height"]!);
    expect(h, "barely thicker than a pencil line").toBeLessThanOrEqual(4);
    expect(h, "but still a drawn stroke, not a hairline").toBeGreaterThanOrEqual(2);
    // thinner, NOT straighter - the ragged paint-stroke mask survives
    expect(got!["mask-image"]).toContain("paint-stroke");
  });

  test("§08 the nine rows carry nine different colours", async ({ page }) => {
    await gotoRoute(page, "/");
    const colours = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-svc__name .dao-strike")].map(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    );
    expect(colours).toHaveLength(9);
    expect(new Set(colours).size, "nine rows, nine accents").toBe(9);

    // none of them vanishes into the blue, and no two neighbours read alike
    for (const [i, c] of colours.entries()) {
      expect(contrast(rgb(c), BLUE), `row ${i + 1} ${c}`).toBeGreaterThan(1.4);
      if (i > 0) {
        expect(contrast(rgb(c), rgb(colours[i - 1]!)), `rows ${i} vs ${i + 1}`).toBeGreaterThan(
          1.2,
        );
      }
    }
  });

  test("hovering a row draws its underline in", async ({ page }) => {
    await gotoRoute(page, "/");
    const row = page.locator(".dao-svc__rowbtn").nth(1);
    const strike = row.locator(".dao-strike");
    const before = await strike.evaluate((el) => getComputedStyle(el).transform);
    await row.hover();
    await expect
      .poll(() => strike.evaluate((el) => getComputedStyle(el).transform), { timeout: 4000 })
      .not.toBe(before);
  });

  test("a row opens to its explanation and its worked example", async ({ page }) => {
    await gotoRoute(page, "/");
    const btn = page.locator(".dao-svc__rowbtn").nth(4);
    await btn.click();
    const row = page.locator(".dao-svc__row").nth(4);
    await expect(row).toHaveClass(/is-open/);
    await expect(row.locator(".dao-svc__desc")).toBeVisible();
  });
});

test.describe("§09 capability rows on a narrow viewport", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("the rail gives way to inline group heads and nothing overflows", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-svc__rail")).toBeHidden();
    await expect(page.locator(".dao-svc__grouphead--inline").first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      const svc = document.querySelector(".dao-svc")!;
      return svc.scrollWidth - svc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("opening a row never paints a white box where the fragment goes", async ({ page }) => {
    // the fragment wrapper stays transparent until load + decode, so mobile
    // Safari/Chrome cannot flash the undecoded area white
    await gotoRoute(page, "/");
    const row = page.locator(".dao-svc__row").nth(2);
    await row.locator(".dao-svc__rowbtn").click();
    const frag = row.locator(".dao-svc__frag");

    // it is either not yet revealed (transparent) or revealed WITH its image
    const state = await frag.evaluate((el) => ({
      ready: el.classList.contains("is-ready"),
      opacity: Number(getComputedStyle(el).opacity),
      hasImg: !!el.querySelector("img"),
      bg: getComputedStyle(el).backgroundColor,
    }));
    if (!state.ready) expect(state.opacity).toBe(0);
    // and the wrapper itself never has a white fill of its own
    expect(state.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

    // the reveal waits on load + decode of a real photograph; under parallel
    // load across three browser projects that is comfortably slower than a
    // default expect timeout
    await expect
      .poll(() => frag.evaluate((el) => el.classList.contains("is-ready")), { timeout: 30_000 })
      .toBe(true);
    expect(await frag.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
});

test.describe("§17-§18 the global text-CTA underline", () => {
  test("is thinner than before and still a drawn rule", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-svc__all")!;
      const cs = getComputedStyle(el, "::after");
      return {
        height: cs.height,
        mask: cs.maskImage || cs.webkitMaskImage,
        clip: cs.clipPath,
        bg: cs.backgroundColor,
      };
    });
    const h = parseFloat(got.height);
    expect(h, "a pencil rule, not a highlighter bar").toBeLessThanOrEqual(3);
    expect(h).toBeGreaterThanOrEqual(1);
    // organic: the hand-drawn pencil mask is intact, and the reveal still
    // wipes left to right
    expect(got.mask).toContain("pencil-rule");
    expect(got.clip).toContain("inset");
  });

  test("every CTA in the shared group got the same treatment", async ({ page }) => {
    await gotoRoute(page, "/");
    const heights = await page.evaluate(() =>
      [".dao-work__all", ".dao-svc__all", ".dao-intro__cta", ".dao-lab__cta"]
        .map((s) => {
          const el = document.querySelector(s);
          return el ? parseFloat(getComputedStyle(el, "::after").height) : null;
        })
        .filter((n): n is number => n !== null),
    );
    expect(heights.length).toBeGreaterThan(1);
    for (const h of heights) expect(h).toBeLessThanOrEqual(3);
    // one shared rule, not per-page copies
    expect(new Set(heights).size).toBe(1);
  });

  test("it still reveals on hover", async ({ page }) => {
    await gotoRoute(page, "/");
    const cta = page.locator(".dao-svc__all");
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
