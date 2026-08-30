import { type Page, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Assert no serious/critical automated accessibility violations on the current page.
 * `exclude` is for regions where contrast is provided by imagery/gradients that axe cannot
 * measure (e.g. the homepage hero + transparent-over-hero header) - these are verified visually.
 */
export async function expectNoSeriousA11y(page: Page, exclude: string[] = []) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  for (const sel of exclude) builder = builder.exclude(sel);
  const results = await builder.analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  if (serious.length) {
    console.log(
      "A11y violations:",
      JSON.stringify(
        serious.map((v) => ({
          id: v.id,
          nodes: v.nodes.length,
          sample: v.nodes[0]?.html.slice(0, 100),
        })),
        null,
        2,
      ),
    );
  }
  expect(serious, serious.map((v) => v.id).join(", ")).toEqual([]);
}

/**
 * v7: the Studio Ident plays on every hard load on any route (no session
 * skip). Navigate, skip it with any input once hydrated, and wait for the
 * page beneath.
 */
export async function gotoRoute(page: Page, path: string) {
  await page.goto(path);
  const ident = page.locator(".dao-ident");
  try {
    await page.keyboard.press("Escape");
  } catch {
    /* pre-hydration keypress is fine to lose - the ident auto-advances */
  }
  await ident.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
}

/** Collect page console errors; returns a getter. */
export function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return () => errors;
}

/**
 * Wait until an element's box has stopped moving.
 *
 * The Team morph, and any other CSS transition the suite measures, finishes
 * when the geometry stops changing - not when an arbitrary number of
 * milliseconds has elapsed. A fixed wait encodes an assumption about how fast
 * the machine is: on a loaded box the transition is still interpolating when
 * the timer fires, and the test then measures a mid-flight frame and fails on
 * a contract the product actually honours. Both recorded morph flakes were
 * exactly that - a sheet 3px and 20px off its final centre, and one 4px past
 * the viewport bottom.
 *
 * Polling on "raf" evaluates once per animation frame, so this asks the real
 * question: has the box been identical for three consecutive frames? Under
 * contention it simply waits longer, which is the correct behaviour.
 *
 * This does NOT relax any assertion - it only makes the measurement happen at
 * the moment the product has actually settled.
 */
export async function settledBox(page: Page, selector: string, timeout = 15_000) {
  // a fresh run each time: the marker is per-page and would otherwise carry a
  // previous element's geometry into this wait
  await page.evaluate(() => {
    delete (window as unknown as { __settle?: unknown }).__settle;
  });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      // 1. no transition is still running on the element. Checking geometry
      //    alone is not enough: an ease with a slow start repeats the same
      //    ROUNDED box for several frames, which reads as 'settled' while the
      //    box is in fact at the very beginning of its travel.
      const running = el.getAnimations().filter((a) => a.playState === "running");
      if (running.length) return false;
      // 2. and the box has genuinely stopped moving. Six frames is ~100ms at
      //    60fps - long enough that a plateau inside a real transition cannot
      //    be mistaken for the end of one.
      const r = el.getBoundingClientRect();
      const key = [r.left, r.top, r.width, r.height].map((v) => Math.round(v)).join(",");
      const w = window as unknown as { __settle?: { key: string; n: number } };
      w.__settle =
        w.__settle && w.__settle.key === key ? { key, n: w.__settle.n + 1 } : { key, n: 0 };
      return w.__settle.n >= 6;
    },
    selector,
    { timeout, polling: "raf" },
  );
}
