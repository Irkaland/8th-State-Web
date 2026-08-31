import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * /services - THE DEPARTMENT DOSSIER.
 *
 * The five departments are the studio's published destinations, so the things
 * asserted here are the things a shared link, the homepage and the page's own
 * navigation all depend on: that the five canonical anchors exist, that every
 * route into them lands, and that the redesign did not quietly take the
 * fragment system with it.
 *
 * Placement is FragmentEntry's, not this page's. These tests therefore assert
 * where the reader ENDS UP, never how they got there.
 */

/** the five canonical anchors, in printed order */
const ANCHORS = [
  "audiovisual-production",
  "production-design",
  "photography",
  "creative-direction",
  "graphic-broadcast-design",
] as const;

/**
 * How close a chapter has to come to its own scroll-margin offset.
 *
 * The same reasoning as services-fragment.spec.ts: a chapter's entrance carries
 * a small transform that the rect includes, and correcting for it would mean
 * nudging the page under a reader already looking at it. 24px still fails
 * loudly for a fragment that does not land, which is hundreds of pixels out.
 */
const TOLERANCE = 24;

async function hardLoad(page: Page, url: string) {
  await page.goto(url);
  await page
    .locator(".dao-ident")
    .waitFor({ state: "hidden", timeout: 12000 })
    .catch(() => {});
}

/** how far the anchor sits from where its own scroll-margin says it should */
function offsetOf(page: Page, id: string) {
  return page.evaluate((anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return Number.NaN;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    return Math.round(el.getBoundingClientRect().top - margin);
  }, id);
}

async function settled(page: Page, id: string) {
  await expect
    .poll(async () => Math.abs(await offsetOf(page, id)), {
      timeout: 15000,
      message: `#${id} never reached its scroll-margin offset`,
    })
    .toBeLessThanOrEqual(TOLERANCE);
}

test.describe("A · the five canonical anchors", () => {
  test("every department is on the page, once, in order", async ({ page }) => {
    await gotoRoute(page, "/services");
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll(".dsvc__chapter")].map((s) => s.id),
    );
    expect(ids).toEqual([...ANCHORS]);

    // and no id is in the document twice - the chapters absorb capability
    // anchors, and three of those are spelled like the chapter itself
    const dupes = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const el of document.querySelectorAll("[id]"))
        seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
      return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    });
    expect(dupes, "duplicate ids").toEqual([]);
  });

  test("one h1, and a department h2 for each chapter", async ({ page }) => {
    await gotoRoute(page, "/services");
    await expect(page.locator("h1")).toHaveCount(1);
    for (const a of ANCHORS) {
      const section = page.locator(`#${a}`);
      const labelled = await section.getAttribute("aria-labelledby");
      expect(labelled, `${a} is not labelled`).toBeTruthy();
      await expect(page.locator(`h2#${labelled}`)).toHaveCount(1);
    }
  });
});

test.describe("B/P · the homepage preview reaches its destination", () => {
  test("every WHAT WE MAKE row lands on its own department", async ({ page }) => {
    await gotoRoute(page, "/");
    const hrefs = await page
      .locator(".dao-wwm__row")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    // all five now name a department - the fifth used to fall back to the
    // catalogue with no anchor at all
    expect(hrefs).toEqual(ANCHORS.map((a) => `/services#${a}`));

    for (const a of ANCHORS) {
      await gotoRoute(page, "/");
      const row = page.locator(`.dao-wwm__row[href="/services#${a}"]`);
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await page.waitForURL(new RegExp(`/services#${a}$`));
      await settled(page, a);
    }
  });
});

