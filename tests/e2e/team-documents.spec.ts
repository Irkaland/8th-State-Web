import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE DOSSIER'S DOCUMENTS.
 *
 * Four controls, three kinds of document, one shell.
 *
 * WHAT REPLACED WHAT. This file used to assert a RESUME control that opened a
 * menu of two language editions, EN and ES. There is now ONE English CV per
 * person, so the menu is gone and RESUME opens the document in a single click.
 * Those menu assertions are not weakened here, they are retired: the thing they
 * described no longer exists, and the tests below assert its absence instead.
 *
 * BIOGRAPHY and ARTIST STATEMENT are new, and they are NOT PDFs. They are the
 * studio's own prose drawn as native markup, in the art direction of the sheet
 * each came from - so what is checked is that they carry real text, that they
 * carry no iframe, and that Bekassio's sheets and Mariam's do not converge.
 */

/** the one English CV per person, at its new unsuffixed path */
const RESUMES: Record<string, string> = {
  "mariam-kandiashvili": "/team/resumes/mariam-kandiashvili.pdf",
  "beka-jokharidze": "/team/resumes/beka-jokharidze.pdf",
};

/** every path the retired Spanish/-en system used - none may be requested */
const RETIRED = [
  "/team/resumes/mariam-kandiashvili-en.pdf",
  "/team/resumes/mariam-kandiashvili-es.pdf",
  "/team/resumes/beka-jokharidze-en.pdf",
  "/team/resumes/beka-jokharidze-es.pdf",
];

const sheet = (page: Page) => page.locator(".dtr__sheet[role=dialog]");
const control = (page: Page, name: RegExp) =>
  page.locator(".dtm__actions button", { hasText: name });

async function openProfile(page: Page, slug: string) {
  await gotoRoute(page, `/team?person=${slug}`);
  await expect(page.locator(".dtm__dossier")).toHaveCount(1);
}

async function openDoc(page: Page, name: RegExp) {
  await control(page, name).first().click();
  await expect(sheet(page)).toHaveCount(1);
}

/* ------------------------------------------------------------------ A --- */

test.describe("A · the controls a person actually has", () => {
  for (const slug of Object.keys(RESUMES)) {
    test(`${slug} carries portfolio, resume, biography and artist statement`, async ({ page }) => {
      await openProfile(page, slug);
      await expect(page.locator(".dtm__portfolio")).toHaveCount(1);
      await expect(control(page, /^RESUME$/)).toHaveCount(1);
      await expect(control(page, /BIOGRAPHY/)).toHaveCount(1);
      await expect(control(page, /ARTIST STATEMENT/)).toHaveCount(1);
      // no LinkedIn: no real URL has been supplied for either of them
      await expect(page.locator(".dtm__linkedin")).toHaveCount(0);
    });
  }

  test("a colleague with no documents gains no document controls", async ({ page }) => {
    await openProfile(page, "keto-kiladze");
    await expect(page.locator(".dtm__doc")).toHaveCount(0);
    await expect(page.locator(".dtm__portfolio")).toHaveCount(0);
  });
});

/* ------------------------------------------------------------------ B --- */

test.describe("B · the resume is one document, opened in one click", () => {
  for (const [slug, src] of Object.entries(RESUMES)) {
    test(`${slug}: RESUME opens the English CV immediately`, async ({ page }) => {
      await openProfile(page, slug);
      await openDoc(page, /^RESUME$/);
      await expect(page.locator(".dtr__frame")).toHaveAttribute("src", src);
    });
  }

  test("there is no language menu anywhere in the dossier", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    await expect(page.locator("[role=menu]")).toHaveCount(0);
    await expect(page.locator("[role=menuitem]")).toHaveCount(0);
    // and the control says RESUME, not RESUME EN or RESUME with a caret
    const label = await control(page, /^RESUME$/).innerText();
    expect(label.trim()).toBe("RESUME");
    expect(label).not.toMatch(/\bEN\b|\bES\b|▾/);
    // opening it still does not produce a menu
    await openDoc(page, /^RESUME$/);
    await expect(page.locator("[role=menu]")).toHaveCount(0);
  });

  test("no retired resume path is ever requested, and none is reachable", async ({
    page,
    request,
  }) => {
    const asked: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url()).pathname;
      if (RETIRED.includes(u)) asked.push(u);
    });
    for (const slug of Object.keys(RESUMES)) {
      await openProfile(page, slug);
      await openDoc(page, /^RESUME$/);
      await page.keyboard.press("Escape");
    }
    expect(asked, "a retired resume path was requested").toEqual([]);
    for (const p of RETIRED) {
      const res = await request.get(p);
      expect(res.status(), `${p} is still served`).toBe(404);
    }
  });

  test("both English CVs are actually served, as PDFs", async ({ request }) => {
    for (const src of Object.values(RESUMES)) {
      const res = await request.get(src);
      expect(res.status(), src).toBe(200);
      expect(res.headers()["content-type"], src).toContain("application/pdf");
    }
  });
});

