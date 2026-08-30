import { test, expect, type Page } from "@playwright/test";
import { expectNoSeriousA11y, gotoRoute } from "./helpers";

/**
 * Contact / Studio Lab / footer material polish pass.
 *
 *  §01  the Selected Work progress fill is not the red field it sits on
 *       (this pass made it black; the brand refinement pass moved it to
 *       Production Blue - see brand-refinement.spec.ts for the exact colour)
 *  §02  the Studio Lab left rose recedes into the ground
 *  §03  the small yellow bloom is gone; the tall stem is grown and cropped
 *  §04  the Contact sun is a large, fainter, lower atmospheric ground
 *  §05  SEND is the brand blue - softer at rest, full on interaction
 *  §06  the footer logo card is blue paper, with the logo unchanged
 *  §07  the black Contact/footer surface carries visible paper
 */

const BLUE = [35, 116, 179] as const;
const RED = [208, 62, 38] as const;
const INK = [19, 18, 16] as const;

/** parse rgb()/rgba() into [r,g,b,a] */
function rgba(value: string): [number, number, number, number] {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`not a colour: ${value}`);
  const p = m[1].split(",").map((n) => parseFloat(n));
  return [p[0]!, p[1]!, p[2]!, p[3] === undefined ? 1 : p[3]!];
}

function lum([r, g, b]: readonly number[]): number {
  const f = (v: number) => {
    const s = v! / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
}
function contrast(a: readonly number[], b: readonly number[]): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
/** flatten a translucent colour over an opaque backdrop */
function over(fg: [number, number, number, number], bg: readonly number[]) {
  return [0, 1, 2].map((i) => fg[i]! * fg[3] + bg[i]! * (1 - fg[3]));
}

async function styles(page: Page, selector: string, props: string[], pseudo?: string) {
  return page.evaluate(
    ([sel, list, pse]) => {
      const el = document.querySelector(sel as string);
      if (!el) return null;
      const cs = getComputedStyle(el, (pse as string) || undefined);
      const out: Record<string, string> = {};
      for (const p of list as string[]) out[p] = cs.getPropertyValue(p);
      return out;
    },
    [selector, props, pseudo ?? ""] as const,
  );
}

test.describe("§01 Selected Work progress indicators", () => {
  // SUPERSEDED: this pass made the fill black, and the brand refinement pass
  // that followed moved it to Production Blue (§02 there). The claim worth
  // keeping is the one that motivated the change in the first place - the fill
  // must not be the red it sits on - so that is what this now asserts, and the
  // exact colour is owned by brand-refinement.spec.ts.
  test("the active fill is not the red field it sits on", async ({ page }) => {
    await gotoRoute(page, "/");
    const fill = await styles(page, ".dao-work__progfill", ["background-color"]);
    expect(fill, "an active indicator must be filling").not.toBeNull();
    const c = rgba(fill!["background-color"]!);
    expect([c[0], c[1], c[2]], "red on red never read as a progress state").not.toEqual([...RED]);
  });

  test("the fill reads against the red field it sits on", async ({ page }) => {
    await gotoRoute(page, "/");
    const fill = rgba(
      (await styles(page, ".dao-work__progfill", ["background-color"]))!["background-color"]!,
    );
    const field = rgba(
      (await styles(page, ".dao-work", ["background-color"]))!["background-color"]!,
    );
    expect([field[0], field[1], field[2]], "the red field is untouched").toEqual([...RED]);

    // The fill separates from the field by HUE, not by value. Production Blue
    // and the brand red sit at almost the same luminance (1.04:1), so the
    // luminance test the black fill passed at 4.40:1 is not the right one any
    // more - what carries the mandated blue is a ~230-unit RGB distance and a
    // 141-step difference on the BLUE channel, which is the channel that
    // survives both common forms of red-green colour blindness.
    const dist = Math.sqrt([0, 1, 2].reduce((s, i) => s + (fill[i]! - field[i]!) ** 2, 0));
    expect(dist, "the fill must be a plainly different colour").toBeGreaterThan(120);
    expect(
      Math.abs(fill[2]! - field[2]!),
      "and separated on the blue channel, not only on red/green",
    ).toBeGreaterThan(80);
  });

  test("geometry, count, spacing and the fill animation are all preserved", async ({ page }) => {
    await gotoRoute(page, "/");
    const shape = await page.evaluate(() => {
      const track = document.querySelector(".dao-work__progress")!;
      const items = [...document.querySelectorAll(".dao-work__prog")];
      const active = document.querySelector(".dao-work__prog.is-active")!;
      const inactive = items.find((el) => !el.classList.contains("is-active"))!;
      const fill = getComputedStyle(document.querySelector(".dao-work__progfill")!);
      const ts = getComputedStyle(track);
      return {
        count: items.length,
        gap: ts.gap,
        activeW: getComputedStyle(active).width,
        activeH: getComputedStyle(active).height,
        inactiveW: getComputedStyle(inactive).width,
        inactiveH: getComputedStyle(inactive).height,
        inactiveBg: getComputedStyle(inactive).backgroundColor,
        mask: getComputedStyle(inactive).maskImage || getComputedStyle(inactive).webkitMaskImage,
        animName: fill.animationName,
        animDur: fill.animationDuration,
        animTiming: fill.animationTimingFunction,
        animFill: fill.animationFillMode,
      };
    });
    expect(shape.count).toBe(5);
    expect(shape.gap).toBe("8px");
    expect(shape.activeW).toBe("34px");
    expect(shape.activeH).toBe("6px");
    expect(shape.inactiveW).toBe("18px");
    expect(shape.inactiveH).toBe("5px");
    // the inactive state is the untouched cream track
    expect(rgba(shape.inactiveBg).slice(0, 3)).toEqual([242, 237, 227]);
    // still a hand-drawn stroke, not a rectangle
    expect(shape.mask).toContain("paint-stroke");
    // the fill animation itself is exactly as it was
    expect(shape.animName).toBe("dao-prog-fill");
    expect(shape.animDur).toBe("5s");
    expect(shape.animTiming).toBe("linear");
    expect(shape.animFill).toBe("forwards");
  });

  test("the carousel still advances", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.locator(".dao-work").scrollIntoViewIfNeeded();
    const activeIndex = () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".dao-work__prog")].findIndex((el) =>
          el.classList.contains("is-active"),
        ),
      );
    const first = await activeIndex();
    await expect.poll(activeIndex, { timeout: 20_000 }).not.toBe(first);
  });
});

