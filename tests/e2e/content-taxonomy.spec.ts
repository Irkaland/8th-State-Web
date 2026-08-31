import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * Content architecture, navigation and Work taxonomy pass.
 *
 *  §01  Selected Work project titles are strong Optika, not the display face
 *  §02  the What We Make explanatory paragraph is gone, and its gap with it
 *  §03  group labels head their own capabilities; no separate taxonomy column
 *  §04  group label leads, capability steps down
 *  §05  all nine capabilities appear on /services
 *  §07  GEORGIA PRODUCTION matches the primary scale on desktop
 *  §08  WORK carries no persistent underline
 *  §09  the gap below WORK matches the rest of the list
 *  §10  Projects in Development is the fifth Work filter
 *  §12  filter state survives a hard load and preserves locale
 *  §13  Related Work is capability-specific
 *  §14  ?capability= filters the archive
 *  §17  an active capability filter is legible and ALL is not marked
 *  §19  the Studio page routes to the team
 *  §18  /team loads in EN and KA
 */

const NINE = [
  "Creative Direction",
  "Art Direction",
  "Production Design",
  "Scenography",
  "Costume Design",
  "Decoration",
  "Film & Video Production",
  "Photography",
  "Post-Production",
];

const CAPABILITY_IDS = [
  "creative-direction",
  "art-direction",
  "production-design",
  "scenography",
  "costume-design",
  "decoration",
  "film-video-production",
  "photography",
  "post-production",
];

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

test.describe("§01 Selected Work project titles", () => {
  test("use strong Optika, not the display face", async ({ page }) => {
    await gotoRoute(page, "/");
    const got = await page.evaluate(() => {
      const el = document.querySelector(".dao-work__name")!;
      const cs = getComputedStyle(el);
      return { family: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize };
    });
    expect(first(got.family)).toContain("optika");
    expect(first(got.family)).not.toContain("adevas");
    // Optika ships 400/500/600 only - 600 is the heaviest real weight
    expect(Number(got.weight)).toBeGreaterThanOrEqual(600);
  });

  test("are the same face in both locales, since the title is one Latin string", async ({
    page,
  }) => {
    const read = async (route: string) => {
      await gotoRoute(page, route);
      return page.evaluate(
        () => getComputedStyle(document.querySelector(".dao-work__name")!).fontFamily,
      );
    };
    expect(first(await read("/ka"))).toBe(first(await read("/")));
  });
});

test.describe("§02-§04 the homepage act, and where the taxonomy went", () => {
  /**
   * SUPERSEDED SURFACE, SAME CONTRACTS.
   *
   * These checks were written against the homepage capability act: no
   * explanatory paragraph, no left taxonomy rail, group labels leading their
   * own capabilities, all nine listed. The approved What We Make dossier
   * replaced that act with the five top-level services, so the questions split
   * in two and both halves are still asked.
   *
   * On the HOMEPAGE: the act still carries no explanatory paragraph and leaves
   * no empty layout container behind it.
   *
   * On /services, which is where the nine-capability taxonomy now lives in
   * full: all nine are listed, each group leads its own run, and the hierarchy
   * between a group label and a capability name still reads.
   */
  test("the homepage act carries no explanatory paragraph and no empty slot", async ({ page }) => {
    await gotoRoute(page, "/");
    const section = page.locator(".dao-wwm");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/is-in/);
    const text = await section.innerText();
    expect(text).not.toContain("Nine capabilities, four kinds of work");
    expect(text).not.toContain("scope is determined per project");

    // and no empty LAYOUT container was left holding the space. Decorative
    // elements are excluded by design: the grain, the weave and the production
    // traces are all intentionally textless and paint through a mask, a
    // background image or an SVG rather than through content.
    const empties = await page.evaluate(() => {
      const svc = document.querySelector(".dao-wwm")!;
      const out: string[] = [];
      for (const el of svc.querySelectorAll("p, span, div")) {
        if (el.children.length > 0 || el.textContent?.trim()) continue;
        if (el.closest("[aria-hidden='true']")) continue;
        const cs = getComputedStyle(el);
        const decorative =
          cs.backgroundImage !== "none" ||
          (cs.maskImage && cs.maskImage !== "none") ||
          (cs.webkitMaskImage && cs.webkitMaskImage !== "none");
        if (decorative) continue;
        const b = el.getBoundingClientRect();
        if (b.height > 12 && b.width > 40) {
          out.push((typeof el.className === "string" ? el.className : "") || el.tagName);
        }
      }
      return out;
    });
    expect(empties).toEqual([]);
  });

  test("the homepage lists the five top-level services, not the taxonomy", async ({ page }) => {
    await gotoRoute(page, "/");
    const names = await page.locator(".dao-wwm__name").allInnerTexts();
    expect(names).toHaveLength(5);
    // the dossier is the studio's departments; the capabilities are the
    // catalogue's business and are checked on /services below
    expect(names).toContain("AUDIOVISUAL PRODUCTION");
    expect(names).toContain("GRAPHIC & BROADCAST DESIGN");
  });

  test("each department leads its own capability register on /services", async ({ page }) => {
    // /services is the department dossier now: five chapters, each opening with
    // its own title and then its register. The rule this protects is the one it
    // always protected - a register never precedes the heading that names it.
    await gotoRoute(page, "/services");
    const order = await page.evaluate(() =>
      [...document.querySelectorAll(".dsvc__chaptertitle, .dsvc__registerhead")].map((el) =>
        el.classList.contains("dsvc__chaptertitle") ? "title" : "register",
      ),
    );
    expect(order.filter((o) => o === "title")).toHaveLength(5);
    expect(order.filter((o) => o === "register")).toHaveLength(5);
    // strictly alternating, title first
    expect(order).toEqual(
      Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? "title" : "register")),
    );
  });

  test("every capability still resolves to the department that covers it", async ({ page }) => {
    // The catalogue listed the nine capabilities by name. The dossier is
    // organised by department, and each chapter absorbs the capabilities it
    // covers - so the guarantee is no longer "all nine are printed" but the
    // stronger one: all nine are still REACHABLE on /services, and every link
    // the site has already published keeps landing.
    await gotoRoute(page, "/services");
    const resolved = await page.evaluate(
      (ids) => ids.filter((id) => !!document.getElementById(id)),
      CAPABILITY_IDS as unknown as string[],
    );
    expect(resolved.sort()).toEqual([...CAPABILITY_IDS].sort());
  });
});