/* ------------------------------------------------------------------ C --- */

test.describe("C · biography and artist statement are native documents", () => {
  const CASES = [
    {
      slug: "beka-jokharidze",
      name: /BIOGRAPHY/,
      design: "bekassio",
      id: "beka-biography",
      // first and last sentence of the supplied source
      opens: "Bekassio (Beka Jokharidze) is a self-taught Georgian photographer",
      closes: "communicating his experience of the world.",
    },
    {
      slug: "beka-jokharidze",
      name: /ARTIST STATEMENT/,
      design: "bekassio",
      id: "beka-artist-statement",
      opens: "At the center of my work is an interest in the spiritual dimension",
      closes: "its mystery and its continual transformation.",
    },
    {
      slug: "mariam-kandiashvili",
      name: /BIOGRAPHY/,
      design: "mariam",
      id: "mariam-biography",
      opens: "Mariam Kandiashvili (born 1993) is a Georgian multimedia artist",
      closes: "cinema, design, and visual storytelling.",
    },
    {
      slug: "mariam-kandiashvili",
      name: /ARTIST STATEMENT/,
      design: "mariam",
      id: "mariam-artist-statement",
      opens: "For me, art is more than a practice",
      closes: "offering hope and understanding to a world that needs it.",
    },
  ] as const;

  for (const c of CASES) {
    test(`${c.id} renders as markup, not a PDF`, async ({ page }) => {
      await openProfile(page, c.slug);
      await openDoc(page, c.name);
      const doc = page.locator(".dtd");
      await expect(doc).toHaveCount(1);
      await expect(doc).toHaveAttribute("data-design", c.design);
      await expect(doc).toHaveAttribute("data-doc", c.id);
      // the whole point: no embedded document
      await expect(sheet(page).locator("iframe")).toHaveCount(0);
      await expect(sheet(page).locator("embed, object")).toHaveCount(0);
      // and the supplied text is present, start and end
      const text = await doc.innerText();
      expect(text).toContain(c.opens);
      expect(text).toContain(c.closes);
      // real paragraphs, not one wall
      expect(await doc.locator(".dtd__body p").count()).toBeGreaterThanOrEqual(5);
    });
  }

  test("the two art directions do not converge", async ({ page }) => {
    const ground = async (slug: string, name: RegExp) => {
      await openProfile(page, slug);
      await openDoc(page, name);
      const bg = await page.locator(".dtd").evaluate((e) => getComputedStyle(e).backgroundColor);
      await page.keyboard.press("Escape");
      return bg;
    };
    const beka = await ground("beka-jokharidze", /ARTIST STATEMENT/);
    const mariam = await ground("mariam-kandiashvili", /ARTIST STATEMENT/);
    expect(beka).not.toBe(mariam);
    // Bekassio's sheet is the burnt orange his documents are printed on
    expect(beka).toBe("rgb(211, 116, 64)");
    // Mariam's is warm paper
    expect(mariam).toBe("rgb(245, 244, 240)");
  });

  test("only the artist statement carries the sun, and it is the studio's own", async ({
    page,
  }) => {
    await openProfile(page, "beka-jokharidze");
    await openDoc(page, /ARTIST STATEMENT/);
    const mask = await page
      .locator(".dtd__sun")
      .evaluate((e) => getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage);
    expect(mask).toContain("bb-sun-symbol");
    await page.keyboard.press("Escape");
    await openDoc(page, /BIOGRAPHY/);
    await expect(page.locator(".dtd__sun")).toHaveCount(0);
  });
});

/* ------------------------------------------------------------------ D --- */

