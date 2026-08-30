import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * The approved Studio Lab, as rendered.
 *
 * The unit guards pin the data and the CSS values; this file checks the things
 * only a browser can answer - that the composition actually recomposes at the
 * documented break, that thirteen sections of cropped ornament never push the
 * document sideways, that every course sheet resolves, and that the keyboard
 * can reach the whole thing.
 *
 * Widths are swept by resizing ONE loaded page rather than reloading at each
 * size: the layout is a pure function of the viewport, and a spec that
 * navigates dozens of times destabilises the suite.
 */

const COURSES = ["photography", "art", "portfolio", "film"] as const;

/* the two breaks are deliberately different - see the CSS comment */
const LAB_WIDTHS = [1440, 1024, 909, 800, 760, 759, 560, 430, 390, 375, 360, 320];

const overflow = (page: Page) =>
  page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    // anything past the edge that is NOT an intentionally cropped ornament
    stray: [...document.querySelectorAll(".dsl *, .dsc *, .dao-lab *")].filter((e) => {
      const r = e.getBoundingClientRect();
      if (r.width === 0) return false;
      if (r.right <= window.innerWidth + 1) return false;
      return (
        !e.closest(
          ".dsl__heroorn, .dsl__programorn, .dsl__folioorn, .dsl__widerorn, .dsl__registerorn, .dsc__programorn, .dsc__registerorn, .dao-lab__orn",
        ) && !e.classList.contains("dsl-stain")
      );
    }).length,
  }));

/* ------------------------------------------------------------ the page --- */

test.describe("the Studio Lab page is the approved composition", () => {
  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: renders all eleven sections on the olive ground`, async ({ page }) => {
      await gotoRoute(page, `${base}/studio-lab`);
      await expect(page.locator(".dsl")).toHaveCount(1);
      // the ground is the existing token, under the two-layer texture stack
      const m = await page.evaluate(() => {
        const cs = getComputedStyle(document.querySelector(".dsl")!);
        const w = getComputedStyle(document.querySelector(".dsl-weave")!);
        const g = getComputedStyle(document.querySelector(".dsl-grain")!);
        return {
          bg: cs.backgroundColor,
          weave: [w.position, w.opacity, w.mixBlendMode],
          grain: [g.position, g.opacity, g.mixBlendMode],
        };
      });
      expect(m.bg).toBe("rgb(157, 171, 92)");
      expect(m.weave).toEqual(["absolute", "0.14", "overlay"]);
      expect(m.grain).toEqual(["absolute", "0.3", "multiply"]);

      for (const id of [
        "top",
        "about",
        "disciplines",
        "program",
        "featured",
        "portfolio",
        "cinema",
        "lab-life",
        "lecturers",
        "register",
      ]) {
        await expect(page.locator(`#${id}`), id).toHaveCount(1);
      }
    });
  }

  test("lists the four courses, each linking to its own sheet", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const rows = page.locator(".dsl__prow");
    await expect(rows).toHaveCount(4);
    const hrefs = await rows.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual(COURSES.map((c) => `/studio-lab/${c}`));
  });

  test("draws every divider as a pencil rule, never a border", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const rules = page.locator(".dsl-rule");
    expect(await rules.count()).toBeGreaterThan(20);
    // each is an SVG path stretched to width, not a bordered box
    const m = await rules.first().evaluate((el) => ({
      tag: el.tagName.toLowerCase(),
      par: el.getAttribute("preserveAspectRatio"),
      border: getComputedStyle(el).borderTopWidth,
      path: el.querySelector("path")?.getAttribute("vector-effect"),
    }));
    expect(m.tag).toBe("svg");
    expect(m.par).toBe("none");
    expect(m.border).toBe("0px");
    expect(m.path).toBe("non-scaling-stroke");
  });

  test("keeps the botanicals static, behind the content and untouchable", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const bots = page.locator(".dsl-bot");
    expect(await bots.count()).toBeGreaterThan(0);
    const m = await bots.evaluateAll((els) =>
      els.map((e) => {
        const cs = getComputedStyle(e);
        return {
          pe: cs.pointerEvents,
          anim: cs.animationName,
          op: parseFloat(getComputedStyle(e.parentElement!).opacity),
        };
      }),
    );
    for (const b of m) {
      expect(b.pe).toBe("none");
      expect(b.anim).toBe("none");
      // low opacity: an ornament, never a subject
      expect(b.op).toBeLessThanOrEqual(0.16);
    }
  });

  test("states the unconfirmed values as pending rather than inventing them", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const text = await page.locator(".dsl").innerText();
    expect(text).toMatch(/PUBLISHED PER COURSE/i);
    // no price, no date, no duration anywhere on the page
    expect(text).not.toMatch(/[₾$€]\s?\d/);
    expect(text).not.toMatch(/\b\d+\s*(weeks?|months?|hours?)\b/i);
  });
});

/* --------------------------------------------------------- course sheets - */