test.describe("C/D/E · the page's own navigation", () => {
  test("the department register links to all five", async ({ page }) => {
    await gotoRoute(page, "/services");
    const rows = page.locator(".dsvc__row");
    await expect(rows).toHaveCount(5);
    expect(await rows.evaluateAll((e) => e.map((x) => x.getAttribute("href")))).toEqual(
      ANCHORS.map((a) => `#${a}`),
    );
  });

  /**
   * The running department folio is GONE, and must stay gone.
   *
   * It was a sticky strip of `01 AUDIOVISUAL … 05 GRAPHICS` with an active
   * underline and an `01 / 05` counter, permanently occupying a band under the
   * chrome to repeat what the register at the top of the page already says.
   * It was also the page's only client component, so its removal is what makes
   * the dossier ship no client JavaScript at all.
   *
   * The band it reserved is checked too: removing a fixed strip and leaving
   * its space behind is the failure this guards against.
   */
  test("the horizontal department folio is gone, and left no empty band", async ({ page }) => {
    await gotoRoute(page, "/services");
    for (const sel of [
      ".dsvc__folio",
      ".dsvc__foliorail",
      ".dsvc__foliolink",
      ".dsvc__folion",
      ".dsvc__folioshort",
      ".dsvc__foliocount",
    ]) {
      expect(await page.locator(sel).count(), `${sel} came back`).toBe(0);
    }
    // The folio's `01 / 05` counter is gone with it. `x / 05` still appears on
    // the page, and legitimately: every chapter masthead prints DEPT. nn / 05,
    // which is approved design and was never part of the folio. So what is
    // asserted is that the ONLY place it survives is that masthead.
    const counters = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("*")]
        .filter(
          (el) =>
            !el.children.length &&
            /\b0[1-5]\s*\/\s*05\b/.test(el.textContent || "") &&
            !el.closest(".dsvc__chaptermast"),
        )
        .map((el) => `${el.className}: ${(el.textContent || "").trim()}`),
    );
    expect(counters, JSON.stringify(counters)).toEqual([]);

    // and the register now meets chapter 01 directly: the gap between them is
    // the opening's own closing padding, not a band left by a deleted strip
    const gap = await page.evaluate(() => {
      const reg = document.querySelector("#top-register")!.getBoundingClientRect();
      const first = document.querySelector("#audiovisual-production")!.getBoundingClientRect();
      return Math.round(first.top - reg.bottom);
    });
    expect(gap, "empty space where the folio used to be").toBeGreaterThan(0);
    expect(gap, "empty space where the folio used to be").toBeLessThanOrEqual(80);
  });

  test("every WORKS WITH link names a real chapter of this page", async ({ page }) => {
    await gotoRoute(page, "/services");
    const hrefs = await page
      .locator(".dsvc__workslink")
      .evaluateAll((e) => e.map((x) => x.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const h of hrefs) {
      expect(h.startsWith("#"), `${h} leaves the page`).toBe(true);
      expect(ANCHORS as readonly string[]).toContain(h.slice(1));
    }
  });

  test("a WORKS WITH link actually travels", async ({ page }) => {
    await gotoRoute(page, "/services");
    const link = page.locator("#audiovisual-production .dsvc__workslink").first();
    const href = (await link.getAttribute("href"))!;
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(new RegExp(`${href}$`));
    await settled(page, href.slice(1));
  });
});

test.describe("F/G · direct entry, EN and KA", () => {
  for (const a of ANCHORS) {
    test(`EN: /services#${a}`, async ({ page }) => {
      await hardLoad(page, `/services#${a}`);
      await settled(page, a);
      // 01 opens the page, so it is the one department that can legitimately
      // sit at the very top
      if (a !== ANCHORS[0]) {
        expect(await page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(200);
      }
    });

    test(`KA: /ka/services#${a}`, async ({ page }) => {
      await hardLoad(page, `/ka/services#${a}`);
      await settled(page, a);
      expect(await page.evaluate(() => document.documentElement.lang)).toBe("ka");
    });
  }

  test("the capability anchors the redesign absorbed still resolve", async ({ page }) => {
    // published links - a project's discipline, a bookmark - must not die
    for (const id of ["film-video-production", "post-production", "art-direction", "scenography"]) {
      await hardLoad(page, `/services#${id}`);
      await settled(page, id);
    }
  });
});

test.describe("H/I/J · fragment behaviour survives the redesign", () => {
  test("sequential same-document navigation lands each time", async ({ page }) => {
    // the exact journey the fragment fix exists for: no reload between these
    for (const a of ["photography", "creative-direction", "graphic-broadcast-design"] as const) {
      await hardLoad(page, `/services#${a}`);
      await settled(page, a);
    }
  });

  test("browser Back out of the dossier is left to the browser", async ({ page }) => {
    await hardLoad(page, "/services#photography");
    await settled(page, "photography");
    await page.locator(".dao-slimfoot a").first().click();
    await expect(page).toHaveURL(/\/work$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/services#photography$/);
    // nothing keeps pulling at the page afterwards
    await page.waitForTimeout(1200);
    const a = await page.evaluate(() => Math.round(window.scrollY));
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(a);
  });

  test("the reader can take the page back at any point", async ({ page }) => {
    await page.goto("/services#creative-direction");
    await page
      .locator(".dao-ident")
      .waitFor({ state: "hidden", timeout: 12000 })
      .catch(() => {});
    await page.mouse.wheel(0, 400);
    const rest = async () => {
      let last = -1;
      for (let i = 0; i < 40; i += 1) {
        await page.waitForTimeout(100);
        const y = await page.evaluate(() => Math.round(window.scrollY));
        if (y === last) return y;
        last = y;
      }
      return last;
    };
    const taken = await rest();
    await page.waitForTimeout(2000);
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
      "the page was still being pulled after the reader scrolled",
    ).toBe(taken);
  });
});

test.describe("K · the closing routes somewhere real", () => {
  test("START A PROJECT is the locale-aware route, in both languages", async ({ page }) => {
    await gotoRoute(page, "/services");
    await expect(page.locator(".dsvc__cta")).toHaveAttribute("href", "/start-a-project");
    await gotoRoute(page, "/ka/services");
    await expect(page.locator(".dsvc__cta")).toHaveAttribute("href", "/ka/start-a-project");

    // and it arrives
    await page.locator(".dsvc__cta").scrollIntoViewIfNeeded();
    await page.locator(".dsvc__cta").click();
    await expect(page).toHaveURL(/\/ka\/start-a-project$/);
  });

  test("VIEW RELATED WORK only appears where a real filter exists", async ({ page }) => {
    await gotoRoute(page, "/services");
    const hrefs = await page
      .locator(".dsvc__related")
      .evaluateAll((e) => e.map((x) => x.getAttribute("href") ?? ""));
    // Related Work filters on a CAPABILITY - the archive s own answer to
    // "which service does this project demonstrate". 05 has no capability in
    // the canonical taxonomy, and any capability with nothing credited to it
    // yet is not drawn at all: a link that promises related work and lands on
    // an empty archive is a dead end. So the set is whatever the archive can
    // actually show today, and it grows on its own as work is published.
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).toMatch(/^\/work\?capability=[a-z-]+$/);
    // and each one actually has work behind it
    for (const h of hrefs) {
      await gotoRoute(page, h);
      await expect(page.locator(".dwk__frame").first()).toBeVisible();
    }
  });
});

