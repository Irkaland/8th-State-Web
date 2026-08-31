import { test, expect } from "@playwright/test";
import { expectNoSeriousA11y, gotoRoute } from "./helpers";

// /start-a-project - tactile production brief (4e) + v7 route coherence.
test.describe("Start a Project brief", () => {
  test("the four sheets render and selection draws the stroke", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/start a project/i);
    const film = page.getByRole("button", { name: "FILM & VIDEO" });
    await film.click();
    await expect(film).toHaveAttribute("aria-pressed", "true");
    await film.click();
    await expect(film).toHaveAttribute("aria-pressed", "false");
  });

  test("failed submission focuses the error summary; success shows the printed mark", async ({
    page,
  }) => {
    await gotoRoute(page, "/start-a-project");
    const send = page.getByRole("button", { name: /send the brief/i });
    await send.scrollIntoViewIfNeeded();
    await send.click();
    const alert = page.locator(".dbr__error");
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();

    await page.locator("#brief-name").fill("Nino Test");
    await page.locator("#brief-email").fill("nino@example.ge");
    await send.click();
    // The confirmation used to be a role="status" div whose title was a plain
    // span: it announced itself once and then offered nothing to navigate to.
    // It is a real heading now, and FOCUS is what announces it - which is also
    // what puts the reader at the top of the confirmation rather than leaving
    // them holding a submit button that has been unmounted.
    const done = page.getByRole("heading", { name: /brief received/i });
    await expect(done).toBeVisible();
    await expect(done).toBeFocused();
    // v7 5g: official mark printed on the confirmation sheet.
    await expect(page.locator(".dbr__successmark")).toBeVisible();
  });

  test("just-want-to-talk routes to /contact", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    await page.getByRole("link", { name: /contact the studio/i }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("no serious accessibility violations", async ({ page }) => {
    await gotoRoute(page, "/start-a-project");
    await page.waitForLoadState("load");
    await expectNoSeriousA11y(page, [".dao-chrome"]);
  });
});

// Route coherence - every destination renders the v7 design system.
test.describe("Route coherence", () => {
  const routes = [
    "/work",
    "/services",
    "/studio",
    "/studio-lab",
    "/process",
    "/georgia-production",
    "/contact",
    "/start-a-project",
    "/privacy",
    "/cookies",
    "/copyright",
    "/accessibility",
  ];

  for (const route of routes) {
    test(`${route} renders inside the DAO shell with no long dashes or overflow`, async ({
      page,
    }) => {
      await gotoRoute(page, route);
      await expect(page.locator(".dao").first()).toBeVisible();
      await expect(page.locator("header.site-header, .container-editorial")).toHaveCount(0);
      // v7 #14: no em/en dash renders anywhere.
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/[—–]/);
      // v7 #15: no unintended horizontal page scroll.
      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflowX).toBeLessThanOrEqual(1);
    });
  }

  test("KA equivalents resolve with mkhedruli type intact", async ({ page }) => {
    await gotoRoute(page, "/ka/studio-lab");
    await expect(page.locator(".dao").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("სტუდიო");
  });

  test("an invalid URL lands on the displaced-frame 404", async ({ page }) => {
    await gotoRoute(page, "/definitely-not-a-route");
    await expect(page.locator(".d404__code")).toHaveText("404");
    await expect(page.getByText(/not in the reel/i)).toBeVisible();
    await page.getByRole("link", { name: "WORK" }).click();
    await expect(page).toHaveURL(/\/work$/);
  });
});
