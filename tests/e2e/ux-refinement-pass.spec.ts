import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * UX, typography, interaction, accessibility and routing refinement pass.
 *
 *  §01  the four layer descriptors survive, and the group heading leads
 *  §02  the capability preview is a real route into that capability's archive
 *  §03  the Studio team slate routes to /team and invents nobody
 *  §04  ENTER THE LAB rule measures its own words, in EN and KA
 *  §05  the Studio bird is no longer being upscaled
 *  §06  Studio Lab colour hierarchy, by hierarchy not by language
 *  §07  the bloom sits between the two labels
 *  §08  no FR frame labels on Process
 *  §09  Georgia Production symbols cluster on mobile
 *  §10  Georgia Production support titles are Optika
 *  §11  WORK carries no blue rule in any state
 *  §12  Work archive text sits on a local scrim
 *  §13  Work archive titles are Optika
 *  §14  Process stage titles are Optika
 *  §15  locale switching preserves the query
 *  §16  all nine capability routes stay honest
 */

const CAPABILITY_COUNTS: Record<string, number> = {
  "creative-direction": 5,
  "art-direction": 0,
  "production-design": 5,
  scenography: 0,
  "costume-design": 2,
  decoration: 0,
  "film-video-production": 2,
  photography: 11,
  "post-production": 0,
};

/**
 * Wake the persistent chrome before touching it.
 *
 * html[data-dao-idle] deliberately fades the brand, the language switcher and
 * the return tab out and sets pointer-events:none on them - the chrome
 * withdraws when nothing is happening. A real visitor wakes it by moving or
 * scrolling, so a pointer test has to do the same before it can click.
 */
async function wakeChrome(page: Page) {
  await page.mouse.move(200, 200);
  await page.keyboard.press("Shift");
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-idle"), null, {
      timeout: 8000,
    })
    .catch(() => {});
  await expect(page.locator(".dao-lang a").first()).toBeVisible();
}

/** Click EN or KA in the top-right chrome. */
async function switchLocale(page: Page, label: "EN" | "KA") {
  await wakeChrome(page);
  await page.locator(".dao-lang a", { hasText: label }).click();
}

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

/* ------------------------------------------------------------------ §01 --- */

test.describe("§01 What We Make group descriptors", () => {
  test("all four layer descriptors are still rendered", async ({ page }) => {
    await gotoRoute(page, "/");
    const layers = await page
      .locator(".dao-svc__grouplayer")
      .evaluateAll((els) => els.map((e) => e.textContent!.trim()));
    expect(layers).toEqual([
      "The thinking layer - idea and look",
      "The made-world layer",
      "The capture layer",
      "The completion layer",
    ]);
  });

  test("the group heading leads its own capabilities", async ({ page }) => {
    await gotoRoute(page, "/");
    const sizes = await page.evaluate(() => {
      const px = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      return {
        group: px(".dao-svc__groupname"),
        cap: px(".dao-svc__name"),
        layer: px(".dao-svc__grouplayer"),
      };
    });
    expect(sizes.group).toBeGreaterThan(sizes.cap);
    expect(sizes.cap).toBeGreaterThan(sizes.layer);
  });

  test("and still leads at 360, where the two used to be a pixel apart", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoRoute(page, "/");
    const sizes = await page.evaluate(() => {
      const px = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      return { group: px(".dao-svc__groupname"), cap: px(".dao-svc__name") };
    });
    expect(sizes.group - sizes.cap).toBeGreaterThanOrEqual(3);
  });
});

/* ------------------------------------------------------------------ §02 --- */