test.describe("§05 / §13 / §24 Services", () => {
  test("ALL SERVICES leads to the full catalogue of nine capabilities", async ({ page }) => {
    await gotoRoute(page, "/");
    const href = await page.locator(".dao-wwm__all").first().getAttribute("href");
    expect(href).toMatch(/\/services$/);
    await gotoRoute(page, "/services");
    // the destination is the complete department file: five chapters, in order
    const chapters = await page
      .locator(".dsvc__chaptertitle")
      .evaluateAll((els) => els.map((e) => (e.textContent || "").trim().split("\n")[0]!.trim()));
    expect(chapters).toEqual([
      "AUDIOVISUAL PRODUCTION",
      "PRODUCTION DESIGN",
      "PHOTOGRAPHY",
      "CREATIVE & ART DIRECTION",
      "GRAPHIC & BROADCAST DESIGN",
    ]);
  });

  test("every Related Work link on the dossier names a real capability", async ({ page }) => {
    // Related Work is per DEPARTMENT now, and only drawn where the archive
    // actually has that work - so the count is whatever the archive can show,
    // and what is asserted is that each link is built from a canonical
    // capability id rather than hand-written. Every capability's own route is
    // walked individually by "every capability route lands on its own archive".
    await gotoRoute(page, "/services");
    const hrefs = await page
      .locator(".dsvc__related")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      const id = new URL(h, "http://x").searchParams.get("capability");
      expect(CAPABILITY_IDS, `${h} is not a canonical capability`).toContain(id!);
    }
  });

  test("no Related Work link routes to the unfiltered archive", async ({ page }) => {
    await gotoRoute(page, "/services");
    const hrefs = await page
      .locator(".dsvc__related")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      expect(h).not.toMatch(/\/work$/);
      expect(h).toContain("capability=");
    }
  });

  test("Related Work is only offered where the archive can honour it", async ({ page }) => {
    // The catalogue printed a "worked example" mark beside each capability, and
    // hardcoding it made three false claims at once. The dossier makes the same
    // claim through the link itself, asked of the archive rather than written
    // down - so a department whose capability has nothing credited to it offers
    // no link at all, and none of the links can lead to an empty archive.
    await gotoRoute(page, "/services");
    const hrefs = await page
      .locator(".dsvc__related")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    for (const h of hrefs) {
      await gotoRoute(page, h);
      const shown = await page.locator(".dwk__frame").count();
      expect(shown, `${h} promises related work and shows none`).toBeGreaterThan(0);
    }
  });

  test("every capability route lands on its own archive, empty or not", async ({ page }) => {
    // walks all nine individually: a zero-result capability must stay at zero and
    // must not widen, substitute a neighbour, or redirect to ALL
    const expected: Record<string, number> = {
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
    for (const [id, count] of Object.entries(expected)) {
      await gotoRoute(page, `/work?capability=${id}`);
      expect(new URL(page.url()).searchParams.get("capability"), id).toBe(id);
      const shown = await page.locator(".dwk__frame").count();
      const empty = await page.locator(".dwk__empty, .dwk__emptytitle").count();
      if (count === 0) {
        expect(shown, `${id} must show no projects`).toBe(0);
        expect(empty, `${id} must show the empty state`).toBeGreaterThan(0);
      } else {
        expect(shown, `${id} project count`).toBe(count);
        expect(empty, `${id} must not show the empty state`).toBe(0);
      }
    }
  });

  test("Related Work preserves the locale", async ({ page }) => {
    await gotoRoute(page, "/ka/services");
    const hrefs = await page
      .locator(".dsvc__related")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).toMatch(/^\/ka\/work\?capability=/);
  });
});

