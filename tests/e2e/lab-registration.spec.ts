import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE STUDIO LAB REGISTRATION FILE.
 *
 * One file, opened from six places, always turned to the right course. What is
 * asserted here is the part a visitor depends on and a refactor can silently
 * break: that the control is a real button rather than something nested in a
 * link, that the course travels with the request, that a half-filled file is
 * refused, and that the dialog can be opened and left by keyboard alone.
 *
 * The four course slugs, in printed order.
 */
const COURSES = ["photography", "art", "portfolio", "film"] as const;

/** the approved eight, in order - section 10 prints these and the file asks them */
const FIELDS = [
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Preferred contact method",
  "Language preference",
  "Course",
  "A short note",
];

/**
 * The registration file specifically.
 *
 * Scoped to .dlr__sheet rather than [role="dialog"]: the site chrome keeps its
 * burger navigation in the DOM as a second, inert dialog on every route, so a
 * bare role selector matches two elements and resolves to the wrong one.
 */
const dialog = (page: Page) => page.locator('.dlr__sheet[role="dialog"]');

async function openFrom(page: Page, index: number) {
  const btn = page.locator(".dsl__prreg").nth(index);
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(dialog(page)).toBeVisible();
}

test.describe("A · the routes still stand", () => {
  test("the Lab index renders its eleven sections", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
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
      await expect(page.locator(`#${id}`), `#${id} missing`).toHaveCount(1);
    }
  });

  test("all four course sheets resolve, in both locales", async ({ page }) => {
    for (const slug of COURSES) {
      for (const prefix of ["", "/ka"]) {
        const res = await page.request.get(`${prefix}/studio-lab/${slug}`);
        expect(res.status(), `${prefix}/studio-lab/${slug}`).toBe(200);
      }
    }
  });

  test("the current programme lists exactly the four courses", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await expect(page.locator(".dsl__prow")).toHaveCount(4);
    const titles = await page
      .locator(".dsl__prtitle")
      .evaluateAll((els) => els.map((e) => (e.textContent || "").trim()));
    expect(titles).toEqual([
      "Photography: Theory & Practice",
      "Art Course",
      "Portfolio Creation",
      "History of Cinema",
    ]);
  });
});

test.describe("B · the register control is a control", () => {
  /**
   * The approved design nests the REGISTER cell inside the row's own anchor.
   * That is the one thing not translated literally: a control inside a link is
   * unreachable by keyboard and announced as part of the link's name. The row
   * carries two destinations and now says so with two elements.
   */
  test("REGISTER is a button, and never sits inside a link", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const regs = page.locator(".dsl__prreg");
    await expect(regs).toHaveCount(4);
    const shape = await regs.evaluateAll((els) =>
      els.map((e) => ({ tag: e.tagName, inLink: !!e.closest("a") })),
    );
    for (const s of shape) {
      expect(s.tag).toBe("BUTTON");
      expect(s.inLink, "a REGISTER control is nested inside an anchor").toBe(false);
    }
    // and the course name beside it is still the link to its sheet
    const hrefs = await page
      .locator(".dsl__prtitle")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual(COURSES.map((s) => `/studio-lab/${s}`));
  });

  test("every REGISTER opens the file already turned to its own course", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const expected = [
      "Photography: Theory & Practice",
      "Art Course",
      "Portfolio Creation",
      "History of Cinema",
    ];
    for (let i = 0; i < expected.length; i += 1) {
      await openFrom(page, i);
      await expect(dialog(page).locator(".dlr__course")).toHaveText(expected[i]!);
      // the selector agrees with the printed name
      await expect(dialog(page).locator("select")).toHaveValue(COURSES[i]!);
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toHaveCount(0);
    }
  });

  test("a course sheet opens the file for that sheet's course", async ({ page }) => {
    await gotoRoute(page, "/studio-lab/portfolio");
    await page.locator(".dsl__cta").first().click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).locator("select")).toHaveValue("portfolio");
  });

  test("the hero and section 10 open the file with no course chosen yet", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await page.locator(".dsl__cta").first().click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).locator("select")).toHaveValue("");
  });
});

test.describe("C · the file asks what the page promises", () => {
  test("section 10 prints the approved eight fields", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const printed = await page
      .locator(".dsl__regfields li")
      .evaluateAll((els) => els.map((e) => (e.textContent || "").trim()));
    expect(printed).toHaveLength(8);
    for (const [i, f] of FIELDS.entries()) expect(printed[i]).toContain(f);
    // the superseded nine-field sheet is gone
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Experience level");
    expect(body).not.toContain("Desired format");
  });

  test("the dialog renders every required control", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 0);
    const d = dialog(page);
    await expect(d.locator("select")).toHaveCount(1);
    await expect(
      d.locator('input[type="text"], input[type="email"], input[type="tel"]'),
    ).toHaveCount(4);
    // 05 and 06 are radio groups: 3 contact methods + 2 languages
    await expect(d.locator('input[type="radio"]')).toHaveCount(5);
    await expect(d.locator("textarea")).toHaveCount(1);
    await expect(d.locator('input[type="checkbox"]')).toHaveCount(1);
  });
});

