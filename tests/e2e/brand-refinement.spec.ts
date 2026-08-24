import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Brand visual refinement pass.
 *
 *  §02  Selected Work progress fill is Production Blue
 *  §03  the Selected Work black frame is slimmer, still a frame
 *  §04  the Studio Lab botanicals are the high-resolution brandbook artwork
 *  §05  burger numerals are brand red
 *  §06  burger labels fit one line on small mobile, in both locales
 *  §07  the preview's white torn strip is gone; a red ink frame replaced it
 *  §08  the shared hover underline is thinner
 *  §09  Work feature image frames are brand red, metadata stays blue
 *  §10  the Studio Lab card overlaps the boundary and tilts
 *  §11  the Studio black reads as one surface
 *  §12  the Studio sun is larger
 *  §14  WRITE TO THE LAB is brand red with the shared button behaviour
 *  §15-§17  the Process environment is orange paper
 *  §18  the Georgia Production field note is blue paper
 *  §19  both Contact buttons share the blue button system
 *  §20  the pale blob layer is gone
 *  §21  the page ends with the footer
 *  §22  the Start a Project star rotates on hover
 */

const BLUE = [35, 116, 179] as const;
const RED = [208, 62, 38] as const;
const ORANGE = [225, 105, 18] as const;
const INK = [19, 18, 16] as const;
const PAPER = [242, 237, 227] as const;

function rgba(v: string): [number, number, number, number] {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`not a colour: ${v}`);
  const p = m[1].split(",").map((n) => parseFloat(n));
  return [p[0]!, p[1]!, p[2]!, p[3] === undefined ? 1 : p[3]!];
}
function lum(c: readonly number[]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
}
function contrast(a: readonly number[], b: readonly number[]): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
/** flatten a translucent fill over an opaque ground */
function over(fg: readonly number[], bg: readonly number[]) {
  return [0, 1, 2].map((i) => fg[i]! * fg[3]! + bg[i]! * (1 - fg[3]!));
}

async function styles(page: Page, sel: string, props: string[], pseudo?: string) {
  return page.evaluate(
    ([s, list, pse]) => {
      const el = document.querySelector(s as string);
      if (!el) return null;
      const cs = getComputedStyle(el, (pse as string) || undefined);
      const out: Record<string, string> = {};
      for (const p of list as string[]) out[p] = cs.getPropertyValue(p);
      return out;
    },
    [sel, props, pseudo ?? ""] as const,
  );
}

/** open the burger, dealing with the idle chrome on touch viewports */
async function openBurger(page: Page) {
  await page.keyboard.press("Shift");
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 8000,
    })
    .catch(() => {});
  await page.locator(".dao-burger").click();
  await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);
}

