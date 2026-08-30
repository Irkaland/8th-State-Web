import { expect, test, type Page } from "@playwright/test";

/**
 * §P0 BURGER KEYBOARD ACCESS.
 *
 * The burger sheet is the site's only global navigation, and it was
 * keyboard-inoperable in its default state on every route: the focus trap
 * collected candidates and filtered them on `offsetParent !== null`, which does
 * not exclude `inert`. The five collapsed Work category links therefore stayed
 * in the trap's list, Tab was preventDefault()ed, `.focus()` on an inert element
 * is a silent no-op, and focus never left the WORK link.
 *
 * There was no test for Tab. Open, close, Escape and focus-return were all
 * covered - the one interaction that was broken was the one nobody asserted.
 */

/** the ident plays over the requested route; wait for it to leave */
async function settle(page: Page) {
  await page
    .waitForFunction(() => !document.documentElement.hasAttribute("data-dao-ident"), null, {
      timeout: 20_000,
    })
    .catch(() => {});
  await expect(page.locator(".dao-ident")).toHaveCount(0, { timeout: 20_000 });
}

/** a stable label for whatever currently has focus */
function active(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "(body)";
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    return (el.getAttribute("aria-label") || text || el.tagName).slice(0, 28);
  });
}

/** open the sheet the way a keyboard visitor does: focus the burger, press Enter */
async function openByKeyboard(page: Page) {
  await page.mouse.move(300, 400); // reveal the chrome from its idle state
  await page.locator(".dao-burger").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".dao-nav.is-open")).toHaveCount(1);
}

for (const [label, home] of [
  ["EN", "/"],
  ["KA", "/ka"],
] as const) {
  test.describe(`§P0 burger keyboard - ${label}`, () => {
    test(`${label}: opens from the keyboard and lands on the first destination`, async ({
      page,
    }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);
      await expect(page.locator("#dao-nav")).toHaveAttribute("aria-modal", "true");
      // focus goes to the first destination, not the numeral toggle
      await expect(page.locator(".dao-nav__link").first()).toBeFocused();
    });

    test(`${label}: Tab moves through the real destinations and never sticks`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);

      const seen: string[] = [active(page) === undefined ? "" : await active(page)];
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press("Tab");
        seen.push(await active(page));
      }

      // THE REGRESSION: every entry used to be "WORK".
      const unique = new Set(seen);
      expect(
        unique.size,
        `focus never moved - it stayed on ${[...unique].join(", ")}`,
      ).toBeGreaterThan(5);

      // no two consecutive presses may leave focus where it was
      for (let i = 1; i < seen.length; i += 1) {
        expect(seen[i], `Tab ${i} did not move focus off ${seen[i - 1]}`).not.toBe(seen[i - 1]);
      }
    });

    test(`${label}: collapsed Work categories are skipped, expanded ones are reachable`, async ({
      page,
    }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);

      // collapsed: the container is inert and its links are out of the tab order
      await expect(page.locator(".dao-nav__cats")).toHaveAttribute("inert", "");
      const catHrefs = await page
        .locator(".dao-nav__cats a")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      expect(catHrefs.length, "the category links exist in the DOM").toBe(5);

      const reachedWhileCollapsed: string[] = [];
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press("Tab");
        reachedWhileCollapsed.push(
          await page.evaluate(() => document.activeElement?.getAttribute("href") ?? ""),
        );
      }
      for (const href of catHrefs) {
        // "/work" is also the WORK destination itself, so only the filtered
        // category hrefs prove inertness
        if (href === "/work" || href === "/ka/work") continue;
        expect(reachedWhileCollapsed, `${href} was reachable while inert`).not.toContain(href);
      }

      // expand via the numeral toggle, then the same links ARE reachable
      await page.locator(".dao-nav__num--toggle").click();
      await expect(page.locator(".dao-nav__cats")).not.toHaveAttribute("inert", "");
      await page.locator(".dao-nav__link").first().focus();
      const reachedWhileOpen: string[] = [];
      for (let i = 0; i < 6; i += 1) {
        await page.keyboard.press("Tab");
        reachedWhileOpen.push(
          await page.evaluate(() => document.activeElement?.getAttribute("href") ?? ""),
        );
      }
      const filtered = catHrefs.filter((h) => h.includes("?category="));
      expect(filtered.length).toBeGreaterThan(0);
      for (const href of filtered) {
        expect(reachedWhileOpen, `${href} unreachable when expanded`).toContain(href);
      }
    });

    test(`${label}: Shift+Tab moves backwards`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);

      const back: string[] = [];
      for (let i = 0; i < 4; i += 1) {
        await page.keyboard.press("Shift+Tab");
        back.push(await active(page));
      }
      expect(new Set(back).size, `Shift+Tab stuck on ${back.join(", ")}`).toBeGreaterThan(2);
      for (let i = 1; i < back.length; i += 1) {
        expect(back[i]).not.toBe(back[i - 1]);
      }
    });

    test(`${label}: the locale switcher stays inside the trap`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);
      // Shift+Tab from the first destination reaches the toggle, then the
      // burger, then the two switcher links - §01 keeps them reachable.
      // Asserted structurally rather than by label text: the aria-labels are
      // localised, so matching English copy would fail on /ka for the wrong
      // reason.
      let reachedSwitcher = false;
      for (let i = 0; i < 6 && !reachedSwitcher; i += 1) {
        await page.keyboard.press("Shift+Tab");
        reachedSwitcher = await page.evaluate(
          () => document.activeElement?.closest(".dao-chrome .dao-lang") !== null,
        );
      }
      expect(reachedSwitcher, "the EN/KA switcher was not reachable inside the trap").toBe(true);
    });

    test(`${label}: Tab cycles rather than escaping the sheet`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);
      // walk well past the end of the list; focus must stay on real controls
      for (let i = 0; i < 24; i += 1) await page.keyboard.press("Tab");
      const inTrap = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        return Boolean(el.closest("#dao-nav") || el.closest(".dao-chrome"));
      });
      expect(inTrap, "focus left the sheet and the chrome").toBe(true);
    });

    test(`${label}: Escape closes and returns focus to the burger`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);
      await page.keyboard.press("Escape");
      await expect(page.locator(".dao-nav.is-open")).toHaveCount(0);
      await expect(page.locator(".dao-burger")).toBeFocused();
      await expect(page.locator(".dao-burger")).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#dao-nav")).toHaveAttribute("aria-hidden", "true");
    });

    test(`${label}: a destination can actually be activated by keyboard`, async ({ page }) => {
      await page.goto(home);
      await settle(page);
      await openByKeyboard(page);
      // Tab to SERVICES and press Enter - the whole point of the trap working
      let guard = 0;
      while (guard < 20) {
        const href = await page.evaluate(() => document.activeElement?.getAttribute("href") ?? "");
        if (href.endsWith("/services")) break;
        await page.keyboard.press("Tab");
        guard += 1;
      }
      expect(guard, "never reached SERVICES by keyboard").toBeLessThan(20);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${label === "KA" ? "/ka" : ""}/services$`));
    });
  });
}

test.describe("§P0 burger keyboard - deep route", () => {
  test("the trap works on a deep route too, not only Home", async ({ page }) => {
    await page.goto("/studio");
    await settle(page);
    await openByKeyboard(page);
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      seen.push(await active(page));
    }
    expect(new Set(seen).size).toBeGreaterThan(3);
  });
});
