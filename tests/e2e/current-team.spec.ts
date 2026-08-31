import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * The CURRENT TEAM on the page.
 *
 * The contact sheet was already built and is not changed by this work - what
 * changed is that it now carries thirteen real people instead of five unnamed
 * reserved seats. So this file deliberately does NOT re-test the morph, the
 * frame geometry or the dialog mechanics, which team-contact-sheet.spec.ts
 * already owns. It tests the things the real roster puts at risk:
 *
 *   - the count, the order and the identity of the thirteen
 *   - that every one of them is reachable, and reachable by URL
 *   - that EN and KA show the SAME thirteen people
 *   - that nobody has a broken portrait, at any width
 *   - that the studio's hiring list never reaches the page
 *   - that thirteen names and long Georgian roles do not overflow a phone
 *
 * Widths are swept by resizing ONE loaded page rather than by reloading at each
 * size: a spec that navigates dozens of times destabilises the whole suite, and
 * the layout being measured is a pure function of the viewport anyway.
 */

const PEOPLE = [
  ["mariam-kandiashvili", "Mariam Kandiashvili"],
  ["beka-jokharidze", "Beka Jokharidze"],
  ["david-gurgulia", "David Gurgulia"],
  ["beka-siradze", "Beka Siradze"],
  ["irakli-kalandadze", "Irakli Kalandadze"],
  ["nona-kandiashvili", "Nona Kandiashvili"],
  ["tea-kandiashvili", "Tea Kandiashvili"],
  ["vako-kvinikadze", "Vako Kvinikadze"],
  ["yuko-chubinidze", "Yuko Chubinidze"],
  ["luka-abazashvili", "Luka Abazashvili"],
  ["nutsa-revazishvili", "Nutsa Revazishvili"],
  ["lasha-bedianashvili", "Lasha Bedianashvili"],
  ["keto-kiladze", "Keto Kiladze"],
] as const;

/** The roles the studio has NOT filled. They are not people. */
const UNFILLED = [
  "Editor / Post-Production Artist",
  "Post-Production Artist",
  "Social Media Content Creator",
  "Sound Recordist",
  "Sound Designer",
  "Accountant",
  "Financial Administrator",
  "We're hiring",
  "We are hiring",
  "Open positions",
  "Join the team",
  "Coming soon",
];

const WIDTHS = [1440, 1024, 768, 560, 430, 390, 380, 375, 360, 320];

const slugs = (page: Page) =>
  page
    .locator(".dtm__person")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-dtm-card")));

/* ------------------------------------------------------ the thirteen ------ */