test.describe("§02-§03 Selected Work", () => {
  test("the progress fill is Production Blue", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await styles(page, ".dao-work__progfill", ["background-color"]);
    expect(got, "an indicator must be filling").not.toBeNull();
    const c = rgba(got!["background-color"]!);
    expect(c.slice(0, 3)).toEqual([...BLUE]);
    // and specifically no longer the black the previous pass introduced
    expect(c.slice(0, 3)).not.toEqual([0, 0, 0]);
  });

  test("the indicator's geometry and animation are untouched", async ({ page }) => {
    await gotoRoute(page, "/");
    const shape = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".dao-work__prog")];
      const active = document.querySelector(".dao-work__prog.is-active")!;
      const inactive = items.find((el) => !el.classList.contains("is-active"))!;
      const fill = getComputedStyle(document.querySelector(".dao-work__progfill")!);
      return {
        count: items.length,
        gap: getComputedStyle(document.querySelector(".dao-work__progress")!).gap,
        activeW: getComputedStyle(active).width,
        inactiveW: getComputedStyle(inactive).width,
        inactiveBg: getComputedStyle(inactive).backgroundColor,
        mask: getComputedStyle(inactive).maskImage || getComputedStyle(inactive).webkitMaskImage,
        anim: `${fill.animationName} ${fill.animationDuration} ${fill.animationTimingFunction}`,
      };
    });
    expect(shape.count).toBe(5);
    expect(shape.gap).toBe("8px");
    expect(shape.activeW).toBe("34px");
    expect(shape.inactiveW).toBe("18px");
    expect(rgba(shape.inactiveBg).slice(0, 3)).toEqual([...PAPER]);
    expect(shape.mask).toContain("paint-stroke");
    expect(shape.anim).toBe("dao-prog-fill 5s linear");
  });

  test("the carousel still advances", async ({ page }) => {
    await gotoRoute(page, "/");
    await page.locator(".dao-work").scrollIntoViewIfNeeded();
    const idx = () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".dao-work__prog")].findIndex((el) =>
          el.classList.contains("is-active"),
        ),
      );
    const first = await idx();
    await expect.poll(idx, { timeout: 20_000 }).not.toBe(first);
  });

  test("§03 the black frame is slimmer but still a frame", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await styles(page, ".dao-work__sheet", [
      "left",
      "top",
      "background-color",
      "transform",
    ]);
    const l = Math.abs(parseFloat(got!["left"]!));
    const t = Math.abs(parseFloat(got!["top"]!));
    // was 18/16; visibly slimmer, and deliberately not hairline
    expect(l).toBeLessThanOrEqual(12);
    expect(l).toBeGreaterThanOrEqual(6);
    expect(t).toBeLessThanOrEqual(12);
    expect(t).toBeGreaterThanOrEqual(5);
    // still black, still tilted - the tilt is its handmade character
    expect(rgba(got!["background-color"]!).slice(0, 3)).toEqual([0, 0, 0]);
    expect(got!["transform"]).not.toBe("none");
  });
});

test.describe("§04 the botanical assets are the brandbook originals", () => {
  test("both masks carry enough resolution for their rendered size", async ({ page }) => {
    await gotoRoute(page, "/");
    const probe = await page.evaluate(async () => {
      const load = (src: string) =>
        new Promise<{ w: number; h: number }>((res, rej) => {
          const img = new Image();
          img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = rej;
          img.src = src;
        });
      return {
        stem: await load("/assets/graphics/stem.webp"),
        rose: await load("/assets/graphics/floral-rose.webp"),
        stemBox: Math.round(
          document.querySelector(".dao-lab__stem")!.getBoundingClientRect().width,
        ),
      };
    });
    // the old files were 396x560 and 528x560 - far under the box they are drawn
    // in, which is what made them look pixelated
    expect(probe.stem.w).toBeGreaterThan(700);
    expect(probe.rose.w).toBeGreaterThan(700);
    // and comfortably above the largest box either is rendered into
    expect(probe.stem.w).toBeGreaterThan(probe.stemBox * 1.5);
  });
});

test.describe("§05-§08 burger menu", () => {
  test("the numerals are brand red", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const nums = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-nav__num")].map((el) => getComputedStyle(el).color),
    );
    expect(nums.length).toBeGreaterThanOrEqual(8);
    for (const c of nums) expect(rgba(c).slice(0, 3)).toEqual([...RED]);
  });

  test("the labels are not recoloured with them", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const label = await styles(page, ".dao-nav__link", ["color"]);
    // paper, or the Lab row's mint - never the numerals' red
    expect(rgba(label!["color"]!).slice(0, 3)).not.toEqual([...RED]);
  });

  test("§08 the shared underline base is thinner", async ({ page }) => {
    await gotoRoute(page, "/");
    // Read the BASE off the stylesheet. Sampling "the first .dao-strike in the
    // DOM" measures whichever element happens to come first - which is a local
    // override, not the shared rule this section is about.
    const base = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of rules) {
          const r = rule as CSSStyleRule;
          if (r.selectorText === ".dao-strike") {
            return { height: r.style.height, mask: r.style.mask || r.style.webkitMask };
          }
        }
      }
      return null;
    });
    expect(base, "the shared rule must exist").not.toBeNull();
    const h = parseFloat(base!.height);
    expect(h, "was 8px").toBeLessThanOrEqual(5);
    expect(h, "still a drawn stroke, not a hairline").toBeGreaterThanOrEqual(2);
    // thinner, not straighter
    expect(base!.mask).toContain("paint-stroke");
  });

  test("§08 no local override towers over the new base", async ({ page }) => {
    // the point of moving a shared token is that the whole system moves; a
    // 12px override left behind would defeat it
    for (const route of ["/", "/work", "/studio-lab", "/start-a-project"]) {
      await gotoRoute(page, route);
      const worst = await page.evaluate(() => {
        let max = 0;
        let who = "";
        for (const el of document.querySelectorAll(".dao-strike")) {
          const hh = parseFloat(getComputedStyle(el).height);
          if (hh > max) {
            max = hh;
            who = (el.parentElement?.className as string) || "?";
          }
        }
        return { max, who };
      });
      expect(worst.max, `${route}: ${worst.who}`).toBeLessThanOrEqual(6);
    }
  });
});