test.describe("D · validation and the states after it", () => {
  test("an incomplete file is refused, and says so in an alert", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 0);
    await dialog(page).locator("button[type=submit]").click();
    await expect(dialog(page).locator('[role="alert"]')).toBeVisible();
    // nothing was accepted
    await expect(dialog(page).locator(".dlr__donetitle")).toHaveCount(0);
  });

  test("a complete file is accepted and confirms without claiming delivery", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 2);
    const d = dialog(page);
    await d.locator('input[autocomplete="given-name"]').fill("Nino");
    await d.locator('input[autocomplete="family-name"]').fill("Beridze");
    await d.locator('input[type="email"]').fill("nino@example.com");
    await d.locator('input[type="tel"]').fill("+995 555 000 000");
    // the radio is dressed as a stamp and the label is what a reader clicks,
    // so the test clicks the same thing rather than forcing the hidden input
    await d.locator(".dlr__opt", { hasText: /^EMAIL$/ }).click();
    await d.locator(".dlr__opt", { hasText: /^GEORGIAN$/ }).click();
    await expect(d.getByRole("radio", { name: "EMAIL", exact: true })).toBeChecked();
    await expect(d.getByRole("radio", { name: "GEORGIAN", exact: true })).toBeChecked();
    await d.locator('input[type="checkbox"]').check();
    await d.locator("button[type=submit]").click();

    await expect(d.locator(".dlr__donetitle")).toBeVisible();
    await expect(d.locator('[role="alert"]')).toHaveCount(0);
    // §G: no backend exists, so the confirmation must not say the file was sent
    const copy = (await d.locator(".dlr__donecopy").innerText()).toLowerCase();
    expect(copy).not.toMatch(/\bsent\b|\bdelivered\b/);
  });

  test("the file keeps what was typed when a required answer is missing", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 0);
    const d = dialog(page);
    await d.locator('input[autocomplete="given-name"]').fill("Nino");
    await d.locator("button[type=submit]").click();
    await expect(d.locator('[role="alert"]')).toBeVisible();
    await expect(d.locator('input[autocomplete="given-name"]')).toHaveValue("Nino");
  });
});

test.describe("E · dialog semantics and keyboard", () => {
  test("it is a labelled modal dialog that Escape closes", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 1);
    const d = dialog(page);
    await expect(d).toHaveAttribute("aria-modal", "true");
    const labelled = await d.getAttribute("aria-labelledby");
    expect(labelled).toBeTruthy();
    await expect(page.locator(`#${labelled}`)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("the page behind does not scroll while the file is open, and scrolls after", async ({
    page,
  }) => {
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 0);
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .toBe("hidden");
    await page.keyboard.press("Escape");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe("hidden");
  });

  test("focus enters the file, and returns to whatever opened it", async ({ page }) => {
    await gotoRoute(page, "/studio-lab");
    const btn = page.locator(".dsl__prreg").first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement?.classList.contains("dsl__prreg") ?? false),
      )
      .toBe(true);
  });

  test("the four REGISTER controls clear the touch floor on a phone", async ({ page }) => {
    // they were cells inside the row s link and inherited its height; as real
    // buttons they have to carry their own target
    await page.setViewportSize({ width: 390, height: 800 });
    await gotoRoute(page, "/studio-lab");
    const heights = await page
      .locator(".dsl__prreg")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(heights).toHaveLength(4);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });

  test("every control in the file clears the touch floor", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await gotoRoute(page, "/studio-lab");
    await openFrom(page, 0);
    const heights = await dialog(page)
      .locator("button, select, input[type=text], input[type=email], input[type=tel], .dlr__opt")
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThan(6);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });
});

test.describe("F · responsive and quiet", () => {
  for (const width of [1440, 1280, 1024, 768, 430, 390, 375, 320] as const) {
    test(`no horizontal overflow at ${width}, page and open file`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoRoute(page, "/studio-lab");
      const over = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
      expect(await over(), `page overflows at ${width}`).toBeLessThanOrEqual(1);
      await openFrom(page, 0);
      expect(await over(), `the open file overflows at ${width}`).toBeLessThanOrEqual(1);
      // and the file itself stays inside the frame
      const right = await dialog(page).evaluate((e) => Math.round(e.getBoundingClientRect().right));
      expect(right, `the file runs off the frame at ${width}`).toBeLessThanOrEqual(width + 1);
    });
  }

  test("the Lab and a course sheet are quiet in the console, EN and KA", async ({ page }) => {
    const errs: string[] = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    for (const route of ["/studio-lab", "/studio-lab/photography", "/ka/studio-lab"]) {
      await gotoRoute(page, route);
    }
    await openFrom(page, 0);
    expect(errs, errs.join("\n")).toEqual([]);
  });
});