/**
 * SUPERSEDED by the approved Studio Lab design.
 *
 * The Lab's botanicals used to be CSS masks: a cream background-color under a
 * mask-image, one rose on the left and a stem (later a brandbook bird) on the
 * right. The approved design draws them as low-opacity images instead, one per
 * placement, cropped by the section.
 *
 * The technique changed, so the old measurements cannot run - but every claim
 * they made still has to hold, and each one is carried over here against the
 * implementation that replaced them: pushed back, never invisible, never more
 * dominant than the title, genuinely cropped, and never widening the document.
 */
test.describe("§02-§03 Studio Lab botanicals", () => {
  for (const [label, route, scope, title] of [
    ["home act", "/", ".dao-lab", ".dao-lab__title"],
    ["route hero", "/studio-lab", ".dsl", ".dsl__title"],
  ] as const) {
    test(`${label}: the botanicals are a background layer`, async ({ page }) => {
      await gotoRoute(page, route);
      const m = await page.evaluate((sc) => {
        const els = [...document.querySelectorAll(`${sc} .dsl-bot`)];
        return els.map((e) => ({
          src: (e as HTMLImageElement).getAttribute("src") ?? "",
          // the placement wrapper carries the opacity the design specifies
          opacity: parseFloat(getComputedStyle(e.parentElement!).opacity),
          z: getComputedStyle(e.parentElement!).zIndex,
          pe: getComputedStyle(e).pointerEvents,
        }));
      }, scope);
      expect(m.length, "at least one botanical").toBeGreaterThan(0);
      for (const b of m) {
        expect(b.src, "brandbook artwork").toMatch(/floral-rose|stem|bloom|rosette/);
        expect(b.opacity, "pushed well back").toBeLessThanOrEqual(0.2);
        expect(b.opacity, "but never invisible").toBeGreaterThan(0.05);
        expect(b.pe, "never intercepts a pointer").toBe("none");
      }
    });

    test(`${label}: the title is more dominant than the botanicals`, async ({ page }) => {
      await gotoRoute(page, route);
      const m = await page.evaluate(
        ([sc, t]) => ({
          titleAlpha: 1,
          titleColor: getComputedStyle(document.querySelector(t)!).color,
          maxBot: Math.max(
            ...[...document.querySelectorAll(`${sc} .dsl-bot`)].map((e) =>
              parseFloat(getComputedStyle(e.parentElement!).opacity),
            ),
          ),
        }),
        [scope, title] as const,
      );
      // solid ink against a wash: the title is at least five times the presence
      expect(m.titleColor).toBe("rgb(19, 18, 16)");
      expect(m.titleAlpha / m.maxBot).toBeGreaterThan(5);
    });

    test(`${label}: the small yellow bloom is not in the hero`, async ({ page }) => {
      await gotoRoute(page, route);
      const hero = route === "/" ? ".dao-lab" : ".dsl__hero";
      const blooms = await page.evaluate((h) => {
        const scope = document.querySelector(h);
        if (!scope) return [];
        return [...scope.querySelectorAll("img")]
          .map((e) => e.getAttribute("src") ?? "")
          .filter((src) => src.includes("bloom.webp"));
      }, hero);
      expect(blooms).toEqual([]);
    });

    test(`${label}: a botanical is genuinely cropped, not inset`, async ({ page }) => {
      await gotoRoute(page, route);
      const m = await page.evaluate((sc) => {
        const els = [...document.querySelectorAll(`${sc} .dsl-bot`)];
        const vw = document.documentElement.clientWidth;
        return els.map((e) => {
          const b = e.getBoundingClientRect();
          return { over: b.right - vw, width: b.width };
        });
      }, scope);
      const cropped = m.filter((b) => b.over > 0 && b.over / b.width > 0.1);
      expect(cropped.length, "at least one runs off the edge").toBeGreaterThan(0);
      expect(Math.max(...m.map((b) => b.width)), "present at real size").toBeGreaterThan(150);
    });

    test(`${label}: the crop never widens the document`, async ({ page }) => {
      await gotoRoute(page, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
test.describe("§04 the Contact sun", () => {
  test("is large, fainter and lower than the illustration it replaced", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-contact__sun")!;
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        top: parseFloat(cs.top),
        width: el.getBoundingClientRect().width,
        mask: cs.maskImage || cs.webkitMaskImage,
        vw: document.documentElement.clientWidth,
      };
    });
    // the same sun artwork
    expect(got.mask).toContain("sun");
    // substantially larger than the old clamp(280px, 44vw, 640px)
    expect(got.width).toBeGreaterThan(got.vw * 0.55);
    // thinner than the old 0.06
    const c = rgba(got.bg);
    expect(c.slice(0, 3)).toEqual([242, 237, 227]);
    expect(c[3]).toBeLessThan(0.06);
    // and moved down from the old top: 60px
    expect(got.top).toBeGreaterThan(60);
  });

  test("does not widen the document at any of the affected widths", async ({ page }) => {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 860 });
      await gotoRoute(page, "/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("leaves the whole enquiry form readable", async ({ page }) => {
    await gotoRoute(page, "/");
    // the form is positioned and later in the DOM, so it paints above the sun:
    // at every label's centre the topmost element is the form, never the sun
    const covered = await page.evaluate(() => {
      const bad: string[] = [];
      const targets = [
        ".dao-contact__formnote",
        ...[...document.querySelectorAll(".dao-field label")].map(
          (_, i) => `.dao-field:nth-of-type(${i + 1}) label`,
        ),
        ".dao-contact__send",
      ];
      for (const sel of targets) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (top && top.closest(".dao-contact__sun")) bad.push(sel);
      }
      return bad;
    });
    expect(covered, "the sun must never sit over the form").toEqual([]);

    // and the field rules are still drawn
    const line = await styles(page, ".dao-field input", ["border-bottom-width"]);
    expect(parseFloat(line!["border-bottom-width"]!)).toBeGreaterThan(0);
  });
});

