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
    // §P0: there is no bypass header any more. Every request in the suite is
    // now shaped exactly like a real browser's, because a deep route resolves
    // itself for everyone - the former `x-dao-hard-load: allow` existed only to
    // opt tests out of a redirect that no longer exists. Removing it means the
    // suite finally exercises production's real routing behaviour, which is
    // what let the deep-route, 404 and ?person= defects ship unnoticed.
  },
  projects: [
    {
      name: "chromium",
      // The mobile lifecycle suite has to run WITHOUT the autoplay override
      // below and on real device profiles, so it gets its own projects, and
      // webkit-journeys goes with them: it taps, it reads the phone
      // composition, and its comments claim things about WebKit that a
      // desktop Chromium run would not be testing.
      testIgnore: /(?:mobile-lifecycle|webkit-journeys).spec.ts/,
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
      // webkit-journeys joins the two lifecycle suites here because WebKit was
      // an unvalidated engine until its browser binary could be installed
      // locally: everything the FINAL UX pass introduced - the contextual
      // backs, the Work return context, the routed personnel file, direct
      // fragment entry, the motion families - had never run on it once. This
      // is added COVERAGE, not a way to make anything pass.
      testMatch: /(?:mobile-lifecycle|webkit-media-capability|webkit-journeys)\.spec\.ts/,
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
