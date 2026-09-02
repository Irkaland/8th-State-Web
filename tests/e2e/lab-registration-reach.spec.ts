import { test, expect, type Page } from "@playwright/test";
import { gotoRoute } from "./helpers";

/**
 * THE REGISTRATION FILE IS REACHABLE TO ITS LAST CONTROL.
 *
 * The defect this covers: the file's two fixed layers were laid out with
 * `inset: 0`, which on a phone is the LAYOUT viewport - taller than the glass.
 * The scroll container therefore ended *below* the visible rectangle, so the
 * end of the form (the two required choice rows, the consent line and
 * REGISTER) sat under Safari's toolbar with no scroll position that could
 * bring it up, and under the whole keyboard once a field was focused. Both
 * layers are now sized from the visible rectangle, which the provider reports
 * through --dlr-vh / --dlr-vtop from window.visualViewport.
 *
 * What is asserted here is the reader's actual requirement rather than the
 * mechanism: at every width and at heights a real phone actually shows, every
 * control in the file can be brought fully inside the scrolling surface AND is
 * hit-testable there - nothing is behind chrome, a footer or another layer.
 */

const dialog = (page: Page) => page.locator('.dlr__sheet[role="dialog"]');

/**
 * Every control between opening the file and pressing REGISTER, in reading
 * order. `.dlr__opt` covers both required choice rows - the contact method and
 * the language - which is the section the reader reported losing.
 */
const CONTROLS = [
  "select.dlr__input",
  'input[autocomplete="given-name"]',
  'input[autocomplete="family-name"]',
  'input[autocomplete="email"]',
  'input[autocomplete="tel"]',
  ".dlr__opt",
  ".dlr__textarea",
  ".dlr__check",
  ".dlr__submit",
] as const;

async function openFile(page: Page) {
  const btn = page.locator(".dsl__prreg").first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(dialog(page)).toBeVisible();
}

/**
 * Scroll each control into the surface and report whether it landed fully
 * inside it and whether the surface is what the reader would actually touch at
 * that point. Done in one page call so a wide matrix stays quick.
 */
async function reachAll(page: Page, selectors: readonly string[]) {
  return page.evaluate(async (sels) => {
    const scroller = document.querySelector(".dlr__sheetwrap") as HTMLElement;
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    const out: { sel: string; inside: boolean; hit: boolean; h: number; box: string }[] = [];
    for (const sel of sels) {
      for (const el of Array.from(document.querySelectorAll(sel)) as HTMLElement[]) {
        // scroll the surface by hand rather than through scrollIntoView: this
        // is what a drag does, it is the same in every engine, and it asks the
        // real question - is there a scroll position at which this control is
        // fully on screen?
        const s0 = scroller.getBoundingClientRect();
        const r0 = el.getBoundingClientRect();
        const delta = r0.top + r0.height / 2 - (s0.top + s0.height / 2);
        const max = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = Math.max(0, Math.min(max, scroller.scrollTop + delta));
        await frame();
        await frame();
        const r = el.getBoundingClientRect();
        const s = scroller.getBoundingClientRect();
        const at = document.elementFromPoint(
          Math.round(r.left + r.width / 2),
          Math.round(r.top + r.height / 2),
        );
        out.push({
          sel,
          h: Math.round(r.height),
          // reported so a failure says where the control actually landed
          box: `top ${Math.round(r.top)} / bottom ${Math.round(r.bottom)} in surface ${Math.round(s.top)}-${Math.round(s.bottom)}, scrollTop ${Math.round(scroller.scrollTop)}`,
          inside: r.top >= s.top - 1 && r.bottom <= s.bottom + 1,
          // the visually hidden radio inside a chip is never the hit target -
          // its own label is, which is the thing a finger lands on
          hit: !!at && (at === el || el.contains(at) || (at as HTMLElement).contains(el)),
        });
      }
    }
    return out;
  }, selectors);
}

/** the end of the scroll: where REGISTER lives when the reader has finished */
async function submitAtScrollEnd(page: Page) {
  return page.evaluate(async () => {
    const scroller = document.querySelector(".dlr__sheetwrap") as HTMLElement;
    scroller.scrollTop = scroller.scrollHeight;
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const b = document.querySelector(".dlr__submit") as HTMLElement;
    const r = b.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    const at = document.elementFromPoint(
      Math.round(r.left + r.width / 2),
      Math.round(r.top + r.height / 2),
    );
    return {
      inside: r.top >= s.top - 1 && r.bottom <= s.bottom + 1,
      hit: !!at && (at === b || b.contains(at)),
      height: Math.round(r.height),
    };
  });
}

/**
 * Heights are the rectangle a real device actually leaves for the page, not a
 * generous test default: 900px tall viewports are exactly why this never
 * showed up in the suite before.
 */
const MATRIX = [
  { w: 320, h: 568, label: "iPhone SE" },
  { w: 375, h: 667, label: "iPhone 8" },
  { w: 390, h: 664, label: "iPhone 14, toolbars showing" },
  { w: 393, h: 727, label: "Pixel 7" },
  { w: 430, h: 760, label: "iPhone 15 Pro Max" },
  { w: 768, h: 600, label: "tablet portrait" },
  { w: 820, h: 640, label: "tablet" },
  { w: 1024, h: 600, label: "small laptop" },
  { w: 1280, h: 720, label: "desktop" },
  { w: 1440, h: 760, label: "wide desktop" },
] as const;