test.describe("§05 the SEND button", () => {
  test("rests on a softened brand blue with a readable label", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await styles(page, ".dao-contact__send", ["background-color", "color"]);
    const bg = rgba(got!["background-color"]!);
    expect(bg.slice(0, 3), "exactly the brand blue, not a second one").toEqual([...BLUE]);
    expect(bg[3], "softer than full strength").toBeGreaterThan(0.4);
    expect(bg[3]).toBeLessThan(1);
    // it sits on the ink ground, so measure the label against the composite
    const label = rgba(got!["color"]!);
    expect(contrast(label, over(bg, INK))).toBeGreaterThanOrEqual(4.5);
  });

  test("reaches the full brand blue on hover", async ({ page }) => {
    await gotoRoute(page, "/");
    const send = page.locator(".dao-contact__send");
    await send.scrollIntoViewIfNeeded();
    const bgOf = () => send.evaluate((el) => getComputedStyle(el).backgroundColor);
    const rest = await bgOf();
    await send.hover();
    await page.waitForFunction(
      () => document.querySelector(".dao-contact__send")!.matches(":hover"),
      null,
      { timeout: 5000 },
    );
    await expect.poll(bgOf, { timeout: 4000 }).toBe("rgb(35, 116, 179)");
    expect(rest).not.toBe("rgb(35, 116, 179)");
  });

  test("reaches the full brand blue on keyboard focus too", async ({ page }) => {
    // focus-visible has to work on every device, hover-capable or not
    await gotoRoute(page, "/");
    const send = page.locator(".dao-contact__send");
    await send.scrollIntoViewIfNeeded();
    await send.evaluate((el: HTMLElement) => el.focus());
    await expect
      .poll(() => send.evaluate((el) => getComputedStyle(el).backgroundColor), { timeout: 4000 })
      .toBe("rgb(35, 116, 179)");
  });

  test("transitions rather than snapping", async ({ page }) => {
    await gotoRoute(page, "/");
    const t = await styles(page, ".dao-contact__send", [
      "transition-property",
      "transition-duration",
    ]);
    expect(t!["transition-property"]).toContain("background-color");
    expect(parseFloat(t!["transition-duration"]!)).toBeGreaterThan(0);
  });

  test("keeps its dimensions, type, label and star", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-contact__send")!;
      const cs = getComputedStyle(el);
      const star = getComputedStyle(document.querySelector(".dao-contact__star")!);
      return {
        padding: cs.padding,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        border: cs.borderWidth,
        text: el.textContent?.trim(),
        starBg: star.backgroundColor,
        starRight: star.right,
        starTop: star.top,
        starW: star.width,
      };
    });
    expect(got.padding).toBe("14px 26px");
    expect(got.fontSize).toBe("12px");
    expect(got.fontWeight).toBe("600");
    expect(got.letterSpacing).toBe("3.6px");
    expect(got.border).toBe("0px");
    expect(got.text).toMatch(/SEND/i);
    // the star accent is untouched, colour and position both
    expect(rgba(got.starBg).slice(0, 3)).toEqual([...RED]);
    expect(got.starRight).toBe("-14px");
    expect(got.starTop).toBe("-14px");
    expect(got.starW).toBe("30px");
  });
});