test.describe("D · every document behaves like a dialog", () => {
  const OPENERS = [/^RESUME$/, /BIOGRAPHY/, /ARTIST STATEMENT/] as const;

  for (const name of OPENERS) {
    test(`${name.source}: labelled modal, Escape closes, focus returns`, async ({ page }) => {
      await openProfile(page, "mariam-kandiashvili");
      const opener = control(page, name).first();
      await opener.click();
      const d = sheet(page);
      await expect(d).toHaveAttribute("aria-modal", "true");
      await expect(d).toHaveAttribute("aria-labelledby", /.+/);
      // the page behind is locked while it is open
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
      await page.keyboard.press("Escape");
      await expect(d).toHaveCount(0);
      // ...and released after
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe(
        "hidden",
      );
      // the profile is still open behind it, and focus is back on the control
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await expect(opener).toBeFocused();
    });
  }

  test("the CLOSE control works as well as the key", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    await openDoc(page, /BIOGRAPHY/);
    await page.locator(".dtr__close").click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
  });

  test("opening a document never navigates away or opens a tab", async ({ page, context }) => {
    const before = page.url();
    const popups: string[] = [];
    context.on("page", (p) => popups.push(p.url()));
    await openProfile(page, "beka-jokharidze");
    const at = page.url();
    for (const name of OPENERS) {
      await openDoc(page, name);
      expect(page.url()).toBe(at);
      await page.keyboard.press("Escape");
    }
    expect(popups).toEqual([]);
    expect(page.url()).not.toBe(before + "#");
  });

  test("no nested interactive elements in the action row", async ({ page }) => {
    await openProfile(page, "mariam-kandiashvili");
    const nested = await page.evaluate(
      () =>
        document.querySelectorAll(
          ".dtm__actions a button, .dtm__actions button a, .dtm__actions button button",
        ).length,
    );
    expect(nested).toBe(0);
  });
});

/* ------------------------------------------------------------------ E --- */

test.describe("E · the dossier itself is unchanged", () => {
  test("carries the approved file furniture", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    await expect(page.locator(".dtm__tcta--back")).toHaveCount(1);
    await expect(page.locator(".dtm__slugrule")).toHaveCount(1);
    await expect(page.locator(".dtm__breadcrumb")).toHaveCount(1);
    await expect(page.locator(".dtm__framecap")).toHaveCount(1);
    await expect(page.locator(".dtm__filenote")).toHaveCount(1);
    const crumb = await page.locator(".dtm__breadcrumb").innerText();
    expect(crumb).toContain("02");
    expect(crumb.toUpperCase()).toContain("CREATIVE LEADERSHIP");
  });

  test("is a large sheet, not a compact card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await openProfile(page, "beka-jokharidze");
    await page.waitForTimeout(900);
    const box = await page.locator(".dtm__morph").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(box.w).toBe(1180);
    expect(box.h).toBe(855);
  });

  test("the portrait column holds the approved share of the sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await openProfile(page, "beka-jokharidze");
    await page.waitForTimeout(900);
    const share = await page.evaluate(() => {
      const top = document.querySelector(".dtm__dtop")!.getBoundingClientRect().width;
      const left = document.querySelector(".dtm__bigframe")!.getBoundingClientRect().width;
      return left / top;
    });
    expect(share).toBeGreaterThan(0.32);
    expect(share).toBeLessThan(0.44);
  });
});

/* ------------------------------------------------------------------ F --- */