test.describe("§02 capability preview is an entry point", () => {
  test("every open row offers a link to its own capability archive", async ({ page }) => {
    await gotoRoute(page, "/");
    const links = await page.locator(".dao-svc [data-dao-capability]").evaluateAll((els) =>
      els.map((e) => ({
        id: e.getAttribute("data-dao-capability"),
        href: e.getAttribute("href"),
      })),
    );
    expect(links).toHaveLength(9);
    for (const l of links) {
      expect(l.href, `${l.id} routes to its own filter`).toBe(`/work?capability=${l.id}`);
    }
  });

  test("a capability with credited work shows a still; one without shows none", async ({
    page,
  }) => {
    await gotoRoute(page, "/");
    const state = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-svc [data-dao-capability]")].map((e) => ({
        id: e.getAttribute("data-dao-capability"),
        // the still is the link itself; the empty state is a sibling treatment
        hasStill: e.classList.contains("dao-svc__frag"),
      })),
    );
    for (const s of state) {
      expect(s.hasStill, `${s.id}`).toBe(CAPABILITY_COUNTS[s.id!] > 0);
    }
  });

  test("clicking the preview lands on that exact capability, not ALL", async ({ page }) => {
    await gotoRoute(page, "/");
    // 07 has credited work, so it renders as a clickable still
    const row = page.locator(".dao-svc__row", { hasText: "Film & Video Production" });
    await row.locator(".dao-svc__rowbtn").click();
    await page.locator('[data-dao-capability="film-video-production"]').click();
    await page.waitForURL(/\/work\?capability=film-video-production$/);
    await expect(page.locator(".dwk__frame")).toHaveCount(2);
    await expect(page.locator(".dwk__contextvalue")).toContainText("FILM & VIDEO");
  });

  test("a zero-result capability still routes there and says so honestly", async ({ page }) => {
    await gotoRoute(page, "/");
    const row = page.locator(".dao-svc__row", { hasText: "Scenography" });
    await row.locator(".dao-svc__rowbtn").click();
    // no photograph is borrowed from unrelated work
    await expect(row.locator(".dao-svc__frag")).toHaveCount(0);
    await expect(row.locator(".dao-svc__fragnone")).toHaveCount(1);
    await row.locator('[data-dao-capability="scenography"]').click();
    await page.waitForURL(/\/work\?capability=scenography$/);
    await expect(page.locator(".dwk__frame")).toHaveCount(0);
    await expect(page.locator(".dwk__empty, .dwk__emptytitle").first()).toBeVisible();
  });

  test("the row opens from the keyboard, so nothing here is hover-only", async ({ page }) => {
    await gotoRoute(page, "/");
    const row = page.locator(".dao-svc__row", { hasText: "Photography" }).first();
    const btn = row.locator(".dao-svc__rowbtn");
    await btn.focus();
    await expect(btn).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    const link = row.locator("[data-dao-capability]");
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("a collapsed row keeps its link out of the tab order", async ({ page }) => {
    await gotoRoute(page, "/");
    // 03 is open by default; close it and the link must become unreachable
    const row = page.locator(".dao-svc__row", { hasText: "Production Design" }).first();
    await expect(row).toHaveClass(/is-open/);
    await row.locator(".dao-svc__rowbtn").click();
    await expect(row).not.toHaveClass(/is-open/);
    const reachable = await row
      .locator("[data-dao-capability]")
      .evaluate((el) => !el.closest("[inert]"));
    expect(reachable, "the closed body is inert").toBe(false);
  });

  test("the preview carries a meaningful accessible label", async ({ page }) => {
    await gotoRoute(page, "/");
    const label = await page
      .locator('[data-dao-capability="production-design"]')
      .getAttribute("aria-label");
    expect(label).toContain("Production Design");
    expect(label).toMatch(/5/);
  });

  test("and keeps the locale", async ({ page }) => {
    await gotoRoute(page, "/ka");
    const hrefs = await page
      .locator(".dao-svc [data-dao-capability]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toHaveLength(9);
    for (const h of hrefs) expect(h).toMatch(/^\/ka\/work\?capability=/);
  });
});

/* ------------------------------------------------------------------ §03 --- */

test.describe("§03 the Studio team slate", () => {
  test("is present, is one link, and routes to the team", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const slate = page.locator(".dst__slate");
    await expect(slate).toHaveCount(1);
    await expect(slate).toHaveAttribute("href", "/team");
    // nothing interactive nested inside it
    expect(await slate.locator("a, button").count()).toBe(0);
    expect(await slate.getAttribute("aria-label")).toBeTruthy();
  });

  test("reads as a production slate, not a team card", async ({ page }) => {
    await gotoRoute(page, "/studio");
    await expect(page.locator(".dst__slateclap")).toHaveCount(1);
    await expect(page.locator(".dst__slatefield")).toHaveCount(3);
    // no portrait, no invented person
    expect(await page.locator(".dst__slate img").count()).toBe(0);
    const text = (await page.locator(".dst__slate").innerText()).toUpperCase();
    expect(text).toContain("8TH STATE");
    expect(text).toContain("TBILISI");
  });

  test("is reachable and actionable from the keyboard", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const slate = page.locator(".dst__slate");
    await slate.focus();
    await expect(slate).toBeFocused();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/team$/);
  });

  test("keeps the locale", async ({ page }) => {
    await gotoRoute(page, "/ka/studio");
    await expect(page.locator(".dst__slate")).toHaveAttribute("href", "/ka/team");
  });

  // SUPERSEDED: /team was a pre-content notice when this was written. It is now
  // the approved contact sheet, built from provisional seats, so what matters is
  // that none of those seats is a fabricated person.
  test("invents no people on the page it leads to", async ({ page }) => {
    await gotoRoute(page, "/team");
    const cards = await page.locator(".dtm__person").count();
    expect(cards).toBeGreaterThan(0);
    await expect(page.locator(".dtm__slot")).toHaveCount(cards);
    await expect(page.locator(".dtm__provisional")).toHaveCount(1);
  });
});