test.describe("§05 SEND on a touch device", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });

  test("a tap does not leave a stuck hover state", async ({ page }) => {
    await gotoRoute(page, "/");
    const send = page.locator(".dao-contact__send");
    await send.scrollIntoViewIfNeeded();
    const bgOf = () => send.evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await bgOf();

    const box = await send.boundingBox();
    // the button carries aria-disabled, so drive the touchscreen directly
    await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(400);
    await send.evaluate((el: HTMLElement) => el.blur());

    await expect.poll(bgOf, { timeout: 4000 }).toBe(before);
    // and the resting state is still the softened blue, not full strength
    expect(rgba(before)[3]).toBeLessThan(1);
  });
});

test.describe("§06 the footer logo card", () => {
  for (const [label, route] of [
    ["home", "/"],
    ["contact route", "/contact"],
  ] as const) {
    test(`${label}: the card is brand-blue paper`, async ({ page }) => {
      await gotoRoute(page, route);
      const chip = await styles(page, ".dao-credits__chip", ["background-color"]);
      expect(rgba(chip!["background-color"]!)).toEqual([...BLUE, 1]);

      const tex = await styles(page, ".dao-credits__chip .dao-grain--strong", [
        "background-image",
        "opacity",
        "mix-blend-mode",
      ]);
      expect(tex, "the card must carry the paper material").not.toBeNull();
      // the existing paper system, not a bespoke texture
      expect(tex!["background-image"]).toContain("paper-grain");
      expect(parseFloat(tex!["opacity"]!), "clearly perceptible on a mid-tone").toBeGreaterThan(
        0.5,
      );
      expect(tex!["mix-blend-mode"]).toBe("multiply");
    });

    test(`${label}: the logo artwork is unchanged`, async ({ page }) => {
      await gotoRoute(page, route);
      const img = await page.evaluate(() => {
        const el = document.querySelector<HTMLImageElement>(".dao-credits__chip img")!;
        const cs = getComputedStyle(el);
        return {
          src: el.getAttribute("src"),
          blend: cs.mixBlendMode,
          filter: cs.filter,
          zIndex: cs.zIndex,
          width: cs.width,
        };
      });
      expect(img.src).toContain("8th-state-logo");
      // the logo is a transparent PNG carrying the RED serpent and the white
      // sun. multiply would push the serpent to near-black on blue and sink the
      // sun into the field, i.e. change the logo's colours - so it must not
      // blend, and it must sit above the grain layer.
      expect(img.blend).toBe("normal");
      expect(img.filter).toBe("none");
      expect(Number(img.zIndex)).toBeGreaterThan(0);
      expect(img.width).toBe("128px");
    });
  }
});