test.describe("F · responsive and quiet", () => {
  for (const width of [1440, 1024, 768, 430, 390, 375, 320] as const) {
    test(`no horizontal overflow at ${width}, profile and every document`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openProfile(page, "beka-jokharidze");
      const over = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
      expect(await over(), `profile overflows at ${width}`).toBeLessThanOrEqual(1);

      for (const name of [/^RESUME$/, /BIOGRAPHY/, /ARTIST STATEMENT/] as const) {
        await openDoc(page, name);
        expect(await over(), `${name.source} overflows at ${width}`).toBeLessThanOrEqual(1);
        const right = await sheet(page).evaluate((e) =>
          Math.round(e.getBoundingClientRect().right),
        );
        expect(right, `${name.source} runs off the frame at ${width}`).toBeLessThanOrEqual(
          width + 1,
        );
        await page.keyboard.press("Escape");
      }
    });
  }

  test("all four controls clear the touch floor on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page, "mariam-kandiashvili");
    const heights = await page
      .locator(".dtm__actions .dtm__portfolio, .dtm__actions .dtm__doc")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(heights.length).toBe(4);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });

  test("the documents are quiet in the console, EN and KA", async ({ page }) => {
    const errs: string[] = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    for (const prefix of ["", "/ka"]) {
      await gotoRoute(page, `${prefix}/team?person=mariam-kandiashvili`);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      for (const name of [/^RESUME$/, /BIOGRAPHY/, /ARTIST STATEMENT/] as const) {
        // on /ka the controls carry Georgian labels, so match on class instead
        const btn = page
          .locator(".dtm__actions button")
          .nth(name.source.includes("RESUME") ? 0 : name.source.includes("BIOGRAPHY") ? 1 : 2);
        await btn.click();
        await expect(sheet(page)).toHaveCount(1);
        await page.keyboard.press("Escape");
      }
    }
    expect(errs, errs.join("\n")).toEqual([]);
  });

  test("the professional documents stay English on the Georgian site", async ({ page }) => {
    await gotoRoute(page, "/ka/team?person=beka-jokharidze");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    // the control is Georgian...
    const labels = await page.locator(".dtm__actions button").allInnerTexts();
    expect(labels.join(" ")).toMatch(/[Ⴀ-ჿ]/);
    // ...and the document behind it is the supplied English one, untranslated
    await page.locator(".dtm__actions button").nth(1).click();
    await expect(page.locator(".dtd")).toHaveCount(1);
    expect(await page.locator(".dtd__body").innerText()).toContain(
      "self-taught Georgian photographer",
    );
  });
});

/* ------------------------------------------------------------------ G --- */

/**
 * The three refinements: an inline role line, a text-only portfolio control on
 * a phone, and a resume that opens fitted rather than cropped.
 */
test.describe("G · roles read as one line", () => {
  const EXPECTED: Record<string, string> = {
    "mariam-kandiashvili":
      "CREATIVE DIRECTOR · HEAD OF ART DEPARTMENT · MULTIMEDIA ARTIST · GRAPHIC DESIGNER",
    "beka-jokharidze": "DIRECTOR OF PHOTOGRAPHY · PHOTOGRAPHER · ART DIRECTOR · MULTIMEDIA ARTIST",
  };

  for (const [slug, expected] of Object.entries(EXPECTED)) {
    test(`${slug}: one middle-dot run, not one role per line`, async ({ page }) => {
      await openProfile(page, slug);
      const roles = page.locator(".dtm__dossier .dtm__role--2");
      // ONE element, not one per role - the stacking is what this replaced
      await expect(roles).toHaveCount(1);
      expect((await roles.innerText()).replace(/\s+/g, " ").trim()).toBe(expected);
      // the separator is the middle dot, never a slash, comma or dash
      const text = await roles.innerText();
      expect((text.match(/·/g) ?? []).length).toBe(3);
      expect(text).not.toMatch(/\s[/,]\s|\s-\s/);
      // and the primary role is still its own line, in red
      const primary = page.locator(".dtm__dossier .dtm__role").first();
      expect((await primary.innerText()).trim()).toBe("CO-FOUNDER");
      await expect(primary).toHaveCSS("color", "rgb(208, 62, 38)");
    });
  }

  test("it holds one line at 1440 and wraps rather than stacking on a phone", async ({ page }) => {
    const lines = async (width: number) => {
      await page.setViewportSize({ width, height: 900 });
      await openProfile(page, "mariam-kandiashvili");
      return page.locator(".dtm__dossier .dtm__role--2").evaluate((el) => {
        const cs = getComputedStyle(el);
        return Math.round(el.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      });
    };
    expect(await lines(1440), "should be a single line on desktop").toBe(1);
    const phone = await lines(390);
    expect(phone, "should wrap on a phone").toBeGreaterThan(1);
    // ...but never back to one role per line
    expect(phone, "wrapping, not stacking").toBeLessThanOrEqual(3);
  });
});

test.describe("G · the portfolio control is text only on a phone", () => {
  /**
   * Diagonal arrows and the emoji presentation selector - the codepoints with
   * emoji renderings. The horizontal arrows the dossier uses in running text
   * ("BACK TO THE SHEET", "NEXT PERSON") are approved furniture and are not
   * what this guards against.
   */
  const GLYPHS = /[↖-↙⬀-⬄️]/;

  test("no arrow, emoji or glyph in the mobile action grid", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page, "mariam-kandiashvili");
    const pf = page.locator(".dtm__actions .dtm__portfolio");
    // the label is exactly the words, with no trailing character
    expect((await pf.innerText()).replace(/\s+/g, " ").trim()).toBe("VIEW PORTFOLIO");
    // the mark exists in the markup (it is an SVG, never a font glyph) but is
    // not rendered at this width
    await expect(pf.locator("svg.dtm__extmark")).toHaveCount(1);
    await expect(pf.locator("svg.dtm__extmark")).toBeHidden();
    // no arrow codepoint anywhere in the action row - a bare U+2197 is what
    // several mobile browsers were resolving from an emoji font
    expect(await page.locator(".dtm__actions").innerText()).not.toMatch(GLYPHS);
  });

  test("all four labels are centred and the cells match", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page, "mariam-kandiashvili");
    const cells = page.locator(".dtm__actions .dtm__portfolio, .dtm__actions .dtm__doc");
    await expect(cells).toHaveCount(4);
    const boxes = await cells.evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return {
          w: Math.round(r.width),
          h: Math.round(r.height),
          j: getComputedStyle(e).justifyContent,
        };
      }),
    );
    for (const b of boxes) {
      expect(b.j, "labels centred").toBe("center");
      expect(b.h, "touch floor").toBeGreaterThanOrEqual(44);
      expect(b.w, "equal cells").toBe(boxes[0]!.w);
    }
  });

  test("desktop keeps a drawn external mark, and it is never a font glyph", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await openProfile(page, "mariam-kandiashvili");
    await expect(page.locator(".dtm__actions .dtm__portfolio svg.dtm__extmark")).toBeVisible();
    expect(await page.locator(".dtm__actions").innerText()).not.toMatch(GLYPHS);
  });
});

