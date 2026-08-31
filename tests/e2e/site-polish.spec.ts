import { expect, test, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * The responsive / symbol / routing polish pass.
 *
 * Layout and semantics rather than screenshots: every assertion here is a
 * measurement or a route, so it fails for a reason you can read rather than
 * because a pixel moved.
 */

const WIDTHS = [1440, 1024, 768, 430, 390, 375, 360, 320] as const;
const ROUTES = [
  "/",
  "/work",
  "/services",
  "/studio",
  "/studio-lab",
  "/team",
  "/process",
  "/georgia-production",
  "/contact",
  "/start-a-project",
] as const;

/**
 * Wake the chrome before clicking anything in it.
 *
 * The site hides the mark and the EN/KA switch after 1.8s of pointer idle
 * (v7 #5) - so in a long run they have genuinely withdrawn by the time a test
 * reaches them, and the page underneath takes the click. A user moves the
 * pointer first; so does this.
 *
 * The contextual back no longer needs waking: it is printed INTO the page
 * rather than floating over the chrome, so it never withdraws.
 */
async function wakeChrome(page: Page) {
  await page.mouse.move(600, 400);
  await page.mouse.move(620, 420);
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-dao-idle"),
    undefined,
    { timeout: 5000 },
  );
}

/** bring a Team card fully into view without letting a smooth scroll run on */
async function parkCard(page: Page, nth: number) {
  const card = page.locator(".dtm__person").nth(nth);
  await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(280);
  return card;
}

/* ------------------------------------------- §01/§21 the Team scrollbar --- */

test.describe("§01/§21 the Team profile scrolls without a visible scrollbar", () => {
  for (const width of [390, 360, 320] as const) {
    test(`paints no scrollbar at ${width}, and still scrolls`, async ({ page }) => {
      await page.setViewportSize({ width, height: 620 });
      await gotoRoute(page, "/team");
      const card = await parkCard(page, 0);
      const at = await page.evaluate(() => Math.round(window.scrollY));
      await card.click();
      await expect(page.locator('.dtm__stage[data-dtm-phase="open"]')).toHaveCount(1);

      const m = await page.locator(".dtm__dossier").evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          // a painted scrollbar takes width away from the content box
          gutter: (el as HTMLElement).offsetWidth - el.clientWidth,
          overflowY: cs.overflowY,
          scrollbarWidth: cs.scrollbarWidth,
          canScroll: el.scrollHeight > el.clientHeight,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      });
      // nothing is drawn down the edge of the paper
      expect(m.gutter, `${width} scrollbar gutter`).toBe(0);
      expect(m.scrollbarWidth).toBe("none");
      // and the scroll itself is untouched
      expect(m.overflowY).toBe("auto");

      // prove it really scrolls when the content is taller than the sheet
      if (m.canScroll) {
        const moved = await page.locator(".dtm__dossier").evaluate((el) => {
          el.scrollTop = 60;
          return el.scrollTop;
        });
        expect(moved, "the sheet scrolls programmatically").toBeGreaterThan(0);
        // by keyboard too - the sheet holds focus, so End reaches the bottom
        await page.keyboard.press("End");
        await page.waitForTimeout(150);
        expect(await page.locator(".dtm__dossier").evaluate((el) => el.scrollTop)).toBeGreaterThan(
          0,
        );
      }

      // §21: the page behind it never jumped, and closing puts it back
      expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
      await page.keyboard.press("Escape");
      await expect(page.locator(".dtm__stage")).toHaveCount(0);
      expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    });
  }
});

/* --------------------------------------------- §03 the burger numerals --- */