test.describe("the roster is the current team", () => {
  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: shows exactly thirteen people, in hierarchy order`, async ({ page }) => {
      await gotoRoute(page, `${base}/team`);
      await expect(page.locator(".dtm__person")).toHaveCount(13);
      expect(await slugs(page)).toEqual(PEOPLE.map(([slug]) => slug));
    });
  }

  test("EN and KA carry the same thirteen identities", async ({ page }) => {
    await gotoRoute(page, "/team");
    const en = await slugs(page);
    await gotoRoute(page, "/ka/team");
    const ka = await slugs(page);
    // the slug is the identity, so it is the same in both languages
    expect(ka).toEqual(en);
    expect(en).toHaveLength(13);
  });

  test("EN prints the English names, KA prints Georgian roles", async ({ page }) => {
    await gotoRoute(page, "/team");
    const enText = await page.locator(".dtm__sheet").innerText();
    for (const [, name] of PEOPLE) {
      expect(enText.toUpperCase(), name).toContain(name.toUpperCase());
    }
    await gotoRoute(page, "/ka/team");
    const kaRoles = await page
      .locator(".dtm__person .dtm__role")
      .evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    expect(kaRoles.length).toBeGreaterThanOrEqual(13);
    // every role that the source wrote in Georgian reads in Georgian here
    expect(kaRoles.filter((r) => /[Ⴀ-ჿ]/.test(r)).length).toBeGreaterThanOrEqual(12);
  });

  test("KA prints the Georgian names, not the English ones", async ({ page }) => {
    await gotoRoute(page, "/ka/team");
    const names = await page
      .locator(".dtm__pname")
      .evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
    expect(names).toHaveLength(13);
    // a Latin name left standing on /ka is the failure this catches
    for (const n of names) expect(n, n).toMatch(/^[Ⴀ-ჿ\s]+$/);
    // and the spellings are the owner's confirmed ones, not the ones the
    // written brief carried for these three
    expect(names[0]).toBe("მარიამ კანდიაშვილი");
    expect(names[5]).toBe("ნონა ყანდიშვილი");
    expect(names[11]).toBe("ლაშა ბედიანაშვილი");
  });

  test("numbers the roster 01 to 13, which is where the hierarchy shows", async ({ page }) => {
    await gotoRoute(page, "/team");
    const numbers = await page
      .locator(".dtm__pno")
      .evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
    expect(numbers).toEqual(Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, "0")));
  });
});

/* ------------------------------------------------------- reachability ----- */

test.describe("every person is reachable", () => {
  test("opens all thirteen profiles from the roster, one after another", async ({ page }) => {
    await gotoRoute(page, "/team");
    for (const [slug, name] of PEOPLE) {
      const card = page.locator(`[data-dtm-card="${slug}"]`);
      await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await card.click();
      const dialog = page.locator('.dtm__dossier [role="dialog"], .dtm__dossier');
      await expect(dialog.first()).toBeVisible();
      await expect(page.locator(".dtm__dname"), slug).toContainText(name);
      await page.keyboard.press("Escape");
      await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    }
  });

  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: every person's deep link is served without stripping the query`, async ({
      request,
    }) => {
      // the Phase 1 contract: a shared profile URL must not be redirected away
      // and must not lose ?person= on the way in
      for (const [slug] of PEOPLE) {
        const url = `${base}/team?person=${slug}`;
        const res = await request.get(url, { maxRedirects: 0 });
        expect(res.status(), url).toBe(200);
      }
    });
  }
});

/* ------------------------------------------------- representative profiles - */

test.describe("the representative profiles read correctly", () => {
  /* longest leadership roles, the hierarchy, a specialised production role, the
     editorial role, and the shortest support role */
  const SAMPLE = [
    ["mariam-kandiashvili", "Mariam Kandiashvili"],
    ["beka-jokharidze", "Beka Jokharidze"],
    ["nona-kandiashvili", "Nona Kandiashvili"],
    ["tea-kandiashvili", "Tea Kandiashvili"],
    ["keto-kiladze", "Keto Kiladze"],
  ] as const;

  for (const [slug, name] of SAMPLE) {
    test(`${slug} opens from a direct link with name, role and responsibilities`, async ({
      page,
    }) => {
      await gotoRoute(page, `/team?person=${slug}`);
      await expect(page.locator(".dtm__dossier")).toHaveCount(1);
      await expect(page.locator(".dtm__dname")).toContainText(name);
      // a primary role, and a responsibility line that is a real sentence
      await expect(page.locator(".dtm__dossier .dtm__role").first()).not.toBeEmpty();
      const statement = await page.locator(".dtm__statement").innerText();
      expect(statement.length, `${slug} responsibilities`).toBeGreaterThan(20);
      // the query survives, so the link is shareable
      expect(new URL(page.url()).searchParams.get("person")).toBe(slug);
      // and it never invents a block the person has no content for
      expect(await page.locator(".dtm__work").count()).toBe(0);
      expect(await page.locator(".dtm__awaiting").count()).toBe(0);
    });
  }

  test("the Georgian profile is Georgian, and keeps the /ka prefix", async ({ page }) => {
    await gotoRoute(page, "/ka/team?person=nona-kandiashvili");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    expect(new URL(page.url()).pathname).toBe("/ka/team");
    expect(await page.locator(".dtm__statement").innerText()).toMatch(/[Ⴀ-ჿ]/);
    // scoped to the file bar: the approved design also prints the department
    // on every roster card, so the bare class is no longer unique to the profile
    expect(await page.locator(".dtm__breadcrumb").innerText()).toMatch(/[Ⴀ-ჿ]/);
  });
});

