import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE RESUME CONTROL AND THE SHEET IT OPENS.
 *
 * One control per person, two editions behind it, and the document opened
 * INSIDE the site. The things asserted here are the ones a refactor can quietly
 * break: that the control appears only where the studio supplied files, that
 * each language maps to its own document, that choosing one does not navigate
 * away, and that the sheet can be left by keyboard.
 */

const RESUMES: Record<string, { en: string; es: string }> = {
  "mariam-kandiashvili": {
    en: "/team/resumes/mariam-kandiashvili-en.pdf",
    es: "/team/resumes/mariam-kandiashvili-es.pdf",
  },
  "beka-jokharidze": {
    en: "/team/resumes/beka-jokharidze-en.pdf",
    es: "/team/resumes/beka-jokharidze-es.pdf",
  },
};

const viewer = (page: Page) => page.locator(".dtr__sheet[role=dialog]");

async function openProfile(page: Page, slug: string) {
  await gotoRoute(page, `/team?person=${slug}`);
  await expect(page.locator(".dtm__dossier")).toHaveCount(1);
}

async function openMenu(page: Page) {
  const btn = page.locator(".dtm__resume");
  await btn.click();
  await expect(page.locator(".dtm__resumemenu")).toHaveCount(1);
  return btn;
}

test.describe("A · the control exists exactly where the files do", () => {
  for (const slug of Object.keys(RESUMES)) {
    test(`${slug} has one RESUME control, not one per language`, async ({ page }) => {
      await openProfile(page, slug);
      await expect(page.locator(".dtm__resume")).toHaveCount(1);
      // and it is a real button that declares its menu
      const btn = page.locator(".dtm__resume");
      expect(await btn.evaluate((e) => e.tagName)).toBe("BUTTON");
      await expect(btn).toHaveAttribute("aria-haspopup", "menu");
      await expect(btn).toHaveAttribute("aria-expanded", "false");
    });
  }

  test("nobody without resume files gains a control", async ({ page }) => {
    await openProfile(page, "keto-kiladze");
    expect(await page.locator(".dtm__resume").count()).toBe(0);
    // and no empty action row is drawn in its place
    expect(await page.locator(".dtm__dossier .dtm__actions").count()).toBe(0);
  });

  test("the two who have files also still have their portfolio, and nobody has LinkedIn", async ({
    page,
  }) => {
    for (const [slug, r] of Object.entries(RESUMES)) {
      await openProfile(page, slug);
      await expect(page.locator(".dtm__portfolio")).toHaveCount(1);
      await expect(page.locator(".dtm__resume")).toHaveCount(1);
      // §11: no LinkedIn URL has been supplied for anyone
      expect(await page.locator(".dtm__linkedin").count(), slug).toBe(0);
      expect(Object.keys(r)).toEqual(["en", "es"]);
    }
  });
});

test.describe("B · the menu, and what each language maps to", () => {
  for (const [slug, files] of Object.entries(RESUMES)) {
    test(`${slug}: EN and ES each open their own document`, async ({ page }) => {
      for (const lang of ["en", "es"] as const) {
        await openProfile(page, slug);
        await openMenu(page);
        const items = page.locator(".dtm__resumemenu [role=menuitem]");
        await expect(items).toHaveCount(2);
        expect(
          await items.evaluateAll((els) => els.map((e) => (e.textContent || "").trim())),
        ).toEqual(["EN", "ES"]);

        await items.nth(lang === "en" ? 0 : 1).click();
        await expect(viewer(page)).toHaveCount(1);
        await expect(viewer(page).locator("iframe")).toHaveAttribute("src", files[lang]);
      }
    });
  }

  test("the menu is a menu, and closes on Escape and on an outside click", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    const btn = await openMenu(page);
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".dtm__resumemenu")).toHaveAttribute("role", "menu");

    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__resumemenu")).toHaveCount(0);
    // Escape closed the MENU and left the profile open behind it
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await expect(btn).toBeFocused();

    await openMenu(page);
    await page.locator(".dtm__dname").click();
    await expect(page.locator(".dtm__resumemenu")).toHaveCount(0);
  });

  test("the menu opens by keyboard and walks with the arrow keys", async ({ page }) => {
    await openProfile(page, "mariam-kandiashvili");
    await page.locator(".dtm__resume").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".dtm__resumemenu")).toHaveCount(1);
    // focus lands on the first item, and ArrowDown moves to the second
    await expect(page.locator("[role=menuitem]").first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("[role=menuitem]").nth(1)).toBeFocused();
    // and it wraps
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("[role=menuitem]").first()).toBeFocused();
  });
});