test.describe("the course sheet system", () => {
  for (const course of COURSES) {
    test(`${course} resolves and carries its own content`, async ({ page }) => {
      await gotoRoute(page, `/studio-lab/${course}`);
      await expect(page.locator(".dsc")).toHaveCount(1);
      await expect(page.locator(".dsc__title")).not.toBeEmpty();
      // one template, four courses: the discipline mark and modules differ
      await expect(page.locator(".dsc__mod")).not.toHaveCount(0);
      await expect(page.locator(".dsl-icon").first()).toBeVisible();
      // the practical sheet always states four rows, TBD included
      await expect(page.locator(".dsc__sheetcell")).toHaveCount(4);
    });
  }

  test("History of Cinema is online only, on the sheet and in the masthead", async ({ page }) => {
    await gotoRoute(page, "/studio-lab/film");
    await expect(page.locator(".dsc__mast")).toContainText(/ONLINE ONLY/i);
    await expect(page.locator(".dsc__sheetgrid")).toContainText(/ONLINE ONLY/i);
  });

  test("dims exactly the values the studio has not confirmed", async ({ page }) => {
    await gotoRoute(page, "/studio-lab/photography");
    const rows = await page.locator(".dsc__sheetcell").evaluateAll((els) =>
      els.map((e) => ({
        k: (e.querySelector("dt")?.textContent ?? "").trim(),
        dim: (e.querySelector("dd") as HTMLElement).classList.contains("is-tbd"),
      })),
    );
    const by = Object.fromEntries(rows.map((r) => [r.k, r.dim]));
    // the format is confirmed for photography; the rest is not
    expect(by["FORMAT"]).toBe(false);
    expect(by["DURATION"]).toBe(true);
    expect(by["SCHEDULE"]).toBe(true);
    expect(by["PRICE"]).toBe(true);
  });

  test("an unknown course is a 404, not a blank sheet", async ({ page }) => {
    const res = await page.goto("/studio-lab/not-a-course");
    expect(res?.status()).toBe(404);
  });

  test("every sheet is reachable in Georgian too", async ({ page }) => {
    for (const course of COURSES) {
      await gotoRoute(page, `/ka/studio-lab/${course}`);
      await expect(page.locator(".dsc__title"), course).not.toBeEmpty();
      expect(new URL(page.url()).pathname).toBe(`/ka/studio-lab/${course}`);
    }
  });
});

/* ------------------------------------------------------------ responsive - */

test.describe("the Lab recomposes at the documented break", () => {
  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: never scrolls sideways, 1440 down to 320`, async ({ page }) => {
      await gotoRoute(page, `${base}/studio-lab`);
      for (const width of LAB_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(150);
        const m = await overflow(page);
        expect(m.scrollW, `${label} ${width}`).toBeLessThanOrEqual(m.clientW + 1);
        expect(m.stray, `${label} ${width}: content past the edge`).toBe(0);
      }
    });
  }

  test("the page switches composition at 760, and the act at 900", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const indexCols = async () =>
      page.evaluate(() => {
        const cs = getComputedStyle(document.querySelector(".dsl-index")!);
        return cs.display === "grid" ? cs.gridTemplateColumns.split(" ").length : 0;
      });
    await page.setViewportSize({ width: 760, height: 900 });
    await page.waitForTimeout(150);
    expect(await indexCols(), "760 is still the wide composition").toBe(0);
    await page.setViewportSize({ width: 759, height: 900 });
    await page.waitForTimeout(150);
    expect(await indexCols(), "759 is the mobile 3-column index").toBe(3);

    // the homepage act carries its own break, at 900
    await gotoRoute(page, "/");
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(150);
    const wide = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dao-lab .dsl-index")!).display,
    );
    await page.setViewportSize({ width: 899, height: 900 });
    await page.waitForTimeout(150);
    const narrow = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dao-lab .dsl-index")!).display,
    );
    expect(wide).toBe("flex");
    expect(narrow).toBe("grid");
  });

  test("the program listing becomes 3-line entries below the break", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const row = document.querySelector(".dsl__prow")!;
      return {
        display: getComputedStyle(row).display,
        cols: getComputedStyle(document.querySelector(".dsl__cols")!).display,
        meta: getComputedStyle(row.querySelector(".dsl__prmeta")!).display,
      };
    });
    expect(m.display).toBe("flex");
    expect(m.cols).toBe("none");
    expect(m.meta).toBe("flex");
  });
});

/* --------------------------------------------------------- accessibility - */

test.describe("the Lab stays reachable and legible", () => {
  test("gives every section a heading and every mark an empty alt", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await expect(page.locator(".dsl h1")).toHaveCount(1);
    expect(await page.locator(".dsl h2").count()).toBeGreaterThan(4);
    // decorative art is hidden from the tree, never given invented alt text
    const alts = await page
      .locator(".dsl img")
      .evaluateAll((els) => els.map((e) => e.getAttribute("alt")));
    for (const a of alts) expect(a).toBe("");
    const svgHidden = await page
      .locator(".dsl svg")
      .evaluateAll((els) => els.filter((e) => e.getAttribute("aria-hidden") !== "true").length);
    expect(svgHidden).toBe(0);
  });

  test("keyboard reaches a discipline row and shows focus", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const row = page.locator(".dsl__prow").first();
    await row.focus();
    await expect(row).toBeFocused();
    const outline = await row.evaluate((el) => {
      const cs = getComputedStyle(el);
      return `${cs.outlineStyle} ${cs.outlineWidth}`;
    });
    expect(outline).not.toBe("none 0px");
  });

  test("Enter on a course row opens that course", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await page.locator(".dsl__prow").first().focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/studio-lab\/photography/);
    await expect(page.locator(".dsc__title")).toContainText("Photography");
  });

  test("the pending media plates read as text, not as broken images", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const figs = page.locator(".dsl-fig");
    expect(await figs.count()).toBeGreaterThan(0);
    // no <img> inside a slot: nothing points at an asset that does not exist
    expect(await page.locator(".dsl-fig__slot img").count()).toBe(0);
    await expect(figs.first().locator(".dsl-fig__pending")).not.toBeEmpty();
  });
});