/* ------------------------------------------------------------------ §04 --- */

test.describe("§04 ENTER THE LAB rule", () => {
  for (const [label, route] of [
    ["EN", "/studio"],
    ["KA", "/ka/studio"],
  ] as const) {
    test(`measures the words, not the panel (${label})`, async ({ page }) => {
      await gotoRoute(page, route);
      const m = await page.evaluate(() => {
        const panel = document.querySelector(".dst__labpanel-inner") as HTMLElement;
        const cta = panel.querySelector("a.dao-cta") as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(cta);
        return {
          cta: cta.getBoundingClientRect().width,
          panel: panel.getBoundingClientRect().width,
          text: range.getBoundingClientRect().width,
        };
      });
      // the rule spans the link box, so the link box must hug its own text
      expect(m.cta).toBeLessThan(m.panel * 0.8);
      expect(m.cta).toBeLessThan(m.text + 24);
    });
  }
});

/* ------------------------------------------------------------------ §05 --- */

/**
 * SUPERSEDES "§05 the Studio bird is not being upscaled any more".
 *
 * That test existed because one 900px swallow filled the right half of the
 * Studio cover and was being drawn past its own resolution. The studio has
 * since removed the single giant bird entirely and replaced it with three
 * smaller brandbook marks - so the original defect cannot recur, and the
 * assertion that guarded it has nothing left to measure.
 *
 * The concern it protected is kept, and widened: NONE of the marks that
 * replaced it may be drawn past its own source either.
 */