test.describe("§03 every burger numeral behaves the same", () => {
  test("01 is the same colour as 02-08, at rest and on hover", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await page.locator(".dao-burger").click();
    await expect(page.locator(".dao-nav__list")).toBeVisible();

    const nums = page.locator(".dao-nav__num");
    const count = await nums.count();
    expect(count, "the sheet still numbers every row").toBeGreaterThanOrEqual(8);

    const rest: string[] = [];
    for (let i = 0; i < count; i += 1) {
      rest.push(await nums.nth(i).evaluate((el) => getComputedStyle(el).color));
    }
    // one colour for all of them, and it is still the brand red
    expect(new Set(rest).size, `rest colours: ${[...new Set(rest)].join(" / ")}`).toBe(1);
    expect(rest[0]).toBe("rgb(208, 62, 38)");

    // hovering a numeral must not single it out
    for (let i = 0; i < count; i += 1) {
      await nums.nth(i).hover();
      await page.waitForTimeout(120);
      const after: string[] = [];
      for (let j = 0; j < count; j += 1) {
        after.push(await nums.nth(j).evaluate((el) => getComputedStyle(el).color));
      }
      expect(new Set(after).size, `hovering numeral ${i + 1} changed one of them`).toBe(1);
    }
  });

  test("the 01 toggle still works, and says so without a colour of its own", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/");
    await page.locator(".dao-burger").click();
    const toggle = page.locator(".dao-nav__num--toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    const before = await toggle.evaluate((el) => getComputedStyle(el).color);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".dao-nav__cats.is-open")).toHaveCount(1);
    // the state is carried by aria-expanded and the list, not by the numeral
    expect(await toggle.evaluate((el) => getComputedStyle(el).color)).toBe(before);
  });
});

/* ------------------------------------------------- §04-§06 the Lab card --- */