test.describe("§06 burger labels fit one line on small mobile", () => {
  for (const width of [430, 390, 375, 360, 320]) {
    for (const [label, route] of [
      ["EN", "/"],
      ["KA", "/ka"],
    ] as const) {
      test(`${label} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 780 });
        await gotoRoute(page, route);
        await openBurger(page);
        const rows = await page.evaluate(() =>
          [...document.querySelectorAll(".dao-nav__link")].map((el) => {
            const cs = getComputedStyle(el);
            const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1;
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || "").trim().slice(0, 26),
              h: r.height,
              lh,
              right: r.right,
              vw: document.documentElement.clientWidth,
            };
          }),
        );
        expect(rows.length).toBe(8);
        for (const r of rows) {
          // a second line would put the box past ~1.6 line-heights
          expect(r.h, `${r.text} wrapped`).toBeLessThan(r.lh * 1.6);
          expect(r.right, `${r.text} past the edge`).toBeLessThanOrEqual(r.vw + 1);
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  }

  test("only one language switcher is visible while the sheet is open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const visible = await page.evaluate(
      () =>
        [...document.querySelectorAll(".dao-lang")].filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          if (r.bottom < 0 || r.top > innerHeight) return false;
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!top && (el.contains(top) || top.contains(el));
        }).length,
    );
    expect(visible).toBe(1);
  });
});

test.describe("§07 the hover preview frame", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the white torn strip is gone and a red ink frame replaces it", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-nav__preview")!;
      const before = getComputedStyle(el, "::before");
      const after = getComputedStyle(el, "::after");
      return {
        beforeContent: before.content,
        afterBg: after.backgroundColor,
        afterMask: after.maskImage || after.webkitMaskImage,
        afterInset: after.inset,
      };
    });
    // the torn cream header is removed outright
    expect(got.beforeContent).toBe("none");
    // and the frame is brand red, drawn, and on all four sides
    expect(rgba(got.afterBg).slice(0, 3)).toEqual([...RED]);
    expect(got.afterMask).toContain("ink-frame");
    expect(got.afterMask).not.toContain("torn-edge");
  });

  test("the frame is a hand-drawn asset, not a CSS border", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const got = await styles(page, ".dao-nav__preview", ["border-width", "border-radius"]);
    expect(parseFloat(got!["border-width"]!)).toBe(0);
    expect(got!["border-radius"]).toBe("0px");
  });
});

test.describe("§09 Work frames", () => {
  test("the feature image frame is brand red", async ({ page }) => {
    await gotoRoute(page, "/work");
    const got = await styles(page, ".dwk__row--feature .dwk__framepaper", [
      "background-color",
      "transform",
    ]);
    expect(got, "the feature frame must exist").not.toBeNull();
    expect(rgba(got!["background-color"]!).slice(0, 3)).toEqual([...RED]);
    expect(got!["transform"], "keeps its tilt").not.toBe("none");
  });

  test("Production Blue survives where it is metadata, not framing", async ({ page }) => {
    await gotoRoute(page, "/work");
    const badge = await styles(page, ".dwk__badge", ["background-color"]);
    const tick = await styles(page, ".dwk__tick", ["background-color"]);
    expect(rgba(badge!["background-color"]!).slice(0, 3)).toEqual([...BLUE]);
    expect(rgba(tick!["background-color"]!).slice(0, 3)).toEqual([...BLUE]);
  });
});

test.describe("§10-§12 Studio", () => {
  test("the Lab card overlaps the boundary above and tilts", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const got = await page.evaluate(() => {
      const card = document.querySelector(".dst__labpanel")!;
      const rooms = document.querySelector(".dst__rooms")!;
      const cs = getComputedStyle(card);
      return {
        cardTop: card.getBoundingClientRect().top + scrollY,
        roomsTop: rooms.getBoundingClientRect().top + scrollY,
        transform: cs.transform,
        shadow: cs.boxShadow,
        bg: cs.backgroundColor,
        cardRight: card.getBoundingClientRect().right,
        vw: document.documentElement.clientWidth,
      };
    });
    // it starts above its own section, so it sits across the boundary
    expect(got.cardTop).toBeLessThan(got.roomsTop - 8);
    expect(got.transform).not.toBe("none");
    expect(got.shadow).not.toBe("none");
    // still the green paper panel, and still inside the viewport
    expect(rgba(got.bg).slice(0, 3)).toEqual([157, 171, 92]);
    expect(got.cardRight).toBeLessThanOrEqual(got.vw + 1);
  });

  test("the tilt is subtle and rises left to right", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const m = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dst__labpanel")!).transform,
    );
    // matrix(a, b, c, d, e, f): b is sin(theta); negative => right edge higher
    const parts = m
      .match(/matrix\(([^)]+)\)/)![1]
      .split(",")
      .map(Number);
    const deg = (Math.atan2(parts[1]!, parts[0]!) * 180) / Math.PI;
    expect(deg).toBeLessThan(0);
    expect(Math.abs(deg), "subtle, not a dramatic diagonal").toBeLessThanOrEqual(3);
  });

  test("the Lab card text is fully readable and uncropped", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const clipped = await page.evaluate(() => {
      const card = document.querySelector(".dst__labpanel")!;
      const cb = card.getBoundingClientRect();
      const bad: string[] = [];
      for (const el of card.querySelectorAll("span, a, p, h2, h3")) {
        if (!el.textContent?.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.left < cb.left - 1 || r.right > cb.right + 1) bad.push(el.className || el.tagName);
      }
      return bad;
    });
    expect(clipped).toEqual([]);
    await expect(page.locator(".dst__labpanel a").first()).toBeVisible();
  });

  test("§11 the black area is one continuous surface", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const got = await page.evaluate(() => {
      const de = document.documentElement;
      const rooms = document.querySelector(".dst__rooms")!;
      const handoff = document.querySelector(".dst__handoff")!;
      const shell = document.querySelector(".dao")!;
      return {
        roomsBg: getComputedStyle(rooms).backgroundColor,
        handoffBg: getComputedStyle(handoff).backgroundColor,
        roomsWeave: !!rooms.querySelector(":scope > .dao-weave"),
        handoffWeave: !!handoff.querySelector(":scope > .dao-weave"),
        docH: de.scrollHeight,
        shellBot: Math.round(shell.getBoundingClientRect().bottom + scrollY),
      };
    });
    // same ground, same material, on both black bands
    expect(got.roomsBg).toBe(got.handoffBg);
    expect(got.roomsWeave).toBe(true);
    expect(got.handoffWeave).toBe(true);
    // and no un-textured strip below the shell - that was the actual seam:
    // the decorative sun used to extend the document past the page element
    expect(got.docH - got.shellBot).toBeLessThanOrEqual(4);
  });

  test("§12 the sun is larger and still quiet", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dst__handoffsun")!;
      const cs = getComputedStyle(el);
      return {
        w: el.getBoundingClientRect().width,
        bg: cs.backgroundColor,
        mask: cs.maskImage || cs.webkitMaskImage,
      };
    });
    expect(got.w, "was 300px").toBeGreaterThan(340);
    expect(got.mask).toContain("sun");
    // unchanged opacity - larger, not louder
    expect(rgba(got.bg)[3]).toBeLessThanOrEqual(0.06);
  });
});

test.describe("§14 / §19 the shared button system", () => {
  test("WRITE TO THE LAB rests at full brand red", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const got = await styles(page, ".dlb__collab .dao-chipcta", ["background-color", "color"]);
    const bg = rgba(got!["background-color"]!);
    expect(bg.slice(0, 3)).toEqual([...RED]);
    expect(bg[3], "§14 asks for #d03e26 at rest").toBe(1);
    expect(contrast(rgba(got!["color"]!), RED)).toBeGreaterThanOrEqual(4.5);
  });

  test("WRITE TO THE LAB changes state on hover, and never to blue", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const cta = page.locator(".dlb__collab .dao-chipcta").first();
    await cta.scrollIntoViewIfNeeded();
    const bg = () => cta.evaluate((el) => getComputedStyle(el).backgroundColor);
    const rest = await bg();
    await cta.hover();
    await page.waitForFunction(
      () => document.querySelector(".dlb__collab .dao-chipcta")!.matches(":hover"),
      null,
      { timeout: 5000 },
    );
    await expect.poll(bg, { timeout: 4000 }).not.toBe(rest);
    const hov = rgba(await bg());
    // deepened red, not a shift into the blue
    expect(hov[0]).toBeGreaterThan(hov[2]);
  });

  for (const sel of [".dct__sendnote", ".dct .dao-chipcta"]) {
    test(`${sel} rests on softened blue and reaches full #2374b3`, async ({ page }) => {
      await gotoRoute(page, "/contact");
      const btn = page.locator(sel).first();
      await btn.scrollIntoViewIfNeeded();
      const got = await styles(page, sel, ["background-color", "color"]);
      const bg = rgba(got!["background-color"]!);
      expect(bg.slice(0, 3), "exactly the brand blue").toEqual([...BLUE]);
      expect(bg[3], "softened at rest").toBeGreaterThan(0.4);
      expect(bg[3]).toBeLessThan(1);
      expect(contrast(rgba(got!["color"]!), over(bg, INK))).toBeGreaterThanOrEqual(4.5);

      const read = () => btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      await btn.hover();
      await page.waitForFunction(
        (s) => document.querySelector(s as string)!.matches(":hover"),
        sel,
        {
          timeout: 5000,
        },
      );
      await expect.poll(read, { timeout: 4000 }).toBe("rgb(35, 116, 179)");
    });
  }

  test("both Contact buttons use the SAME system, not two", async ({ page }) => {
    await gotoRoute(page, "/contact");
    const got = await page.evaluate(() =>
      [".dct__sendnote", ".dct .dao-chipcta"].map((s) => {
        const el = document.querySelector(s)!;
        const cs = getComputedStyle(el);
        return {
          shares: el.classList.contains("dao-btnfill"),
          dur: cs.transitionDuration,
          rest: cs.backgroundColor,
        };
      }),
    );
    for (const g of got) expect(g.shares, "must opt into the shared class").toBe(true);
    expect(got[0]!.rest).toBe(got[1]!.rest);
    expect(got[0]!.dur).toBe(got[1]!.dur);
  });
});