test.describe("C · the document opens inside the site", () => {
  test("choosing a language never navigates away", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    const before = page.url();
    const popups: string[] = [];
    page.on("popup", (p) => popups.push(p.url()));

    await openMenu(page);
    await page.locator("[role=menuitem]").first().click();
    await expect(viewer(page)).toHaveCount(1);

    // same page, no new tab, and the profile is still underneath
    expect(page.url()).toBe(before);
    expect(popups, "a new tab was opened").toEqual([]);
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
  });

  test("it is a labelled modal that names the person and the edition", async ({ page }) => {
    await openProfile(page, "mariam-kandiashvili");
    await openMenu(page);
    await page.locator("[role=menuitem]").nth(1).click();
    const d = viewer(page);
    await expect(d).toHaveAttribute("aria-modal", "true");
    const labelled = await d.getAttribute("aria-labelledby");
    expect(labelled).toBeTruthy();
    const title = await page.locator(`#${labelled}`).innerText();
    expect(title).toContain("MARIAM KANDIASHVILI");
    expect(title).toContain("ES");
  });

  test("the page behind does not scroll while it is open, and scrolls after", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    await openMenu(page);
    await page.locator("[role=menuitem]").first().click();
    await expect(viewer(page)).toHaveCount(1);
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .toBe("hidden");
    await page.locator(".dtr__close").click();
    await expect(viewer(page)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe("hidden");
  });

  test("Escape closes it and hands focus back to RESUME", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    await openMenu(page);
    await page.locator("[role=menuitem]").first().click();
    await expect(viewer(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(viewer(page)).toHaveCount(0);
    // the profile is still open behind it - Escape closed the document only
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await expect(page.locator(".dtm__resume")).toBeFocused();
  });

  test("every supplied document is actually served, as a PDF", async ({ page }) => {
    for (const files of Object.values(RESUMES)) {
      for (const src of Object.values(files)) {
        const res = await page.request.get(src);
        expect(res.status(), src).toBe(200);
        expect(res.headers()["content-type"], src).toContain("application/pdf");
        expect(Number(res.headers()["content-length"]), src).toBeGreaterThan(10_000);
      }
    }
  });
});

test.describe("D · the redesigned dossier", () => {
  test("carries the approved file furniture", async ({ page }) => {
    await openProfile(page, "beka-jokharidze");
    // the way out reads as words, and the roster position sits opposite it
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
    // the approved sheet is min(92vw,1180) x min(90vh,860)
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
    // 4 of 10, less the column gap
    expect(share).toBeGreaterThan(0.32);
    expect(share).toBeLessThan(0.44);
  });
});

test.describe("E · responsive and quiet", () => {
  for (const width of [1440, 1024, 768, 430, 390, 375, 320] as const) {
    test(`no horizontal overflow at ${width}, profile and open document`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openProfile(page, "beka-jokharidze");
      const over = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
      expect(await over(), `profile overflows at ${width}`).toBeLessThanOrEqual(1);

      await openMenu(page);
      await page.locator("[role=menuitem]").first().click();
      await expect(viewer(page)).toHaveCount(1);
      expect(await over(), `the document overflows at ${width}`).toBeLessThanOrEqual(1);
      const right = await viewer(page).evaluate((e) => Math.round(e.getBoundingClientRect().right));
      expect(right, `the document runs off the frame at ${width}`).toBeLessThanOrEqual(width + 1);
    });
  }

  test("the controls clear the touch floor on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page, "mariam-kandiashvili");
    for (const sel of [".dtm__portfolio", ".dtm__resume"]) {
      const h = await page
        .locator(sel)
        .evaluate((e) => Math.round(e.getBoundingClientRect().height));
      expect(h, sel).toBeGreaterThanOrEqual(44);
    }
    await openMenu(page);
    const items = await page
      .locator("[role=menuitem]")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    for (const h of items) expect(h).toBeGreaterThanOrEqual(44);
  });

  test("the profile and the document are quiet in the console, EN and KA", async ({ page }) => {
    const errs: string[] = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    for (const prefix of ["", "/ka"]) {
      await gotoRoute(page, `${prefix}/team?person=mariam-kandiashvili`);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await openMenu(page);
      await page.locator("[role=menuitem]").first().click();
      await expect(viewer(page)).toHaveCount(1);
      await page.keyboard.press("Escape");
    }
    expect(errs, errs.join("\n")).toEqual([]);
  });
});