test.describe("the registration file is reachable to its last control", () => {
  for (const { w, h, label } of MATRIX) {
    test(`${w}x${h} (${label}): every control reachable, REGISTER hit-testable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoRoute(page, "/studio-lab");
      await openFile(page);

      // the surface is the VISIBLE rectangle, which is what makes the rest of
      // this test possible at all
      const surface = await page.evaluate(() => {
        const s = document.querySelector(".dlr__sheetwrap") as HTMLElement;
        const r = s.getBoundingClientRect();
        return {
          height: Math.round(r.height),
          visible: Math.round(window.visualViewport?.height ?? window.innerHeight),
          scrollable: s.scrollHeight - s.clientHeight,
          // Safari only learned overscroll-behavior in 16, and the engine this
          // suite drives may predate that: the declaration is still correct,
          // it simply cannot be read back here.
          overscroll: CSS.supports("overscroll-behavior-y", "contain")
            ? getComputedStyle(s).getPropertyValue("overscroll-behavior-y")
            : "unsupported",
        };
      });
      expect(
        Math.abs(surface.height - surface.visible),
        "the file is sized to the glass",
      ).toBeLessThanOrEqual(1);
      if (surface.overscroll !== "unsupported") {
        expect(surface.overscroll, "a fling must not chain to the page behind").toBe("contain");
      }

      const reached = await reachAll(page, CONTROLS);
      expect(reached.length).toBeGreaterThan(10);
      for (const r of reached) {
        expect(
          r.inside,
          `${r.sel} cannot be scrolled fully into the file at ${w}x${h} - ${r.box}`,
        ).toBe(true);
        expect(r.hit, `${r.sel} is covered by something at ${w}x${h}`).toBe(true);
      }

      const end = await submitAtScrollEnd(page);
      expect(end.inside, `REGISTER is off the surface at the end of the scroll at ${w}x${h}`).toBe(
        true,
      );
      expect(end.hit, `REGISTER is covered at ${w}x${h}`).toBe(true);
      expect(end.height, "REGISTER keeps its touch target").toBeGreaterThanOrEqual(44);

      // and none of this is bought with sideways scrolling
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over, `the open file overflows sideways at ${w}x${h}`).toBeLessThanOrEqual(1);
    });
  }

  /**
   * THE KEYBOARD CASE.
   *
   * Playwright cannot raise a device keyboard, and a virtual keyboard is not
   * a viewport resize - on iOS it leaves the layout viewport alone and only
   * shrinks the VISUAL one. That shrink reaches the CSS through exactly one
   * value, --dlr-vh, which the provider writes from visualViewport; driving
   * that value directly is therefore the same input the real keyboard
   * produces. Before the fix the surface ignored it and stayed the height of
   * the layout viewport, which is precisely why half the form was unreachable
   * with the keyboard up.
   */
  test("with the keyboard up, the choices and REGISTER are still reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await gotoRoute(page, "/studio-lab");
    await openFile(page);

    await page.locator('input[autocomplete="email"]').focus();
    // ~300px is what an iPhone keyboard leaves of a 664px glass
    await page.evaluate(() => {
      (document.querySelector(".dlr") as HTMLElement).style.setProperty("--dlr-vh", "300px");
    });
    const height = await page.evaluate(() =>
      Math.round(document.querySelector(".dlr__sheetwrap")!.getBoundingClientRect().height),
    );
    expect(height, "the surface must follow the visible rectangle").toBe(300);

    for (const r of await reachAll(page, CONTROLS)) {
      expect(r.inside, `${r.sel} is unreachable with the keyboard up - ${r.box}`).toBe(true);
      expect(r.hit, `${r.sel} is covered with the keyboard up`).toBe(true);
    }
    const end = await submitAtScrollEnd(page);
    expect(end.inside, "REGISTER is unreachable with the keyboard up").toBe(true);
    expect(end.hit, "REGISTER is covered with the keyboard up").toBe(true);
  });

  /**
   * The gutter around the sheet used to be a dead zone: the scroll container
   * had pointer-events: none so a drag there hit the scrim, which scrolls
   * nothing. It is the scroll surface now - and still the click-outside
   * target.
   */
  test("dragging beside the sheet scrolls the file, and a click there closes it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await gotoRoute(page, "/studio-lab");
    await openFile(page);

    const gutter = await page.evaluate(() => {
      const sheet = document.querySelector(".dlr__sheet")!.getBoundingClientRect();
      const y = Math.round(sheet.top + 40);
      const at = document.elementFromPoint(4, y) as HTMLElement | null;
      let scroller: string | null = null;
      for (let n = at; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (n.scrollHeight - n.clientHeight > 2 && /auto|scroll/.test(cs.overflowY)) {
          scroller = n.className;
          break;
        }
      }
      return { at: at?.className ?? null, scroller, y };
    });
    expect(gutter.scroller, "a drag beside the sheet must scroll the file").toContain(
      "dlr__sheetwrap",
    );

    await page.mouse.click(4, gutter.y);
    await expect(dialog(page)).toHaveCount(0);
  });

  test("REGISTER is reachable by keyboard from the last text field", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await gotoRoute(page, "/studio-lab");
    await openFile(page);

    await page.locator(".dlr__textarea").focus();
    let onSubmit = false;
    for (let i = 0; i < 6 && !onSubmit; i++) {
      await page.keyboard.press("Tab");
      onSubmit = await page.evaluate(
        () => document.activeElement?.classList.contains("dlr__submit") ?? false,
      );
    }
    expect(onSubmit, "REGISTER must be a few tabs from the note field").toBe(true);
  });

  test("the file is quiet in the console while it is opened and scrolled", async ({ page }) => {
    const errs: string[] = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    await page.setViewportSize({ width: 390, height: 664 });
    await gotoRoute(page, "/studio-lab");
    await openFile(page);
    await reachAll(page, CONTROLS);
    await submitAtScrollEnd(page);
    expect(errs, errs.join("\n")).toEqual([]);
  });
});