test.describe("§07 the black Contact / footer material", () => {
  for (const [label, route, surface] of [
    ["home act", "/", ".dao-contact"],
    ["contact route", "/contact", ".dct"],
  ] as const) {
    test(`${label}: the ground is still the brand black`, async ({ page }) => {
      await gotoRoute(page, route);
      const got = await styles(page, surface, ["background-color"]);
      expect(rgba(got!["background-color"]!).slice(0, 3), "black is not replaced").toEqual([
        ...INK,
      ]);
    });

    test(`${label}: it carries the paper material, blended so it actually shows`, async ({
      page,
    }) => {
      await gotoRoute(page, route);
      const got = await styles(page, `${surface} > .dao-grain--dark`, [
        "background-image",
        "opacity",
        "mix-blend-mode",
      ]);
      expect(got, "the dark surface must carry paper").not.toBeNull();
      // the same paper stock used everywhere else, not a new texture
      expect(got!["background-image"]).toContain("paper-grain");
      // multiply is what the light grounds use and it cannot lift anything out
      // of #131210 - that is exactly why the surface read flat before
      expect(got!["mix-blend-mode"], "must not be multiply on a black ground").toBe("screen");
      const op = parseFloat(got!["opacity"]!);
      expect(op, "present enough to feel physical").toBeGreaterThanOrEqual(0.08);
      expect(op, "but not digital noise").toBeLessThanOrEqual(0.2);
    });

    test(`${label}: the texture never intercepts a click`, async ({ page }) => {
      await gotoRoute(page, route);
      const got = await styles(page, `${surface} > .dao-grain--dark`, ["pointer-events"]);
      expect(got!["pointer-events"]).toBe("none");
    });

    test(`${label}: paper text stays far above AA on the textured ground`, async ({ page }) => {
      await gotoRoute(page, route);
      // the layer lifts the ground slightly; confirm the headline copy is still
      // comfortable rather than merely passing
      const lifted = await page.evaluate((sel) => {
        const el = document.querySelector(`${sel} > .dao-grain--dark`)!;
        return parseFloat(getComputedStyle(el).opacity);
      }, surface);
      const paper = [242, 237, 227];
      // screen at `lifted` against #131210 - a conservative upper bound on how
      // far the ground can travel
      const ground = INK.map((v) => v * (1 - lifted) + 255 * lifted);
      expect(contrast(paper, ground)).toBeGreaterThan(4.5);
    });
  }

  test("the textured black surfaces stay accessible", async ({ page }) => {
    // the paper layer LIFTS a dark ground, which is the one way this change
    // could hurt contrast. Home is already covered by home.spec; the /contact
    // route had no scan of its own and its material changed here too.
    await gotoRoute(page, "/contact");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dao-chrome"]);
  });

  test("Contact and footer read as one surface, with no new seam", async ({ page }) => {
    await gotoRoute(page, "/");
    // the credits sit inside the contact section and inherit its ground; the
    // only boundary is the existing hairline rule, not a change of material
    const got = await page.evaluate(() => {
      const credits = document.querySelector(".dao-credits")!;
      const contact = document.querySelector(".dao-contact")!;
      return {
        nested: contact.contains(credits),
        creditsBg: getComputedStyle(credits).backgroundColor,
        borderTop: getComputedStyle(credits).borderTopWidth,
      };
    });
    expect(got.nested).toBe(true);
    // transparent: the footer is the same material, not a second black
    expect(rgba(got.creditsBg)[3]).toBe(0);
    // the pre-existing hairline stays exactly as it was
    expect(got.borderTop).toBe("1px");
  });
});