test.describe("L · nothing overflows sideways", () => {
  for (const width of [430, 390, 375, 320] as const) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await gotoRoute(page, "/services");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);

      // nothing inside the register or the production line runs off the frame -
      // these are the two compositions the redesign rebuilt, and both carry
      // long uppercase runs that a narrow screen is the first to break
      const escaped = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [
          ...document.querySelectorAll<HTMLElement>(
            ".dsvc__row, .dsvc__rowname, .dsvc__rowtag, .dsvc__route, .dsvc__routepath, .dsvc__node, .dsvc__stage",
          ),
        ]
          .map((e) => ({ c: e.className, r: Math.round(e.getBoundingClientRect().right) }))
          .filter((x) => x.r > vw + 1);
      });
      expect(escaped, JSON.stringify(escaped)).toEqual([]);
    });
  }

  test("every control on a phone is reachable by thumb", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await gotoRoute(page, "/services");
    const heights = await page
      .locator(".dsvc__row, .dsvc__cta, .dsvc__related, .dsvc__workslink")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThan(10);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });
});

test.describe("M/N/O · motion, keyboard and console", () => {
  test("reduced motion resolves straight to the readable page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await hardLoad(page, "/services#photography");
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute("data-dao-motion")),
    ).toBe(false);
    await settled(page, "photography");
    // nothing is left mid-entrance
    const hidden = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(".dsvc__chaptertitle, .dsvc__desc")) {
        if (Number(getComputedStyle(el).opacity) < 0.9) out.push(el.className);
      }
      return out;
    });
    expect(hidden, "copy left unreadable under reduced motion").toEqual([]);
  });

  test("the dossier can be walked with the keyboard alone", async ({ page }) => {
    await gotoRoute(page, "/services");
    const reached = await page.evaluate(() => {
      const row = document.querySelector<HTMLElement>(".dsvc__row")!;
      row.focus();
      const cs = getComputedStyle(row);
      return { focused: document.activeElement === row, outline: cs.outlineStyle };
    });
    expect(reached.focused).toBe(true);

    // and following it with the keyboard actually travels
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/services#audiovisual-production$/);

    // the production-line department nodes are reachable too - they are the
    // page's other route into a chapter now that the folio is gone
    const nodeFocusable = await page.evaluate(() => {
      const l = document.querySelector<HTMLElement>(".dsvc__node")!;
      l.focus();
      return document.activeElement === l;
    });
    expect(nodeFocusable).toBe(true);
  });

  test("the page is quiet in the console", async ({ page }) => {
    const errs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errs.push(msg.text());
    });
    page.on("pageerror", (e) => errs.push(String(e)));
    await hardLoad(page, "/services#graphic-broadcast-design");
    await settled(page, "graphic-broadcast-design");
    await gotoRoute(page, "/ka/services");
    expect(errs, errs.join("\n")).toEqual([]);
  });
});