test.describe("§04-§06 the Studio Lab card is an object, not a section", () => {
  for (const width of WIDTHS) {
    test(`stays a landscape card at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/studio");
      const card = page.locator(".dst__labpanel");
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const m = await card.evaluate((el, vw) => {
        const r = el.getBoundingClientRect();
        const lines = el.querySelector(".dst__lablines") as HTMLElement;
        const inner = el.querySelector(".dst__labpanel-inner") as HTMLElement;
        return {
          w: (el as HTMLElement).offsetWidth,
          h: (el as HTMLElement).offsetHeight,
          transform: getComputedStyle(el).transform,
          // the rotated bounding box, which is what can actually leave the page
          boxLeft: Math.round(r.left),
          boxRight: Math.round(r.right),
          vw,
          contentFits: inner.scrollHeight <= inner.clientHeight + 1,
          /*
           * Whether a LINE is hidden - not whether the two heights differ.
           *
           * scrollHeight rounds each line box up while clientHeight rounds the
           * total, so a three-line block at a fractional font size reports a
           * 1-2px difference with nothing hidden at all. Counting line boxes
           * asks the question that matters and does not depend on where the
           * rounding happens to land.
           */
          linesFit:
            Math.round(lines.scrollHeight / parseFloat(getComputedStyle(lines).lineHeight)) <=
            Math.round(lines.clientHeight / parseFloat(getComputedStyle(lines).lineHeight)),
          docOver: document.documentElement.scrollWidth - window.innerWidth,
        };
      }, width);

      // landscape, at about business-card proportions - never portrait or square
      const ratio = m.w / m.h;
      expect(ratio, `${width} ratio`).toBeGreaterThan(1.45);
      expect(ratio, `${width} ratio`).toBeLessThan(1.8);
      // §06: it is a card, not a full-width section
      expect(m.w, `${width} width vs viewport`).toBeLessThan(width * 0.92);
      // it is turned - a card lying on the composition, not a panel set into it
      expect(m.transform, `${width} rotation`).not.toBe("none");
      // §05/§06: readable and unclipped after the rotation
      expect(m.contentFits, `${width} content fits`).toBe(true);
      expect(m.linesFit, `${width} copy not clipped`).toBe(true);
      // and it never pushes the page sideways
      expect(m.docOver, `${width} document overflow`).toBeLessThanOrEqual(0);
      expect(m.boxRight, `${width} right edge`).toBeLessThanOrEqual(width);
      expect(m.boxLeft, `${width} left edge`).toBeGreaterThanOrEqual(0);
    });
  }

  test("the rotation is a real clockwise turn, in the intended range", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio");
    const deg = await page.locator(".dst__labpanel").evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return (Math.atan2(m.b, m.a) * 180) / Math.PI;
    });
    // Positive is clockwise in CSS. The window was 20-30, then 11-19 when the
    // refinement pass eased the turn to 15; the Studio pass halves it again to
    // 7.5, for a card LAID on the composition rather than pinned to it. The
    // claim - a real turn, never a level UI card - is unchanged.
    expect(deg).toBeGreaterThan(5);
    expect(deg).toBeLessThan(11);
  });
});

/* ------------------------------- §07-§10 brandbook decoration, in place --- */

test.describe("§07-§10 the decoration comes from brandbook assets", () => {
  test("the Studio hero carries three marks, spread and differently sized", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio");
    // the single giant bird is gone
    expect(await page.locator(".dst__swallow").count()).toBe(0);

    const marks = await page.locator(".dst__decor > span").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          mask: getComputedStyle(el).getPropertyValue("--m").trim(),
          w: Math.round(r.width),
          cx: Math.round(r.left + r.width / 2),
          cy: Math.round(r.top + r.height / 2),
        };
      }),
    );
    expect(marks.length).toBe(3);
    // real brandbook files, not generic stand-ins
    for (const m of marks) expect(m.mask).toMatch(/bb-(twin-birds|flower-stem|flourish)\.webp/);
    // three clearly different sizes
    const widths = marks.map((m) => m.w).sort((a, b) => a - b);
    expect(widths[1] / widths[0], "sizes differ").toBeGreaterThan(1.4);
    expect(widths[2] / widths[1], "sizes differ").toBeGreaterThan(1.4);
    // not clustered, and not on a shared axis
    for (let i = 0; i < marks.length; i += 1) {
      for (let j = i + 1; j < marks.length; j += 1) {
        const d = Math.hypot(marks[i].cx - marks[j].cx, marks[i].cy - marks[j].cy);
        expect(d, `marks ${i} and ${j} sit too close`).toBeGreaterThan(120);
        expect(Math.abs(marks[i].cx - marks[j].cx), "shared vertical axis").toBeGreaterThan(12);
        expect(Math.abs(marks[i].cy - marks[j].cy), "shared horizontal axis").toBeGreaterThan(12);
      }
    }
  });

  test("decoration is hidden from assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio");
    await expect(page.locator(".dst__decor")).toHaveAttribute("aria-hidden", "true");
    await gotoRoute(page, "/studio-lab");
    // the Lab's decoration is now its botanicals and drawn marks; the bird went
    // with the field-notes page. Both are kept out of the accessibility tree.
    for (const el of await page.locator(".dsl-bot").all()) {
      await expect(el).toHaveAttribute("alt", "");
    }
    expect(
      await page
        .locator(".dsl svg")
        .evaluateAll((els) => els.filter((e) => e.getAttribute("aria-hidden") !== "true").length),
    ).toBe(0);
    await gotoRoute(page, "/start-a-project");
    await expect(page.locator(".dbr__swallow")).toHaveAttribute("aria-hidden", "true");
  });

  test("the dark Studio section carries the brandbook sun, top intact", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio");
    const m = await page.locator(".dst__handoffsun").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const b = el.closest(".dst__handoff")!.getBoundingClientRect();
      return {
        mask: getComputedStyle(el).getPropertyValue("--m").trim(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        // top, left, right - the three sides the band must not shear
        inset: [r.top - b.top, r.left - b.left, b.right - r.right],
        bandH: Math.round(b.height),
      };
    });
    expect(m.mask).toContain("bb-sun-symbol.webp");
    // A background graphic, not an icon. The old ">700px wide" measure was only
    // reachable by shearing the mark's upper rays off; the fix after that made
    // the mark whole by growing the band around it, which cost 390px of empty
    // ink. The approved shape now: protect the top, crop the bottom at the
    // section edge, and keep the band the height of its own content.
    expect(m.h).toBeGreaterThan(300);
    for (const side of m.inset) expect(side).toBeGreaterThan(0);
    expect(m.bandH).toBeLessThan(320);
  });

  // SUPERSEDED AGAIN: the Lab hero's one brandbook symbol is now the approved
  // design's single cropped floral-rose, drawn as a low-opacity image rather
  // than a masked band. The claim is unchanged - one mark, at real size,
  // cropped by the hero - only the mark and the technique differ.
  test("the Lab hero carries one cropped botanical, at real size", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/studio-lab");
    const hero = page.locator(".dsl__hero .dsl-bot");
    await expect(hero).toHaveCount(1);
    const m = await hero.evaluate((el) => ({
      mask: (el as HTMLImageElement).getAttribute("src") ?? "",
      w: Math.round(el.getBoundingClientRect().width),
      right: Math.round(el.getBoundingClientRect().right),
      vw: document.documentElement.clientWidth,
      opacity: parseFloat(getComputedStyle(el.parentElement!).opacity),
    }));
    expect(m.mask).toContain("floral-rose");
    expect(m.w, "present at real size").toBeGreaterThan(150);
    expect(m.right, "cropped by the hero edge").toBeGreaterThan(m.vw);
    expect(m.opacity, "a wash, not a subject").toBeLessThanOrEqual(0.2);
    // present, but not competing with the title
    const title = await page
      .locator(".dsl__title")
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(m.w).toBeLessThan(title * 1.2);
  });
});

/* REMOVED: "§11 the red CTA is printed paper".
   The only red fill CTA on the site was WRITE TO THE LAB, on the Lab's
   collaboration block. The approved Studio Lab design replaces that block with
   BEGIN REGISTRATION - an underlined ink call, not a filled chip - so there is
   no red button left to measure. The paper-grain treatment itself is unchanged
   in dao.css and still covered on the surfaces that use it. */

test.describe("§12 GEORGIA PRODUCTION sits on the shared title scale", () => {
  for (const width of [390, 375, 360, 320] as const) {
    test(`matches its peers at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const sizeOf = async (route: string) => {
        await gotoRoute(page, route);
        return page
          .locator(".dao-cover__title")
          .first()
          .evaluate((el) => Math.round(parseFloat(getComputedStyle(el).fontSize)));
      };
      const gp = await sizeOf("/georgia-production");
      const studio = await sizeOf("/studio");
      const services = await sizeOf("/services");
      // it used to be smaller at every width purely because the words are longer
      expect(gp, `${width}: gp=${gp} studio=${studio} services=${services}`).toBe(studio);
      expect(gp).toBe(services);
    });
  }

  test("the size is a class, not an inline override", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/georgia-production");
    const title = page.locator(".dao-cover__title").first();
    await expect(title).toHaveClass(/dgp__title/);
    expect(await title.evaluate((el) => (el as HTMLElement).style.fontSize)).toBe("");
  });
});