test.describe("§07-§09 burger menu", () => {
  test("GEORGIA PRODUCTION matches the primary scale on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-nav__link")].map((el) => ({
        t: (el.textContent || "").trim().slice(0, 22),
        fs: Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10,
      })),
    );
    expect(sizes).toHaveLength(8);
    const unique = new Set(sizes.map((s) => s.fs));
    expect(unique.size, `desktop sizes differ: ${JSON.stringify(sizes)}`).toBe(1);
  });

  test("WORK has no persistent underline when idle", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    await page.mouse.move(1300, 840);
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const link = document.querySelector(".dao-nav__link")!;
      return {
        text: (link.textContent || "").trim().slice(0, 8),
        strikes: link.querySelectorAll(".dao-strike").length,
        decoration: getComputedStyle(link).textDecorationLine,
        catsHeight: Math.round(
          document.querySelector(".dao-nav__cats")!.getBoundingClientRect().height,
        ),
      };
    });
    expect(state.text).toMatch(/WORK|ნამუშევრები/);
    // §11 of the UX pass removed the rule outright: it used to be drawn while
    // the categories were expanded, which read as a stray underline on the
    // label. There is now no strike element on WORK at all, in any state.
    expect(state.strikes).toBe(0);
    expect(state.decoration).toBe("none");
    // and the collapsed categories block still leaves no band under WORK
    expect(state.catsHeight).toBe(0);
  });

  test("the gap below WORK matches the rest of the list", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    const gaps = await page.evaluate(() => {
      const masks = [...document.querySelectorAll(".dao-nav__mask")];
      const out: number[] = [];
      for (let i = 1; i < masks.length; i += 1) {
        out.push(
          Math.round(
            masks[i]!.getBoundingClientRect().top - masks[i - 1]!.getBoundingClientRect().bottom,
          ),
        );
      }
      return out;
    });
    expect(gaps.length).toBe(7);
    // every gap identical - the first one used to be 28px against 2px
    expect(new Set(gaps).size, `gaps: ${gaps.join(",")}`).toBe(1);
  });

  test("still opens the WORK categories, and announces that state", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await openBurger(page);
    await page.locator(".dao-nav__num--toggle").click();
    await expect(page.locator(".dao-nav__cats.is-open")).toHaveCount(1);
    // the block animates open over 350ms - poll rather than sample at t=0
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.round(document.querySelector(".dao-nav__cats")!.getBoundingClientRect().height),
          ),
        { timeout: 4000 },
      )
      .toBeGreaterThan(20);
    // §11 of the UX pass: the expanded state is no longer signalled by painting
    // a rule on the WORK label. It is carried by aria-expanded on the toggle and,
    // visually, by the category list itself being open - so that is what is
    // asserted here instead. The label must stay clean.
    await expect(page.locator(".dao-nav__num--toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".dao-nav__cats .dao-nav__cat").first()).toBeVisible();
    // scoped to WORK only: Studio Lab keeps its own green rule, which §06/§07
    // preserve. Note :first-of-type is useless here - every row is the only
    // .dao-nav__row inside its own mask, so it matches all eight.
    expect(
      await page.evaluate(
        () =>
          document.querySelector(".dao-nav__row")!.querySelectorAll(".dao-nav__link .dao-strike")
            .length,
      ),
    ).toBe(0);
  });

  for (const width of [430, 390, 375, 360, 320]) {
    for (const [label, route] of [
      ["EN", "/"],
      ["KA", "/ka"],
    ] as const) {
      test(`${label} labels stay one line at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 780 });
        await gotoRoute(page, route);
        await openBurger(page);
        const rows = await page.evaluate(() =>
          [...document.querySelectorAll(".dao-nav__link")].map((el) => {
            const cs = getComputedStyle(el);
            const b = el.getBoundingClientRect();
            return {
              t: (el.textContent || "").trim().slice(0, 24),
              h: b.height,
              lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1,
              right: b.right,
              vw: document.documentElement.clientWidth,
            };
          }),
        );
        expect(rows).toHaveLength(8);
        for (const r of rows) {
          expect(r.h, `${r.t} wrapped`).toBeLessThan(r.lh * 1.6);
          expect(r.right, `${r.t} past the edge`).toBeLessThanOrEqual(r.vw + 1);
        }
      });
    }
  }
});

test.describe("§10-§17 Work filters", () => {
  test("Projects in Development is the fifth filter and uses a status url", async ({ page }) => {
    await gotoRoute(page, "/work");
    const filters = await page.evaluate(() =>
      [...document.querySelectorAll(".dwk__filters a")].map((el) => ({
        text: (el.textContent || "").trim(),
        href: el.getAttribute("href"),
      })),
    );
    expect(filters).toHaveLength(6); // ALL + four categories + status
    expect(filters[5]!.text).toContain("Projects in Development");
    expect(filters[5]!.href).toMatch(/\/work\?status=in-development$/);
    // it is a status, not a fifth category
    expect(filters[5]!.href).not.toContain("category=");
  });

  test("the status filter works and shows an honest empty state", async ({ page }) => {
    await gotoRoute(page, "/work?status=in-development");
    await expect(page.locator(".dwk__count")).toContainText("0");
    // an empty result, not a silent fall back to the whole archive
    await expect(page.locator(".dwk__frame")).toHaveCount(0);
    await expect(page.locator(".dwk__empty, .dwk__emptytitle").first()).toBeVisible();
  });

  test("ALL is not marked active while a capability filter is on", async ({ page }) => {
    await gotoRoute(page, "/work?capability=photography");
    const state = await page.evaluate(() => {
      const links = [...document.querySelectorAll(".dwk__filters a")];
      return {
        all: links[0]!.getAttribute("aria-current"),
        anyCurrent: links.filter((l) => l.getAttribute("aria-current") === "true").length,
        chip: document.querySelector(".dwk__context")?.textContent?.trim() ?? null,
      };
    });
    expect(state.all).toBeNull();
    expect(state.anyCurrent).toBe(0);
    // instead the active capability is named explicitly
    expect(state.chip).toContain("PHOTOGRAPHY");
  });

  test("the capability chip offers the way back to the full archive", async ({ page }) => {
    await gotoRoute(page, "/work?capability=photography");
    const href = await page.locator(".dwk__contextclear").getAttribute("href");
    expect(href).toMatch(/\/work$/);
    await page.locator(".dwk__contextclear").click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator(".dwk__context")).toHaveCount(0);
    const all = await page.locator(".dwk__filters a").first().getAttribute("aria-current");
    expect(all).toBe("true");
  });

  test("a capability filter narrows the archive", async ({ page }) => {
    await gotoRoute(page, "/work");
    const total = await page.locator(".dwk__frame").count();
    await gotoRoute(page, "/work?capability=film-video-production");
    const some = await page.locator(".dwk__frame").count();
    expect(some).toBeGreaterThan(0);
    expect(some).toBeLessThan(total);
  });

  test("the four broad category filters still work", async ({ page }) => {
    for (const id of ["film-video", "photography", "production-spatial", "studio-lab"]) {
      await gotoRoute(page, `/work?category=${id}`);
      const active = await page.evaluate(() => {
        const el = [...document.querySelectorAll(".dwk__filters a")].find(
          (l) => l.getAttribute("aria-current") === "true",
        );
        return el ? (el.textContent || "").trim() : null;
      });
      expect(active, `category=${id} did not self-mark`).not.toBeNull();
      expect(active).not.toBe("All");
    }
  });

  test("filter state survives a hard reload", async ({ page }) => {
    await gotoRoute(page, "/work?capability=production-design");
    const before = await page.locator(".dwk__frame").count();
    await page.reload();
    await expect(page).toHaveURL(/capability=production-design/);
    await expect(page.locator(".dwk__context")).toContainText(/PRODUCTION DESIGN/i);
    expect(await page.locator(".dwk__frame").count()).toBe(before);
  });

  test("back and forward preserve the filter", async ({ page }) => {
    await gotoRoute(page, "/work");
    await gotoRoute(page, "/work?capability=photography");
    await page.goBack();
    await expect(page).toHaveURL(/\/work$/);
    await page.goForward();
    await expect(page).toHaveURL(/capability=photography/);
    await expect(page.locator(".dwk__context")).toBeVisible();
  });

  test("a capability filter keeps the locale", async ({ page }) => {
    await gotoRoute(page, "/ka/work?capability=photography");
    await expect(page).toHaveURL(/\/ka\/work\?capability=photography/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ka");
    await expect(page.locator(".dwk__context")).toBeVisible();
  });

  test("an unknown capability falls back to the whole archive, not an error", async ({ page }) => {
    await gotoRoute(page, "/work?capability=not-a-real-capability");
    await expect(page.locator(".dwk__context")).toHaveCount(0);
    const all = await page.locator(".dwk__filters a").first().getAttribute("aria-current");
    expect(all).toBe("true");
  });
});

test.describe("§18-§23 Team", () => {
  test("the Studio page routes to the team", async ({ page }) => {
    await gotoRoute(page, "/studio");
    const cta = page.locator("[data-dao-team-cta]");
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/team");
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/team$/);
  });

  test("the Studio CTA keeps the locale", async ({ page }) => {
    await gotoRoute(page, "/ka/studio");
    await expect(page.locator("[data-dao-team-cta]")).toHaveAttribute("href", "/ka/team");
  });

  // SUPERSEDED TWICE. /team was first a pre-content notice, then a roster of
  // provisional SEATS, and the claim each time was that nobody on it was
  // fabricated. The studio has now confirmed thirteen real people, so the
  // claim becomes the stronger "these are exactly those thirteen, and nothing
  // about them is invented" - no portrait, and no leftover marked blank.
  test("loads in EN and KA showing only the confirmed team", async ({ page }) => {
    for (const route of ["/team", "/ka/team"]) {
      await gotoRoute(page, route);
      await expect(page.locator(".dtm__cover")).toBeVisible();
      await expect(page.locator(".dtm__person")).toHaveCount(13);
      // every seat is a named person now, so no marked blank is left
      await expect(page.locator(".dtm__slot")).toHaveCount(0);
      // and the roster no longer declares itself unconfirmed
      await expect(page.locator(".dtm__provisional")).toHaveCount(0);
      // no portrait is invented - there are none yet, and none is faked
      expect(await page.locator(".dtm__framein img").count()).toBe(0);
      // and every card carries a real name rather than a placeholder
      const names = await page
        .locator(".dtm__pname")
        .evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
      expect(names).toHaveLength(13);
      for (const n of names) expect(n.length, route).toBeGreaterThan(3);
    }
  });

  test("uses the existing material language, not a card directory", async ({ page }) => {
    /**
     * SUPERSEDED GROUND, SAME CONTRACT. The approved Team design moves the page
     * off the cream paper stock onto the studio YELLOW - still a brand hex,
     * still a printed material rather than a flat fill, with the strong grain
     * and the canvas weave multiplied into it. What this test protects is that
     * it is a MATERIAL and a brand colour, so both are checked rather than the
     * one hex the previous ground happened to be.
     */
    await gotoRoute(page, "/team");
    await expect(page.locator(".dtm > .dao-grain--strong")).toHaveCount(1);
    await expect(page.locator(".dtm > .dao-weave")).toHaveCount(1);
    const got = await page.evaluate(() => {
      const grain = getComputedStyle(document.querySelector(".dtm > .dao-grain--strong")!);
      return {
        bg: getComputedStyle(document.querySelector(".dtm")!).backgroundColor,
        grain: grain.backgroundImage,
        blend: grain.mixBlendMode,
      };
    });
    // the approved yellow, #fff9ab
    expect(got.bg).toBe("rgb(255, 249, 171)");
    expect(got.grain).toContain("paper-grain");
    expect(got.blend).toBe("multiply");
  });

  test("is not added as a ninth burger item", async ({ page }) => {
    await gotoRoute(page, "/");
    await openBurger(page);
    await expect(page.locator(".dao-nav__link")).toHaveCount(8);
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("#dao-nav a")].map((a) => a.getAttribute("href")),
    );
    expect(hrefs).not.toContain("/team");
  });
});

test.describe("no horizontal overflow on the touched routes", () => {
  for (const width of [1440, 1024, 768, 430, 390, 375, 360, 320]) {
    test(`at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 860 });
      for (const route of [
        "/",
        "/services",
        "/work",
        "/work?capability=art-direction",
        "/work?status=in-development",
        "/studio",
        "/team",
        "/ka/team",
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