test.describe("§15-§17 Process", () => {
  test("the environment is orange paper, not flat orange", async ({ page }) => {
    await gotoRoute(page, "/process");
    const bg = await styles(page, ".dpr", ["background-color"]);
    expect(rgba(bg!["background-color"]!).slice(0, 3)).toEqual([...ORANGE]);

    const grain = await styles(page, ".dpr > .dao-grain--strong", [
      "opacity",
      "background-image",
      "mix-blend-mode",
    ]);
    expect(grain, "the paper layer must exist").not.toBeNull();
    expect(parseFloat(grain!["opacity"]!), "clearly visible on a mid-tone").toBeGreaterThan(0.5);
    expect(grain!["background-image"]).toContain("paper-grain");
    expect(grain!["mix-blend-mode"]).toBe("multiply");
  });

  test("the shared cream page ground is untouched elsewhere", async ({ page }) => {
    // .dao-page--paper has exactly two consumers - /process and
    // /georgia-production - which is precisely why the orange is scoped to the
    // route's own .dpr class rather than the shared one. Without that scoping
    // Georgia Production would have turned orange too.
    await gotoRoute(page, "/georgia-production");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-page--paper")!;
      return { bg: getComputedStyle(el).backgroundColor, cls: el.className };
    });
    expect(got.cls).toContain("dao-page--paper");
    expect(got.cls, "and it must not carry the Process class").not.toContain("dpr");
    expect(rgba(got.bg).slice(0, 3)).toEqual([...PAPER]);
  });

  test("§16 HOW WE WORK is readable on the orange", async ({ page }) => {
    await gotoRoute(page, "/process");
    const got = await styles(page, ".dpr__cover .dao-kicker", ["color"]);
    const c = rgba(got!["color"]!);
    expect(contrast(c, ORANGE)).toBeGreaterThanOrEqual(4.5);
    // and it is no longer the ground colour it used to be
    expect(c.slice(0, 3)).not.toEqual([...ORANGE]);
  });

  test("§17 the decorative line is dark printed ink", async ({ page }) => {
    await gotoRoute(page, "/process");
    const got = await styles(page, ".dpr__serpent", ["background-color", "mask-image"]);
    const c = rgba(got!["background-color"]!);
    // dark against the orange, and deliberately not solid black
    expect(lum(c.slice(0, 3))).toBeLessThan(lum(ORANGE));
    expect(c[3]).toBeLessThan(1);
    expect(c[3]).toBeGreaterThan(0.15);
    // same path, same artwork
    expect(got!["mask-image"]).toContain("serpent-long");
  });

  test("the call sheets stay readable on the orange", async ({ page }) => {
    await gotoRoute(page, "/process");
    const got = await page.evaluate(() => {
      const card = document.querySelector(".dpr__sheet")!;
      const name = card.querySelector(".dpr__stagename")!;
      return {
        cardBg: getComputedStyle(card).backgroundColor,
        nameColor: getComputedStyle(name).color,
      };
    });
    expect(contrast(rgba(got.nameColor), rgba(got.cardBg))).toBeGreaterThan(4.5);
  });
});

