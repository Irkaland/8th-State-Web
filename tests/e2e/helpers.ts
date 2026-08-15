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