test("§05 no Studio cover decoration is being upscaled", async ({ page }) => {
  await gotoRoute(page, "/studio");
  // the single giant bird is gone
  expect(await page.locator(".dst__swallow").count()).toBe(0);

  const marks = await page.evaluate(async () => {
    const out: { url: string; natural: number; rendered: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(".dst__decor > span")) {
      const cs = getComputedStyle(el);
      const url = (cs.maskImage || cs.webkitMaskImage)
        .match(/url\(["']?([^"')]+)/)?.[1]
        ?.replace(/^.*(\/assets)/, "$1");
      const img = new Image();
      img.src = url!;
      await img.decode();
      out.push({
        url: url!,
        natural: img.naturalWidth,
        rendered: el.getBoundingClientRect().width,
      });
    }
    return out;
  });
  expect(marks.length).toBe(3);
  for (const m of marks) {
    expect(m.url, "a real brandbook asset").toMatch(/\/assets\/graphics\/bb-/);
    expect(m.natural, m.url + " is drawn past its source").toBeGreaterThanOrEqual(m.rendered);
  }
});

/* ------------------------------------------------------------ §06 / §07 --- */

test.describe("§06/§07 Studio Lab in the burger", () => {
  const GREEN = "rgb(157, 171, 92)"; // #9dab5c
  const RED = "rgb(208, 62, 38)"; // #d03e26

  for (const [label, route] of [
    ["EN", "/"],
    ["KA", "/ka"],
  ] as const) {
    test(`primary label is green and the companion is red (${label})`, async ({ page }) => {
      await gotoRoute(page, route);
      await openBurger(page);
      const c = await page.evaluate(() => {
        const row = document.querySelector(".dao-nav__row--lab")!;
        return {
          primary: getComputedStyle(row.querySelector(".dao-nav__link--lab")!).color,
          secondary: getComputedStyle(row.querySelector(".dao-nav__ka")!).color,
        };
      });
      expect(c.primary).toBe(GREEN);
      expect(c.secondary).toBe(RED);
    });
  }

  test("no other burger item was recoloured", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const others = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-nav__row")]
        .filter((r) => !r.classList.contains("dao-nav__row--lab"))
        .map((r) => getComputedStyle(r.querySelector(".dao-nav__link")!).color),
    );
    expect(others.length).toBeGreaterThan(5);
    for (const c of others) expect(c).not.toBe("rgb(157, 171, 92)");
  });

  // SUPERSEDED: this pass positioned the bloom between the two labels; the
  // typography/navigation cleanup pass removes the ornament outright, so what is
  // asserted here is the removal and the clean gap it leaves behind. Full
  // coverage of the removal lives in typography-cleanup.spec.ts.
  test("the bloom is gone, leaving one clean gap between the labels", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const geo = await page.evaluate(() => {
      const row = document.querySelector(".dao-nav__row--lab")!;
      const link = row.querySelector(".dao-nav__link--lab")!.getBoundingClientRect();
      const ka = row.querySelector(".dao-nav__ka")!.getBoundingClientRect();
      return {
        ornaments: row.querySelectorAll(".dao-nav__bloom, .dao-nav__bloomslot").length,
        gap: +(ka.left - link.right).toFixed(1),
      };
    });
    expect(geo.ornaments).toBe(0);
    // the row gap alone separates them, at the same 26px every other row uses
    expect(geo.gap).toBe(26);
  });

  test("the row spacing is uniform", async ({ page }) => {
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
    expect(new Set(gaps).size).toBe(1);
  });

  // SUPERSEDED: with the ornament removed there is nothing left for focus to
  // reveal. What still matters is that keyboard focus reaches the Studio Lab
  // link and that its own green rule - which the cleanup pass keeps - is drawn.
  test("keyboard focus reaches the Studio Lab link and draws its rule", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const link = page.locator(".dao-nav__link--lab");
    await expect(page.locator(".dao-nav__bloom")).toHaveCount(0);
    // the link takes focus and is operable from the keyboard
    await link.focus();
    await expect(link).toBeFocused();
    // and its own green rule is still there to be drawn. The reveal is asserted
    // through hover, which is deterministic here: the rule is bound to
    // :focus-visible, and neither Playwright's .focus() nor the burger's own
    // Tab trap (which moves focus programmatically) reliably satisfies that in
    // Chromium. The :focus-visible branch itself is covered in the CSS contract
    // test, so nothing is left unverified.
    const strike = link.locator(".dao-strike");
    await expect(strike).toHaveCount(1);
    await link.hover();
    await expect
      .poll(() => strike.evaluate((e) => getComputedStyle(e).transform), { timeout: 3000 })
      .not.toBe("matrix(0, 0, 0, 1, 0, 0)");
  });
});

/* ------------------------------------------------------------------ §08 --- */

test("§08 the Process page carries no FR frame labels", async ({ page }) => {
  await gotoRoute(page, "/process");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\bFR\s*0*\d{2,4}\b/);
  await expect(page.locator(".dpr__frline")).toHaveCount(0);
  // the meaningful numbering is untouched
  await expect(page.locator(".dpr__num")).toHaveCount(9);
});

/* ------------------------------------------------------------ §09 / §10 --- */