test.describe("§18 Georgia Production field note", () => {
  test("the card is Production Blue paper with readable copy", async ({ page }) => {
    await gotoRoute(page, "/georgia-production");
    const bg = await styles(page, ".dgp__note", ["background-color"]);
    expect(rgba(bg!["background-color"]!).slice(0, 3)).toEqual([...BLUE]);

    const tex = await styles(page, ".dgp__note", ["opacity", "background-image"], "::before");
    expect(parseFloat(tex!["opacity"]!), "visible stock, not flat blue").toBeGreaterThan(0.5);
    expect(tex!["background-image"]).toContain("paper-grain");

    const texts = await page.evaluate(() =>
      [...document.querySelectorAll(".dgp__note span, .dgp__note p")]
        .filter((el) => el.textContent?.trim())
        .map((el) => getComputedStyle(el).color),
    );
    expect(texts.length).toBeGreaterThanOrEqual(3);
    for (const c of texts) expect(contrast(rgba(c), BLUE)).toBeGreaterThanOrEqual(4.5);
  });

  test("GP-NOTE-01 is still there", async ({ page }) => {
    await gotoRoute(page, "/georgia-production");
    await expect(page.locator(".dgp__note")).toContainText("GP-NOTE-01");
  });
});

test.describe("§20-§21 Contact", () => {
  test("the pale blob layer is gone, the paper is not", async ({ page }) => {
    await gotoRoute(page, "/contact");
    // the oxide stain blended with screen, which could only lighten the ground
    await expect(page.locator(".dct__oxide")).toHaveCount(0);
    const bg = await styles(page, ".dct", ["background-color"]);
    expect(rgba(bg!["background-color"]!).slice(0, 3)).toEqual([...INK]);
    // the material that should remain
    await expect(page.locator(".dct > .dao-grain--dark")).toHaveCount(1);
    await expect(page.locator(".dct > .dao-weave")).toHaveCount(1);
  });

  test("§21 the page ends with the footer", async ({ page }) => {
    await gotoRoute(page, "/contact");
    const got = await page.evaluate(() => {
      const shell = document.querySelector(".dao")!;
      const credits = document.querySelector(".dao-credits")!;
      return {
        docH: document.documentElement.scrollHeight,
        shellBot: Math.round(shell.getBoundingClientRect().bottom + scrollY),
        creditsBot: Math.round(credits.getBoundingClientRect().bottom + scrollY),
      };
    });
    // nothing extends the document past the shell any more
    expect(got.docH - got.shellBot).toBeLessThanOrEqual(4);
    // and the footer really is at the end, with only breathing room after it
    expect(got.shellBot - got.creditsBot).toBeLessThanOrEqual(90);
  });

  test("the enlarged sun no longer lengthens the page", async ({ page }) => {
    await gotoRoute(page, "/contact");
    const got = await page.evaluate(() => {
      const sun = document.querySelector(".dao-contact__sun");
      const shell = document.querySelector(".dao")!;
      return {
        sunBot: sun ? Math.round(sun.getBoundingClientRect().bottom + scrollY) : null,
        shellBot: Math.round(shell.getBoundingClientRect().bottom + scrollY),
        docH: document.documentElement.scrollHeight,
        clip: getComputedStyle(document.querySelector(".dct")!).overflow,
      };
    });
    // the sun may hang past its section - it just must not extend the document
    expect(got.clip).not.toBe("visible");
    expect(got.docH).toBeLessThanOrEqual(got.shellBot + 4);
  });
});

