import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Typography and navigation cleanup pass.
 *
 * Everything here is asserted from COMPUTED styles, not from declarations: the
 * brief asks that these elements genuinely resolve to Optika rather than merely
 * name it at the head of a fallback stack.
 */

/** first family in a computed stack, unquoted and lowercased */
const first = (stack: string) => stack.split(",")[0]!.replace(/["']/g, "").trim().toLowerCase();

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

/* ------------------------------------------------------- 01 burger flower -- */

test.describe("01 the Studio Lab flower is gone", () => {
  for (const [label, route] of [
    ["EN", "/"],
    ["KA", "/ka"],
  ] as const) {
    test(`renders no bloom in the Studio Lab row (${label})`, async ({ page }) => {
      await gotoRoute(page, route);
      await openBurger(page);
      const row = page.locator(".dao-nav__row--lab");
      await expect(row).toHaveCount(1);
      expect(
        await row.locator(".dao-nav__bloom, .dao-nav__bloomslot, [data-dao-bloom]").count(),
      ).toBe(0);
      // and no masked ornament of any kind is left inside the row
      expect(await row.locator(".dao-mask").count()).toBe(0);
    });
  }

  test("leaves a single intentional gap between the two labels", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const gap = await page.evaluate(() => {
      const row = document.querySelector(".dao-nav__row--lab")!;
      const link = row.querySelector(".dao-nav__link--lab")!.getBoundingClientRect();
      const ka = row.querySelector(".dao-nav__ka")!.getBoundingClientRect();
      return +(ka.left - link.right).toFixed(1);
    });
    // the same 26px every other row uses - no residue from the removed slot
    expect(gap).toBe(26);
  });

  test("does not regress the row spacing", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const gaps = await page.evaluate(() => {
      const masks = [...document.querySelectorAll(".dao-nav__list > .dao-nav__mask")];
      const out: number[] = [];
      for (let i = 1; i < masks.length; i += 1) {
        out.push(
          +(
            masks[i].getBoundingClientRect().top - masks[i - 1].getBoundingClientRect().bottom
          ).toFixed(1),
        );
      }
      return out;
    });
    expect(gaps).toHaveLength(7);
    expect(new Set(gaps).size, `gaps: ${gaps.join(",")}`).toBe(1);
  });

  test("keeps the colour hierarchy and the green rule", async ({ page }) => {
    for (const route of ["/", "/ka"]) {
      await gotoRoute(page, route);
      await openBurger(page);
      const state = await page.evaluate(() => {
        const row = document.querySelector(".dao-nav__row--lab")!;
        const link = row.querySelector(".dao-nav__link--lab")!;
        return {
          primary: getComputedStyle(link).color,
          secondary: getComputedStyle(row.querySelector(".dao-nav__ka")!).color,
          strikes: link.querySelectorAll(".dao-strike").length,
        };
      });
      expect(state.primary, route).toBe("rgb(157, 171, 92)"); // #9dab5c
      expect(state.secondary, route).toBe("rgb(208, 62, 38)"); // #d03e26
      expect(state.strikes).toBe(1);
    }
  });

  test("recolours no other navigation item", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const others = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-nav__row")]
        .filter((r) => !r.classList.contains("dao-nav__row--lab"))
        .map((r) => getComputedStyle(r.querySelector(".dao-nav__link")!).color),
    );
    expect(others.length).toBe(7);
    for (const c of others) expect(c).not.toBe("rgb(157, 171, 92)");
  });

  test("keeps the Studio Lab route and keyboard access", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const link = page.locator(".dao-nav__link--lab");
    await expect(link).toHaveAttribute("href", "/studio-lab");
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/studio-lab$/);
  });
});

/* ------------------------------------------------- 02 Services capability -- */

