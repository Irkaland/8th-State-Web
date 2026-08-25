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

test.describe("§02-§04 What We Make", () => {
  test("the explanatory paragraph and its layout slot are gone", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-svc__intro")).toHaveCount(0);
    const text = await page.locator(".dao-svc").innerText();
    expect(text).not.toContain("Nine capabilities, four kinds of work");
    expect(text).not.toContain("scope is determined per project");
    // and no empty LAYOUT container was left holding the space. Decorative
    // elements are excluded by design: the grain, weave and the symbols
    // ornament are all intentionally textless, and paint through a mask or a
    // background image rather than through content.
    const empties = await page.evaluate(() => {
      const svc = document.querySelector(".dao-svc")!;
      const out: string[] = [];
      for (const el of svc.querySelectorAll("p, span, div")) {
        if (el.children.length > 0 || el.textContent?.trim()) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
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

  test("the separate left taxonomy column is gone", async ({ page }) => {
    await gotoRoute(page, "/");
    await expect(page.locator(".dao-svc__rail")).toHaveCount(0);
    const cols = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dao-svc__grid")!).gridTemplateColumns,
    );
    expect(cols).not.toMatch(/300px/);
  });

  test("each group label sits directly above its own capabilities", async ({ page }) => {
    await gotoRoute(page, "/");
    const order = await page.evaluate(() => {
      const out: { kind: string; text: string }[] = [];
      const list = document.querySelector(".dao-svc__list")!;
      for (const el of list.querySelectorAll(".dao-svc__grouphead, .dao-svc__name")) {
        out.push({
          kind: el.classList.contains("dao-svc__grouphead") ? "group" : "cap",
          text: (el.textContent || "").trim().split("\n")[0]!.trim(),
        });
      }
      return out;
    });
    // four group heads, nine capabilities, groups leading their own runs
    expect(order.filter((o) => o.kind === "group")).toHaveLength(4);
    expect(order.filter((o) => o.kind === "cap")).toHaveLength(9);
    expect(order[0]!.kind).toBe("group");
    const shape = order.map((o) => o.kind).join(",");
    expect(shape).toBe(
      [
        "group",
        "cap",
        "cap",
        "group",
        "cap",
        "cap",
        "cap",
        "cap",
        "group",
        "cap",
        "cap",
        "group",
        "cap",
      ].join(","),
    );
  });

  test("the group label leads and the capability steps down", async ({ page }) => {
    await gotoRoute(page, "/");
    const sizes = await page.evaluate(() => {
      const g = document.querySelector(".dao-svc__groupname")!;
      const c = document.querySelector(".dao-svc__name")!;
      const l = document.querySelector(".dao-svc__grouplayer")!;
      return {
        group: parseFloat(getComputedStyle(g).fontSize),
        cap: parseFloat(getComputedStyle(c).fontSize),
        layer: parseFloat(getComputedStyle(l).fontSize),
      };
    });
    expect(sizes.group).toBeGreaterThan(sizes.cap);
    // the capability must still be strong editorial navigation, not a caption
    expect(sizes.cap).toBeGreaterThan(sizes.layer * 1.5);
    expect(sizes.cap).toBeGreaterThanOrEqual(18);
    // the layer line stays small supporting text
    expect(sizes.layer).toBeLessThan(sizes.cap);
  });

  test("all nine capabilities are listed", async ({ page }) => {
    await gotoRoute(page, "/");
    const names = await page.evaluate(() =>
      [...document.querySelectorAll(".dao-svc__name")].map((el) => (el.textContent || "").trim()),
    );
    expect(names).toHaveLength(9);
    for (const n of NINE) expect(names.some((x) => x.startsWith(n))).toBe(true);
  });
});

test.describe("§05 / §13 / §24 Services", () => {
  test("ALL SERVICES leads to the full catalogue of nine capabilities", async ({ page }) => {
    await gotoRoute(page, "/");
    const href = await page.locator(".dao-svc__all").first().getAttribute("href");
    expect(href).toMatch(/\/services$/);
    await gotoRoute(page, "/services");
    const text = await page.locator(".dao-page").innerText();
    for (const n of NINE) expect(text, `${n} missing from /services`).toContain(n);
  });

  test("every capability has its own Related Work link", async ({ page }) => {
    await gotoRoute(page, "/services");
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("[data-dao-capability]")].map((el) => ({
        id: el.getAttribute("data-dao-capability"),
        href: el.getAttribute("href"),
      })),
    );
    expect(links).toHaveLength(9);
    expect(new Set(links.map((l) => l.id)).size).toBe(9);
    for (const l of links) {
      expect(CAPABILITY_IDS).toContain(l.id!);
      expect(l.href).toMatch(new RegExp(`/work\\?capability=${l.id}$`));
    }
  });

  test("no Related Work link routes to the unfiltered archive", async ({ page }) => {
    await gotoRoute(page, "/services");
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("[data-dao-capability]")].map((el) => el.getAttribute("href")),
    );
    for (const h of hrefs) {
      expect(h).not.toMatch(/\/work$/);
      expect(h).toContain("capability=");
    }
    // the named regression
    const artDirection = await page
      .locator('[data-dao-capability="art-direction"]')
      .first()
      .getAttribute("href");
    expect(artDirection).toMatch(/\/work\?capability=art-direction$/);
  });

  test("the worked-example mark matches the capability's real archive", async ({ page }) => {
    // The mark sits directly above the Related Work link, so it is a claim about
    // the portfolio. Hardcoded it was wrong three ways at once: Scenography and
    // Decoration ticked with an empty archive, Costume Design stayed unmarked
    // with two credited projects.
    await gotoRoute(page, "/services");
    const marked = await page.evaluate(() =>
      [...document.querySelectorAll("[data-dao-capability]")].map((el) => ({
        id: el.getAttribute("data-dao-capability"),
        marked: !!el.parentElement?.querySelector(".dsv__worked"),
      })),
    );
    const byId = new Map(marked.map((m) => [m.id, m.marked]));
    expect(byId.get("scenography"), "0 credited projects").toBe(false);
    expect(byId.get("decoration"), "0 credited projects").toBe(false);
    expect(byId.get("costume-design"), "2 credited projects").toBe(true);
    expect(byId.get("production-design"), "5 credited projects").toBe(true);
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
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("[data-dao-capability]")].map((el) => el.getAttribute("href")),
    );
    expect(hrefs).toHaveLength(9);
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
      const strike = link.querySelector(".dao-strike");
      return {
        text: (link.textContent || "").trim().slice(0, 8),
        transform: strike ? getComputedStyle(strike).transform : "none",
        catsHeight: Math.round(
          document.querySelector(".dao-nav__cats")!.getBoundingClientRect().height,
        ),
      };
    });
    expect(state.text).toMatch(/WORK|ნამუშევრები/);
    // scaleX(0) - drawn only on hover or while the categories are expanded
    expect(state.transform).toBe("matrix(0, 0, 0, 1, 0, 0)");
    // and the collapsed categories block leaves no band under WORK
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

  test("still opens the WORK categories, and marks WORK while they are open", async ({ page }) => {
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
    // and the WORK label is marked while they are expanded
    const marked = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".dao-nav__link .dao-strike")!).transform !==
        "matrix(0, 0, 0, 1, 0, 0)",
    );
    expect(marked).toBe(true);
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

  test("loads in EN and KA with no fabricated people", async ({ page }) => {
    for (const route of ["/team", "/ka/team"]) {
      await gotoRoute(page, route);
      await expect(page.locator(".dtm__cover")).toBeVisible();
      // pre-content state, because no approved team data exists
      await expect(page.locator(".dtm__pending")).toHaveCount(1);
      await expect(page.locator(".dtm__person")).toHaveCount(0);
      // and it offers the archive as the honest record instead
      const href = await page.locator(".dtm__pendingcta").getAttribute("href");
      expect(href).toMatch(route.startsWith("/ka") ? /^\/ka\/work$/ : /^\/work$/);
    }
  });

  test("uses the existing material language, not a card directory", async ({ page }) => {
    await gotoRoute(page, "/team");
    await expect(page.locator(".dtm > .dao-grain")).toHaveCount(1);
    const bg = await page.evaluate(
      () => getComputedStyle(document.querySelector(".dtm")!).backgroundColor,
    );
    expect(bg).toBe("rgb(242, 237, 227)");
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