/* ------------------------------------------------------------ portraits --- */

test.describe("no portrait exists yet, and nothing is broken by that", () => {
  test("renders no image element and no empty src in the roster", async ({ page }) => {
    await gotoRoute(page, "/team");
    const imgs = await page
      .locator(".dtm__sheet img")
      .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute("src") ?? ""));
    // nobody has a portrait, so there is no <img> at all - and certainly not one
    // pointing at a file that does not exist
    expect(imgs).toEqual([]);
  });

  test("draws the intentional image-less state on every frame", async ({ page }) => {
    await gotoRoute(page, "/team");
    await expect(page.locator(".dtm__frame")).toHaveCount(13);
    await expect(page.locator(".dtm__initials")).toHaveCount(13);
    const initials = await page
      .locator(".dtm__initials")
      .evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
    // real initials, not a dash: every seat is a named person now
    expect(initials).toEqual([
      "MK",
      "BJ",
      "DG",
      "BS",
      "IK",
      "NK",
      "TK",
      "VK",
      "YC",
      "LA",
      "NR",
      "LB",
      "KK",
    ]);
  });

  test("keeps the image-less state out of the accessibility tree", async ({ page }) => {
    await gotoRoute(page, "/team");
    // initials and the PENDING mark are decoration - a reader hears the name and
    // the role, never "MK" or "portrait pending"
    const exposed = await page
      .locator(".dtm__initials, .dtm__pendingmark")
      .evaluateAll((els) => els.filter((e) => e.getAttribute("aria-hidden") !== "true").length);
    expect(exposed).toBe(0);
    // and each control is still named by the person it opens
    const names = await page
      .locator(".dtm__person")
      .evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
    for (const [i, [, name]] of PEOPLE.entries()) {
      expect(names[i], name).toContain(name);
    }
  });
});

/* --------------------------------------------------------------- hiring --- */