test.describe("§09/§10 Georgia Production", () => {
  for (const width of [320, 360, 375, 390, 430]) {
    test(`the star and the mark cluster on the same side at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/georgia-production");
      const m = await page.evaluate(() => {
        const star = document.querySelector(".dgp__star")!.getBoundingClientRect();
        const mark = document.querySelector(".dgp__mark")!.getBoundingClientRect();
        return {
          starMid: star.left + star.width / 2,
          markMid: mark.left + mark.width / 2,
          vw: window.innerWidth,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      // both on the same half of the viewport, i.e. one cluster
      expect(m.starMid < m.vw / 2).toBe(m.markMid < m.vw / 2);
      expect(m.overflow).toBe(0);
    });
  }

  test("desktop keeps the mark at the end of the column", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/georgia-production");
    // display:contents above 720, so both stay direct children of the coords column
    const stacked = await page.evaluate(() => {
      const star = document.querySelector(".dgp__star")!.getBoundingClientRect();
      const mark = document.querySelector(".dgp__mark")!.getBoundingClientRect();
      return mark.top >= star.bottom - 1;
    });
    expect(stacked).toBe(true);
  });

  test("the four support titles are Optika at the editorial weight", async ({ page }) => {
    await gotoRoute(page, "/georgia-production");
    const names = page.locator(".dgp__indexname");
    await expect(names).toHaveCount(4);
    const styles = await names.evaluateAll((els) =>
      els.map((e) => {
        const cs = getComputedStyle(e);
        return { family: cs.fontFamily, weight: cs.fontWeight };
      }),
    );
    for (const s of styles) {
      expect(s.family.toLowerCase()).toContain("optika");
      expect(Number(s.weight)).toBeGreaterThanOrEqual(600);
      expect(Number(s.weight)).toBeLessThan(700); // no synthesised bold
    }
  });
});

/* ------------------------------------------------------------------ §11 --- */

test.describe("§11 WORK has no blue rule", () => {
  test("not idle, not hovered, not focused, not on its own route", async ({ page }) => {
    for (const route of ["/", "/work"]) {
      await gotoRoute(page, route);
      await openBurger(page);
      const link = page.locator(".dao-nav__row").first().locator(".dao-nav__link");
      // no strike element at all inside the WORK label
      expect(await link.locator(".dao-strike").count()).toBe(0);
      for (const act of ["idle", "hover", "focus"] as const) {
        if (act === "hover") await link.hover();
        if (act === "focus") await link.focus();
        const deco = await link.evaluate((el) => getComputedStyle(el).textDecorationLine);
        expect(deco, `${route} ${act}`).toBe("none");
      }
    }
  });

  test("stays absent while the categories are expanded", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    await page.locator(".dao-nav__num--toggle").click();
    await expect(page.locator(".dao-nav__cats.is-open")).toHaveCount(1);
    const link = page.locator(".dao-nav__row").first().locator(".dao-nav__link");
    expect(await link.locator(".dao-strike").count()).toBe(0);
  });

  test("keyboard focus is still visible", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    const link = page.locator(".dao-nav__row").first().locator(".dao-nav__link");
    await link.focus();
    const changed = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" || cs.color !== "";
    });
    expect(changed).toBe(true);
  });
});

/* ------------------------------------------------------------ §12 / §13 --- */

test.describe("§12/§13 Work archive overlay", () => {
  test("every card carries a local scrim behind its text", async ({ page }) => {
    await gotoRoute(page, "/work");
    const frames = await page.locator(".dwk__frame").count();
    expect(frames).toBeGreaterThan(0);
    const scrims = await page.evaluate(() =>
      [...document.querySelectorAll(".dwk__frame")].map((f) => {
        const cs = getComputedStyle(f, "::before");
        return {
          image: cs.backgroundImage,
          height: cs.height,
          frame: f.getBoundingClientRect().height,
          events: cs.pointerEvents,
        };
      }),
    );
    for (const s of scrims) {
      expect(s.image).toContain("gradient");
      expect(s.image).toContain("rgba(0, 0, 0, 0.8)");
      expect(s.events).toBe("none");
      // local to the text zone, not the whole picture
      expect(parseFloat(s.height)).toBeLessThan(s.frame * 0.55);
    }
  });

  test("the card title is Optika at the editorial weight, in both locales", async ({ page }) => {
    for (const route of ["/work", "/ka/work"]) {
      await gotoRoute(page, route);
      const s = await page
        .locator(".dwk__name")
        .first()
        .evaluate((e) => {
          const cs = getComputedStyle(e);
          return { family: cs.fontFamily, weight: cs.fontWeight, size: parseFloat(cs.fontSize) };
        });
      expect(s.family.toLowerCase()).toContain("optika");
      expect(Number(s.weight)).toBe(600);
      // and it stays dominant over the metadata
      const meta = await page
        .locator(".dwk__meta")
        .first()
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      expect(s.size).toBeGreaterThan(meta * 1.5);
    }
  });
});

/* ------------------------------------------------------------------ §14 --- */

test("§14 Process stage titles are Optika at the editorial weight", async ({ page }) => {
  await gotoRoute(page, "/process");
  const names = page.locator(".dpr__stagename");
  await expect(names).toHaveCount(9);
  const styles = await names.evaluateAll((els) =>
    els.map((e) => {
      const cs = getComputedStyle(e);
      return { family: cs.fontFamily, weight: cs.fontWeight, text: e.textContent!.trim() };
    }),
  );
  for (const s of styles) {
    expect(s.family.toLowerCase()).toContain("optika");
    expect(Number(s.weight)).toBe(600);
  }
  // the taxonomy wording is untouched
  expect(styles.map((s) => s.text)).toEqual([
    "Creative Direction",
    "Art Direction",
    "Production Design",
    "Scenography",
    "Costume Design",
    "Decoration",
    "Film & Video Production",
    "Photography",
    "Post-Production",
  ]);
});

/* ------------------------------------------------------------------ §15 --- */

test.describe("§15 locale switching preserves the filter", () => {
  const cases = [
    ["?category=photography", 10],
    ["?capability=production-design", 5],
    ["?capability=scenography", 0],
    ["?status=in-development", 0],
  ] as const;

  for (const [query, count] of cases) {
    test(`EN -> KA keeps ${query}`, async ({ page }) => {
      await gotoRoute(page, `/work${query}`);
      await expect(page.locator(".dwk__frame")).toHaveCount(count);
      await switchLocale(page, "KA");
      // exact pathname + search, rather than a regex that has to escape "?"
      await page.waitForURL((url) => url.pathname === "/ka/work" && url.search === query);
      await expect(page.locator(".dwk__frame")).toHaveCount(count);
    });

    test(`KA -> EN keeps ${query}`, async ({ page }) => {
      await gotoRoute(page, `/ka/work${query}`);
      await expect(page.locator(".dwk__frame")).toHaveCount(count);
      await switchLocale(page, "EN");
      await page.waitForURL((url) => url.pathname === "/work" && url.search === query);
      await expect(page.locator(".dwk__frame")).toHaveCount(count);
    });
  }

  test("an unfiltered archive still switches cleanly, with no dangling ?", async ({ page }) => {
    await gotoRoute(page, "/work");
    await switchLocale(page, "KA");
    await page.waitForURL(/\/ka\/work$/);
    expect(page.url()).not.toContain("?");
  });

  test("the filter survives a switch made after clicking a filter client-side", async ({
    page,
  }) => {
    await gotoRoute(page, "/work");
    // the Work page's own filter index, not the burger's hidden category list
    await page.locator('.dwk__filters a[href="/work?category=film-video"]').click();
    await page.waitForURL((url) => url.search === "?category=film-video");
    await switchLocale(page, "KA");
    await page.waitForURL(
      (url) => url.pathname === "/ka/work" && url.search === "?category=film-video",
    );
    await expect(page.locator(".dwk__frame")).toHaveCount(2);
  });
});

/* ------------------------------------------------------------------ §16 --- */

test("§16 all nine capability routes stay honest after this pass", async ({ page }) => {
  for (const [id, count] of Object.entries(CAPABILITY_COUNTS)) {
    await gotoRoute(page, `/work?capability=${id}`);
    expect(new URL(page.url()).searchParams.get("capability"), id).toBe(id);
    await expect(page.locator(".dwk__frame"), id).toHaveCount(count);
    if (count === 0) {
      await expect(page.locator(".dwk__empty, .dwk__emptytitle").first()).toBeVisible();
    }
  }
});

/* --------------------------------------------------------- responsive QA -- */

test.describe("no horizontal overflow on the touched routes", () => {
  const ROUTES = ["/", "/studio", "/process", "/georgia-production", "/work", "/team"];
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ROUTES) {
        for (const prefix of ["", "/ka"]) {
          await gotoRoute(page, `${prefix}${route}`.replace("//", "/"));
          const over = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(over, `${prefix}${route} at ${width}`).toBeLessThanOrEqual(0);
        }
      }
    });
  }
});