/* ------------------------------------------ §14-§16 the swallow, placed --- */

test.describe("§14-§16 the Start a Project swallow", () => {
  test("answers the heading from the other side, with its widest margin left", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/start-a-project");
    const m = await page.evaluate(() => {
      const s = document.querySelector(".dbr__swallow") as HTMLElement;
      const t = document.querySelector(".dbr__title") as HTMLElement;
      const r = s.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      const zone = (s.parentElement as HTMLElement).getBoundingClientRect();
      return {
        mask: getComputedStyle(s).getPropertyValue("--m").trim(),
        colour: getComputedStyle(s).backgroundColor,
        w: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(window.innerWidth - r.right),
        top: Math.round(r.top - zone.top),
        bottom: Math.round(zone.bottom - r.bottom),
        gapFromTitle: Math.round(r.left - tr.right),
        titleCentre: Math.round(tr.left + tr.width / 2),
        swallowCentre: Math.round(r.left + r.width / 2),
      };
    });
    // The brandbook artwork, painted cream. It ships as VECTOR now: the source
    // in the brandbook is 279x314 and this box draws it up to 330px wide, so
    // any raster was an enlargement by construction. The outline is traced from
    // that same object - see scripts/vectorize-swallow.mjs - not re-drawn.
    expect(m.mask).toContain("swallow.svg");
    expect(m.colour).toBe("rgb(242, 237, 227)");
    // it is on the opposite side of the page from the heading
    expect(m.swallowCentre).toBeGreaterThan(m.titleCentre);
    // §15: the largest empty margin is on its LEFT, and the other three are
    // closer to each other than any of them is to that
    expect(m.left).toBeGreaterThan(m.right * 2);
    expect(m.gapFromTitle).toBeGreaterThan(120);
    // never flush to the edge
    expect(m.right).toBeGreaterThan(24);
    // a substantial object, not a decorative dot
    expect(m.w).toBeGreaterThan(220);
  });

  for (const width of WIDTHS) {
    test(`never reaches the form or the chrome at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/start-a-project");
      await page.waitForTimeout(200);
      const m = await page.evaluate(() => {
        const s = document.querySelector(".dbr__swallow") as HTMLElement;
        const r = s.getBoundingClientRect();
        const hits = (
          [
            ...document.querySelectorAll("input, textarea, select, button, h1, nav, .dao-chrome"),
          ] as HTMLElement[]
        )
          .filter((el) => {
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return false;
            return !(
              b.right <= r.left ||
              b.left >= r.right ||
              b.bottom <= r.top ||
              b.top >= r.bottom
            );
          })
          .map((el) => el.tagName + "." + el.className.toString().split(" ")[0]);
        return {
          w: Math.round(r.width),
          hits,
          ratio: r.width / r.height,
          over: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(m.hits, `${width} overlaps: ${m.hits.join(", ")}`).toEqual([]);
      // scales down but never becomes tiny, and holds its aspect
      expect(m.w, `${width} width`).toBeGreaterThanOrEqual(100);
      expect(m.ratio, `${width} aspect`).toBeCloseTo(900 / 994, 1);
      expect(m.over, `${width} overflow`).toBeLessThanOrEqual(0);
    });
  }
});

/* -------------------------------- §17-§20 the site BACK control is a route */

test.describe("§17-§20 the contextual BACK goes to the page's parent", () => {
  /**
   * SUPERSEDED CONTROL, NARROWED SCOPE.
   *
   * This suite was written for the ReturnTab, a fixed paper tab beside the
   * chrome that appeared on ten routes - including top-level ones, where it
   * pointed HOME and duplicated the brand mark. FINAL UX retires it and gives
   * the site ONE contextual vocabulary: an in-page masthead back, on the three
   * routes that genuinely have a contextual parent.
   *
   * Everything this suite actually guaranteed still holds and is still checked:
   * it is a real link to an explicit route rather than a history pop, it names
   * the parent in the reader's own locale, one click lands there, a locale
   * switch does not change where it goes, and the browser's own Back is
   * untouched. What changed is which routes have one - and that top-level
   * routes now correctly have none.
   */
  const PARENTS = [
    [".dao-mback", "/team", "/studio"],
    [".dao-mback", "/work/aom-summer-collection", "/work"],
    [".dsc__back", "/studio-lab/photography", "/studio-lab"],
  ] as const;

  const NO_CONTEXTUAL_PARENT = [
    "/",
    "/studio",
    "/services",
    "/georgia-production",
    "/process",
    "/studio-lab",
    "/contact",
    "/start-a-project",
  ] as const;

  test("is a link to an explicit route, not a history pop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/team");
    const back = page.locator(".dao-mback");
    // a real link: it has an href, so it prefetches and middle-clicks like one
    await expect(back).toHaveAttribute("href", "/studio");
    expect(await back.evaluate((el) => el.tagName)).toBe("A");
  });

  test("a top-level route carries none, because it has no contextual parent", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of NO_CONTEXTUAL_PARENT) {
      await gotoRoute(page, route);
      expect(await page.locator(".dao-mback").count(), route).toBe(0);
    }
  });

  for (const [sel, child, parent] of PARENTS) {
    test(`${child} returns to ${parent} in EN and KA`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const loc of ["", "/ka"] as const) {
        await gotoRoute(page, loc + child);
        const want = loc === "" ? parent : `/ka${parent}`;
        const back = page.locator(sel);
        await expect(back).toHaveAttribute("href", want);
        await back.click();
        await page.waitForURL((u) => new URL(u).pathname === want, { timeout: 15000 });
        expect(new URL(page.url()).pathname).toBe(want);
      }
    });
  }

  test("is present, and a real target, on a phone", async ({ page }) => {
    // the whole reason the vocabulary changed: the tab was display:none below
    // 720px, which left phone readers with no contextual parent at all
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoRoute(page, "/team");
    const back = page.locator(".dao-mback");
    await expect(back).toBeVisible();
    const box = await back.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  for (const [from, to] of [
    ["", "/ka"],
    ["/ka", ""],
  ] as const) {
    test(`switching locale ${from || "/en"} -> ${to || "/en"} does not change where BACK goes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoRoute(page, `${from}/team`);
      const beforeHref = await page.locator(".dao-mback").getAttribute("href");

      // switch language on the page itself - this is the step that used to add a
      // history entry and send BACK into the previous language.
      //
      // The chrome has to be awake first. `html[data-dao-idle]` fades the
      // language switcher (dao.css), so an idle or mid-transition chrome leaves
      // the link resolvable but never "stable", and the click then waits out the
      // whole test timeout.
      await wakeChrome(page);
      await page
        .locator(".dao-lang a")
        .filter({ hasText: to === "/ka" ? "KA" : "EN" })
        .click();
      const switched = to === "/ka" ? "/ka/team" : "/team";
      await page.waitForURL((u) => new URL(u).pathname === switched, { timeout: 15000 });

      const want = to === "/ka" ? "/ka/studio" : "/studio";
      await expect(page.locator(".dao-mback")).toHaveAttribute("href", want);
      expect(beforeHref).not.toBe(want);

      // ONE click, and it lands on the parent in the CURRENT locale
      await page.locator(".dao-mback").click();
      await page.waitForURL((u) => new URL(u).pathname === want, { timeout: 15000 });
      expect(new URL(page.url()).pathname).toBe(want);
    });
  }

  test("the browser's own Back is left alone", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoRoute(page, "/team");
    await page.locator(".dao-mback").click();
    await page.waitForURL((u) => new URL(u).pathname === "/studio", { timeout: 15000 });
    // browser Back still means "the page I came from", which is /team
    await page.goBack();
    await page.waitForURL((u) => new URL(u).pathname === "/team", { timeout: 15000 });
    expect(new URL(page.url()).pathname).toBe("/team");
  });
});

/* ------------------------------------------------ §26 nothing overflows --- */

test.describe("§26 no horizontal overflow", () => {
  for (const width of WIDTHS) {
    test(`at ${width}, EN and KA`, async ({ page }) => {
      test.setTimeout(180000);
      await page.setViewportSize({ width, height: 900 });
      for (const base of ROUTES) {
        for (const loc of ["", "/ka"] as const) {
          const route = loc && base === "/" ? "/ka" : loc + base;
          await gotoRoute(page, route);
          const over = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(over, `${route} @${width}`).toBeLessThanOrEqual(0);
        }
      }
    });
  }
});