test.describe("G · the resume fits its frame on a phone", () => {
  for (const width of [320, 375, 390, 430] as const) {
    test(`at ${width} the page is fitted, not cropped`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openProfile(page, "mariam-kandiashvili");
      await openDoc(page, /^RESUME$/);
      const m = await page.evaluate(() => {
        const pdf = document.querySelector(".dtr__pdf")!;
        const f = document.querySelector(".dtr__frame")!;
        const pr = pdf.getBoundingClientRect();
        const fr = f.getBoundingClientRect();
        return {
          fitted: pdf.hasAttribute("data-fitted"),
          scale: Number((pdf as HTMLElement).style.getPropertyValue("--dtr-pdf-scale") || 1),
          layoutW: Math.round(parseFloat(getComputedStyle(f).width)),
          within: fr.left >= pr.left - 1 && fr.right <= pr.right + 1,
          src: f.getAttribute("src") ?? "",
        };
      });
      // the viewer is laid out at the width it fits a page at, then scaled in
      expect(m.fitted, "must take the fitted path below the safe native width").toBe(true);
      expect(m.layoutW, "laid out at the fitting width").toBe(380);
      expect(m.scale, "only ever scaled down").toBeLessThanOrEqual(1);
      expect(m.scale, "and never to illegibility").toBeGreaterThan(0.6);
      expect(m.within, "the frame must sit inside its box, not overflow it").toBe(true);
      // the viewer chrome is stripped: its rail reappears on frame HEIGHT and
      // would eat the width the page needs
      expect(m.src).toContain("#toolbar=0");
      // and the site itself never gains a horizontal scrollbar
      const ov = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(ov).toBeLessThanOrEqual(1);
    });
  }

  test("desktop is left on the native viewer, untouched", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await openProfile(page, "mariam-kandiashvili");
    await openDoc(page, /^RESUME$/);
    const m = await page.evaluate(() => {
      const pdf = document.querySelector(".dtr__pdf")!;
      const f = document.querySelector(".dtr__frame")!;
      return {
        fitted: pdf.hasAttribute("data-fitted"),
        transform: getComputedStyle(f).transform,
        src: f.getAttribute("src") ?? "",
      };
    });
    expect(m.fitted, "no fitting on desktop").toBe(false);
    expect(m.transform === "none" || m.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    expect(m.src, "no chrome stripping on desktop").not.toContain("#");
  });

  test("the native documents are untouched by the resume fit", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page, "mariam-kandiashvili");
    for (const name of [/BIOGRAPHY/, /ARTIST STATEMENT/] as const) {
      await openDoc(page, name);
      // still native markup, and never inside the PDF fitting wrapper
      await expect(page.locator(".dtd")).toHaveCount(1);
      await expect(page.locator(".dtr__pdf")).toHaveCount(0);
      await expect(sheet(page).locator("iframe")).toHaveCount(0);
      await page.keyboard.press("Escape");
    }
  });
});