test.describe("§22 Start a Project", () => {
  test("the star rotates on hover, sharing the Contact animation", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    const btn = page.locator(".dbr__send").first();
    const star = page.locator(".dbr__send .dao-chipcta__glyph").first();
    await btn.scrollIntoViewIfNeeded();
    const tf = () => star.evaluate((el) => getComputedStyle(el).transform);
    const rest = await tf();
    await btn.hover();
    await page.waitForFunction(
      () => document.querySelector(".dbr__send")!.matches(":hover"),
      null,
      {
        timeout: 5000,
      },
    );
    await expect.poll(tf, { timeout: 4000 }).not.toBe(rest);
    // the rotation is a 300ms transition, so the angle has to be read once it
    // has SETTLED - polling only until it *starts* moving catches it mid-flight
    let last = "";
    let still = 0;
    for (let i = 0; i < 40 && still < 3; i += 1) {
      const v = await tf();
      still = v === last ? still + 1 : 0;
      last = v;
      await page.waitForTimeout(50);
    }
    // it is a rotation, and it is the same 45deg the Contact star uses
    const m = last
      .match(/matrix\(([^)]+)\)/)![1]
      .split(",")
      .map(Number);
    const deg = Math.abs((Math.atan2(m[1]!, m[0]!) * 180) / Math.PI);
    expect(deg).toBeGreaterThan(30);
    expect(deg).toBeLessThan(60);
  });

  test("keyboard focus gets the same state", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    const star = page.locator(".dbr__send .dao-chipcta__glyph").first();
    const tf = () => star.evaluate((el) => getComputedStyle(el).transform);
    const rest = await tf();
    await page
      .locator(".dbr__send")
      .first()
      .evaluate((el: HTMLElement) => el.focus());
    await expect.poll(tf, { timeout: 4000 }).not.toBe(rest);
  });

  test("the star and the button geometry are unchanged", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    const got = await page.evaluate(() => {
      const btn = document.querySelector(".dbr__send")!;
      const star = document.querySelector(".dbr__send .dao-chipcta__glyph")!;
      const scs = getComputedStyle(star);
      return {
        padding: getComputedStyle(btn).padding,
        starBg: scs.backgroundColor,
        starW: scs.width,
        mask: scs.maskImage || scs.webkitMaskImage,
      };
    });
    expect(got.padding).toBe("17px 32px");
    expect(rgba(got.starBg).slice(0, 3)).toEqual([...RED]);
    expect(got.starW).toBe("30px");
    expect(got.mask).toContain("star-solid");
  });
});

test.describe("no horizontal overflow on any touched route", () => {
  for (const width of [1440, 768, 390, 320]) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 860 });
      for (const route of [
        "/",
        "/work",
        "/studio",
        "/studio-lab",
        "/process",
        "/georgia-production",
        "/contact",
        "/start-a-project",
      ]) {
        await gotoRoute(page, route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} @ ${width}`).toBeLessThanOrEqual(1);
      }
    });
  }
});