test.describe("the hiring list never reaches the public page", () => {
  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: shows no vacancy, and no recruitment language`, async ({ page }) => {
      await gotoRoute(page, `${base}/team`);
      const text = (await page.locator("main, .dao-page").first().innerText()).toLowerCase();
      for (const phrase of UNFILLED) {
        expect(text, phrase).not.toContain(phrase.toLowerCase());
      }
      // and the roster is thirteen people - a vacancy cannot be hiding as a seat
      await expect(page.locator(".dtm__person")).toHaveCount(13);
    });
  }
});

/* ----------------------------------------------------------- responsive --- */

test.describe("thirteen people fit every width", () => {
  for (const [label, base] of [
    ["EN", ""],
    ["KA", "/ka"],
  ] as const) {
    test(`${label}: no horizontal overflow from 1440 down to 320`, async ({ page }) => {
      await gotoRoute(page, `${base}/team`);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(180);
        const m = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          widest: Math.max(
            0,
            ...[...document.querySelectorAll(".dtm__person, .dtm__pname, .dtm__role")].map((e) =>
              Math.ceil(e.getBoundingClientRect().right),
            ),
          ),
        }));
        // 1px of sub-pixel rounding is not an overflow
        expect(m.scrollW, `${label} ${width}: page scrolls sideways`).toBeLessThanOrEqual(
          m.clientW + 1,
        );
        expect(m.widest, `${label} ${width}: a card runs past the viewport`).toBeLessThanOrEqual(
          width + 1,
        );
      }
    });

    test(`${label}: every name and role stays inside its card, and all thirteen stay reachable`, async ({
      page,
    }) => {
      await gotoRoute(page, `${base}/team`);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(180);
        const m = await page.evaluate(() => {
          const cards = [...document.querySelectorAll(".dtm__person")];
          return {
            cards: cards.length,
            // a name or role wider than the card it sits in is a clipped label
            spills: cards.filter((c) => {
              const cb = c.getBoundingClientRect();
              return [...c.querySelectorAll(".dtm__pname, .dtm__role")].some(
                (t) => t.getBoundingClientRect().right > cb.right + 1,
              );
            }).length,
            // nothing is collapsed to nothing, so every control stays hittable
            unhittable: cards.filter((c) => {
              const b = c.getBoundingClientRect();
              return b.width < 40 || b.height < 40;
            }).length,
          };
        });
        expect(m.cards, `${label} ${width}`).toBe(13);
        expect(m.spills, `${label} ${width}: clipped name or role`).toBe(0);
        expect(m.unhittable, `${label} ${width}: card too small to hit`).toBe(0);
      }
    });
  }

  test("has no 381 -> 380 discontinuity with the real roster", async ({ page }) => {
    await gotoRoute(page, "/team");
    const at = async (width: number) => {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      return page.evaluate(() => {
        const c = document.querySelector(".dtm__person")!.getBoundingClientRect();
        return { w: Math.round(c.width), h: Math.round(c.height) };
      });
    };
    const a = await at(381);
    const b = await at(380);
    // the Phase 5 fix: crossing 380 is a continuous step, not a jump
    expect(Math.abs(a.w - b.w), "card width jumps at 380").toBeLessThan(24);
    expect(Math.abs(a.h - b.h), "card height jumps at 380").toBeLessThan(40);
  });
});

/* ------------------------------------------------------------- keyboard --- */

test.describe("the keyboard lifecycle survives the real roster", () => {
  test("opens a profile with the keyboard and gives focus back on Escape", async ({ page }) => {
    await gotoRoute(page, "/team");
    const card = page.locator('[data-dtm-card="tea-kandiashvili"]');
    await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await card.focus();
    await expect(card).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator(".dtm__dossier")).toHaveCount(1);
    await expect(page.locator(".dtm__dname")).toContainText("Tea Kandiashvili");

    // focus is inside the sheet, not left behind on the roster
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest(".dtm__dossier, .dtm__stage"),
    );
    expect(inside, "focus did not move into the profile").toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator(".dtm__dossier")).toHaveCount(0);
    // and it comes back to the card it came from
    await expect(card).toBeFocused();
  });

  test("names every control by the person it opens", async ({ page }) => {
    await gotoRoute(page, "/team");
    const cards = page.locator(".dtm__person");
    await expect(cards).toHaveCount(13);
    for (const [i, [, name]] of PEOPLE.entries()) {
      // the accessible name comes from the card's own text, which starts with
      // the number and then the person - so the name has to be in there
      const text = await cards.nth(i).innerText();
      expect(text, name).toContain(name);
    }
  });

  test("the dialog is labelled by the person's visible name", async ({ page }) => {
    /**
     * SUPERSEDES an aria-label built from the name and the department.
     *
     * A dialog should be labelled BY the heading a sighted reader sees, so the
     * two cannot drift apart when the copy changes - which is what
     * aria-labelledby gives and a manufactured string does not. The department
     * is still stated, in the file bar, where it is read in document order
     * rather than folded into the dialog's name.
     */
    await gotoRoute(page, "/team?person=keto-kiladze");
    // the chrome menu is a dialog too, so this is scoped to the team sheet
    const dialog = page.locator('.dtm__sheet [role="dialog"]');
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    const labelledby = await dialog.getAttribute("aria-labelledby");
    expect(labelledby, "labelled by an element, not by a string").toBeTruthy();
    const heading = page.locator(`#${labelledby}`);
    await expect(heading).toHaveCount(1);
    expect(await heading.innerText()).toContain("Keto Kiladze");
    // and the department is still on the sheet, in its own line
    expect(await page.locator(".dtm__breadcrumb").innerText()).toMatch(/STUDIO SUPPORT/i);
  });
});