/**
 * SUPERSEDES "02 Services capability titles resolve to Optika 600", which
 * required all NINE to be strong Optika.
 *
 * The nine are not one tier. Five of them are the page's SPREAD headings - the
 * three major services, group I (Creative Direction / Art Direction), group III
 * (Film & Video Production / Photography) and group IV (Post-Production) - and
 * they are the only large headings on the site that were still set in the UI
 * face while every other route's masthead used the display face. They now take
 * --dao-f-display, at 400, because Adevas ships Regular only and 600 on it
 * would be a synthesised bold.
 *
 * The other four are group II's capability GRID inside a spread, not spread
 * headings, and they deliberately stay strong Optika: the hierarchy between a
 * spread heading and the grid under it depends on their being different faces.
 *
 * What the original test protected - every capability title resolves through
 * the design system, at a REAL weight, and none is patched per instance - is
 * kept in full and simply asked per tier.
 */
test.describe("02 Services capability titles resolve to their tier's face", () => {
  const DISPLAY = [
    "Creative Direction",
    "Art Direction",
    "Film & Video Production",
    "Photography",
    "Post-Production",
  ];
  const OPTIKA = ["Production Design", "Scenography", "Costume Design", "Decoration"];

  test("every capability title on the page, all nine of them", async ({ page }) => {
    await gotoRoute(page, "/services");
    const titles = await page.locator(".dsv__name").evaluateAll((els) =>
      els.map((e) => {
        const cs = getComputedStyle(e);
        return {
          text: e.textContent!.trim(),
          family: cs.fontFamily,
          weight: cs.fontWeight,
          size: parseFloat(cs.fontSize),
          tier: e.closest(".dsv__g1names, .dsv__g3names, .dsv__g4") ? "display" : "ui",
        };
      }),
    );
    // 01, 02, 03-06, 07, 08, 09 - the whole list, not just what a screenshot showed
    expect(titles.length).toBeGreaterThanOrEqual(9);
    for (const t of titles) {
      expect(t.size, t.text).toBeGreaterThan(0);
      if (t.tier === "display") {
        expect(first(t.family), t.text).toBe("adevas");
        // Adevas has one weight - anything above it would be synthesised
        expect(t.weight, t.text).toBe("400");
      } else {
        expect(first(t.family), t.text).toBe("optika");
        expect(t.weight, t.text).toBe("600");
      }
    }
    for (const name of DISPLAY) {
      const t = titles.find((x) => x.text.includes(name));
      expect(t, `${name} is present`).toBeTruthy();
      expect(t!.tier, `${name} is a spread heading`).toBe("display");
    }
    for (const name of OPTIKA) {
      const t = titles.find((x) => x.text.includes(name));
      expect(t, `${name} is present`).toBeTruthy();
      expect(t!.tier, `${name} stays in the group II grid`).toBe("ui");
    }
  });

  test("and in KA, through the locale-aware tokens", async ({ page }) => {
    await gotoRoute(page, "/ka/services");
    const titles = await page.locator(".dsv__name").evaluateAll((els) =>
      els.map((e) => {
        const cs = getComputedStyle(e);
        return {
          family: cs.fontFamily,
          weight: cs.fontWeight,
          tier: e.closest(".dsv__g1names, .dsv__g3names, .dsv__g4") ? "display" : "ui",
        };
      }),
    );
    expect(titles.length).toBeGreaterThanOrEqual(9);
    for (const t of titles) {
      // Georgian never falls back to a Latin face, in either tier
      expect(first(t.family)).not.toBe("adevas");
      expect(first(t.family)).not.toBe("optika");
      expect(t.weight).toBe(t.tier === "display" ? "400" : "600");
    }
  });

  test("wording, numbering and Related Work routing are untouched", async ({ page }) => {
    await gotoRoute(page, "/services");
    await expect(page.locator("[data-dao-capability]")).toHaveCount(9);
    const hrefs = await page
      .locator("[data-dao-capability]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const h of hrefs) expect(h).toMatch(/^\/work\?capability=/);
  });
});

/* --------------------------------------------------------- 03/04 Studio ---- */

test.describe("03/04 Studio headings resolve to Optika 600", () => {
  test("Make something with us.", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const h = page.locator(".dst__make");
    await expect(h).toHaveCount(1);
    const cs = await h.evaluate((e) => {
      const s = getComputedStyle(e);
      return { family: s.fontFamily, weight: s.fontWeight };
    });
    expect(first(cs.family)).toBe("optika");
    expect(cs.weight).toBe("600");
    // the red full stop survives as its own span
    const dot = await h
      .locator("span span")
      .last()
      .evaluate((e) => getComputedStyle(e).color);
    expect(dot).toBe("rgb(208, 62, 38)");
    // The CTA below is out of scope, and it did not pick up the heading's
    // treatment: .dao-cta declares its own type (11px / 0.28em / 600, unchanged
    // from main), so it is independent of .dst__make rather than inheriting it.
    const cta = await page
      .locator(".dst__handoff a.dao-cta")
      .first()
      .evaluate((e) => {
        const s = getComputedStyle(e);
        return { size: parseFloat(s.fontSize), tracking: s.letterSpacing, weight: s.fontWeight };
      });
    expect(cta.size).toBe(11);
    expect(cta.tracking).toBe("3.08px"); // 0.28em at 11px
    expect(cta.weight).toBe("600");
    // and it is emphatically not being sized by the heading
    expect(cta.size).toBeLessThan(28);
  });

  test("Education, research, experiment.", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const el = page.locator(".dst__lablines");
    await expect(el).toHaveCount(1);
    const cs = await el.evaluate((e) => {
      const s = getComputedStyle(e);
      return { family: s.fontFamily, weight: s.fontWeight, ws: s.whiteSpace };
    });
    expect(first(cs.family)).toBe("optika");
    expect(cs.weight).toBe("600");
    // the three-line structure is preserved
    expect(cs.ws).toBe("pre-line");
    const text = await el.innerText();
    expect(text.split("\n").filter(Boolean)).toHaveLength(3);
  });

  test("the lab card kicker and CTA are unchanged", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await expect(page.locator(".dst__labpanel-inner .dao-kicker")).toHaveCount(1);
    await expect(page.locator('.dst__labpanel-inner a[href="/studio-lab"]')).toHaveCount(1);
  });

  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    test(`the lab card does not clip or overflow at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/studio", "/ka/studio"]) {
        await gotoRoute(page, route);
        const m = await page.evaluate(() => {
          const el = document.querySelector(".dst__lablines") as HTMLElement;
          const panel = document.querySelector(".dst__labpanel-inner") as HTMLElement;
          return {
            clipped: el.scrollWidth > el.clientWidth + 1,
            insidePanel:
              el.getBoundingClientRect().right <= panel.getBoundingClientRect().right + 1,
            docOver: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        expect(m.clipped, `${route} @${width} clipped`).toBe(false);
        expect(m.insidePanel, `${route} @${width} overflows the card`).toBe(true);
        expect(m.docOver, `${route} @${width}`).toBeLessThanOrEqual(0);
      }
    });
  }
});

/* ------------------------------------------------------ 05 Study card ------ */

/* REMOVED: "05 Studio Lab study card titles resolve to Optika 600".
   The study cards, the LAB reference line and the filter they sat behind were
   the field-notes page, which the approved Studio Lab design replaces. The
   weight contract itself is unchanged and still enforced on every other
   surface by the cases around this one; the Lab's own type is guarded in
   studio-lab.spec.ts. */

test.describe("06 Start a Project placeholders resolve to Optika 400", () => {
  for (const [label, route] of [
    ["EN", "/start-a-project"],
    ["KA", "/ka/start-a-project"],
  ] as const) {
    test(`every placeholder is Optika 400, not bold (${label})`, async ({ page }) => {
      await gotoRoute(page, route);
      const fields = await page.locator(".dbr__write").evaluateAll((els) =>
        els.map((e) => {
          const ph = getComputedStyle(e, "::placeholder");
          return {
            placeholder: (e as HTMLInputElement | HTMLTextAreaElement).placeholder,
            family: ph.fontFamily,
            weight: ph.fontWeight,
            color: ph.color,
          };
        }),
      );
      expect(fields).toHaveLength(3);
      for (const f of fields) {
        expect(f.placeholder.length, "the wording is preserved").toBeGreaterThan(0);
        expect(Number(f.weight), f.placeholder).toBeLessThan(600);
        expect(f.color, "muted colour kept").toBe("rgba(19, 18, 16, 0.4)");
      }
      if (label === "EN") {
        for (const f of fields) expect(first(f.family), f.placeholder).toBe("optika");
      }
    });
  }

  test("labels, field numbers and questions were NOT converted to Optika Regular", async ({
    page,
  }) => {
    await gotoRoute(page, "/start-a-project");
    const other = await page.evaluate(() => {
      const g = (s: string) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { family: cs.fontFamily, weight: cs.fontWeight };
      };
      return { label: g(".dbr__fieldlabel"), num: g(".dbr__num"), q: g(".dbr__q") };
    });
    // the field number keeps the numeral face, not Optika
    expect(other.num!.family.toLowerCase()).toContain("glacier");
    // the label keeps its own 500, not the placeholder 400
    expect(other.label!.weight).toBe("500");
    // and the question keeps the editorial weight
    expect(other.q!.weight).toBe("600");
  });

  test("every placeholder field keeps a real associated label", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    const ok = await page.evaluate(() =>
      ["brief-about", "brief-when", "brief-where"].every((id) => {
        const el = document.getElementById(id);
        const lab = document.querySelector(`label[for="${id}"]`);
        return !!el && !!lab && (lab.textContent || "").trim().length > 0;
      }),
    );
    expect(ok).toBe(true);
  });

  test("the form still accepts input and keeps focus styles", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    const ta = page.locator("#brief-about");
    await ta.fill("A production about light.");
    await expect(ta).toHaveValue("A production about light.");
    await expect(ta).toBeFocused();
    const border = await ta.evaluate((e) => getComputedStyle(e).borderBottomColor);
    expect(border).toBe("rgb(19, 18, 16)");
  });

  test("no placeholder clipping at the narrow widths", async ({ page }) => {
    for (const width of [320, 360, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/start-a-project");
      const m = await page.evaluate(() => {
        const els = [...document.querySelectorAll(".dbr__write")] as HTMLElement[];
        return {
          over: document.documentElement.scrollWidth - window.innerWidth,
          clipped: els.some((e) => e.scrollWidth > e.clientWidth + 1),
        };
      });
      expect(m.over, `@${width}`).toBeLessThanOrEqual(0);
      expect(m.clipped, `@${width}`).toBe(false);
    }
  });
});

/* ----------------------------------------------------- responsive sweep ---- */

test.describe("no overflow or clipping on the touched routes", () => {
  const ROUTES = ["/services", "/studio", "/studio-lab", "/start-a-project"];
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ROUTES) {
        for (const prefix of ["", "/ka"]) {
          await gotoRoute(page, `${prefix}${route}`);
          const m = await page.evaluate(() => {
            const titles = [
              ...document.querySelectorAll(
                ".dsv__name, .dst__make, .dst__lablines, .dlb__notename",
              ),
            ] as HTMLElement[];
            return {
              over: document.documentElement.scrollWidth - window.innerWidth,
              clipped: titles.filter((e) => e.scrollWidth > e.clientWidth + 1).length,
            };
          });
          expect(m.over, `${prefix}${route} @${width} overflow`).toBeLessThanOrEqual(0);
          expect(m.clipped, `${prefix}${route} @${width} clipped titles`).toBe(0);
        }
      }
    });
  }
});
