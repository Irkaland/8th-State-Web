import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // §02 refresh contract: real document loads of deep routes redirect to
    // the locale home. Suites need to render deep routes directly, so every
    // request carries the bypass header; the dedicated refresh tests
    // override this with an empty header set to act like a real browser.
    extraHTTPHeaders: { "x-dao-hard-load": "allow" },
  },
  projects: [
    {
      name: "chromium",
      // The mobile lifecycle suite has to run WITHOUT the autoplay override
      // below and on real device profiles, so it gets its own projects.
      testIgnore: /mobile-lifecycle.spec.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        // The showreel is a muted inline autoplay hero. Headless Chrome
        // still applies the gesture requirement to some media paths, so the
        // reel specs would fail for reasons a real browser never hits.
        launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
      },
    },
    // §10-§12/§22: the reel autoplay fix is a MOBILE fix, and the whole point
    // is that it works under the real autoplay policy. These two projects
    // deliberately omit --autoplay-policy=no-user-gesture-required - with the
    // override in place the bug is unreproducible and the test is theatre -
    // and they run on touch device profiles so the §03 chrome behaviour and
    // the §14 locale handoff are exercised the way a phone exercises them.
    {
      name: "mobile-safari",
      testMatch: /mobile-lifecycle.spec.ts/,
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-chrome",
      testMatch: /mobile-lifecycle.spec.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
