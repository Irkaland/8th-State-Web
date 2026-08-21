import { describe, expect, it } from "vitest";
import { HARD_LOAD_BYPASS_HEADER, hardLoadRedirect, isLocaleSwitch } from "@/lib/hard-load";

function headers(map: Record<string, string> = {}) {
  const h = new Map(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    has: (n: string) => h.has(n.toLowerCase()),
    get: (n: string) => h.get(n.toLowerCase()) ?? null,
  };
}

function searchParams(keys: string[] = []) {
  const params = new Set(keys);
  return { has: (n: string) => params.has(n) };
}

describe("hardLoadRedirect (§02 refresh contract)", () => {
  it("redirects a real document load of any EN deep route to /", () => {
    for (const path of [
      "/studio",
      "/work",
      "/work/aom-summer-collection",
      "/studio-lab",
      "/process",
      "/georgia-production",
      "/contact",
      "/start-a-project",
      "/privacy",
    ]) {
      expect(hardLoadRedirect(path, "GET", headers()), path).toBe("/");
    }
  });

  it("redirects a real document load of any KA deep route to /ka", () => {
    for (const path of ["/ka/studio", "/ka/work", "/ka/start-a-project"]) {
      expect(hardLoadRedirect(path, "GET", headers()), path).toBe("/ka");
    }
  });

  it("never redirects the locale homes themselves", () => {
    expect(hardLoadRedirect("/", "GET", headers())).toBeNull();
    expect(hardLoadRedirect("/ka", "GET", headers())).toBeNull();
  });

  it("never redirects internal client-side navigations (RSC fetches)", () => {
    expect(hardLoadRedirect("/studio", "GET", headers({ rsc: "1" }))).toBeNull();
    expect(hardLoadRedirect("/ka/work", "GET", headers({ rsc: "1" }))).toBeNull();
    expect(hardLoadRedirect("/work", "GET", headers(), searchParams(["_rsc"]))).toBeNull();
    expect(
      hardLoadRedirect(
        "/contact",
        "GET",
        headers({ "next-router-state-tree": "[tree]" }),
        searchParams(["_rsc"]),
      ),
    ).toBeNull();
    expect(
      hardLoadRedirect("/services", "GET", headers({ "next-url": "/en" }), searchParams(["_rsc"])),
    ).toBeNull();
  });

  it("never redirects prefetches", () => {
    expect(
      hardLoadRedirect("/studio", "GET", headers({ rsc: "1", "next-router-prefetch": "1" })),
    ).toBeNull();
    expect(hardLoadRedirect("/studio", "GET", headers({ "next-router-prefetch": "1" }))).toBeNull();
  });

  it("never redirects non-GET requests", () => {
    expect(hardLoadRedirect("/contact", "POST", headers())).toBeNull();
  });

  it("honours the e2e bypass header", () => {
    expect(
      hardLoadRedirect("/studio", "GET", headers({ [HARD_LOAD_BYPASS_HEADER]: "allow" })),
    ).toBeNull();
  });
});

describe("§13 - a locale switch never loses the page you were on", () => {
  const HOST = "8thstate.com";

  it("passes a same-path locale switch through, both directions", () => {
    const cases: [string, string][] = [
      ["/ka/work", "https://8thstate.com/work"],
      ["/work", "https://8thstate.com/ka/work"],
      ["/ka/studio", "https://8thstate.com/studio"],
      ["/ka/work/aom-summer-collection", "https://8thstate.com/work/aom-summer-collection"],
      ["/start-a-project", "https://8thstate.com/ka/start-a-project"],
    ];
    for (const [pathname, referer] of cases) {
      expect(
        hardLoadRedirect(pathname, "GET", headers({ referer, host: HOST })),
        `${referer} -> ${pathname}`,
      ).toBeNull();
    }
  });

  it("still redirects a refresh of the SAME page in the SAME locale", () => {
    // this is the ordinary refresh contract and must be untouched
    expect(
      hardLoadRedirect(
        "/ka/work",
        "GET",
        headers({ referer: "https://8thstate.com/ka/work", host: HOST }),
      ),
    ).toBe("/ka");
    expect(
      hardLoadRedirect(
        "/work",
        "GET",
        headers({ referer: "https://8thstate.com/work", host: HOST }),
      ),
    ).toBe("/");
  });

  it("still redirects a deep link arriving from a DIFFERENT page", () => {
    expect(
      hardLoadRedirect(
        "/ka/work",
        "GET",
        headers({ referer: "https://8thstate.com/studio", host: HOST }),
      ),
    ).toBe("/ka");
    expect(
      hardLoadRedirect(
        "/ka/work",
        "GET",
        headers({ referer: "https://8thstate.com/ka/studio", host: HOST }),
      ),
    ).toBe("/ka");
  });

  it("still redirects with no referer at all (address bar, first visit)", () => {
    expect(hardLoadRedirect("/ka/work", "GET", headers({ host: HOST }))).toBe("/ka");
  });

  it("ignores a referer from another site", () => {
    expect(
      hardLoadRedirect(
        "/ka/work",
        "GET",
        headers({ referer: "https://example.com/work", host: HOST }),
      ),
    ).toBe("/ka");
  });

  it("ignores a malformed referer instead of throwing", () => {
    expect(hardLoadRedirect("/ka/work", "GET", headers({ referer: "::::", host: HOST }))).toBe(
      "/ka",
    );
  });

  it("matches on hostname alone, so scheme and port do not matter", () => {
    // the proxy sees the platform's internal scheme/port, not the visitor's
    expect(
      hardLoadRedirect(
        "/ka/work",
        "GET",
        headers({ referer: "http://localhost:3000/work", host: "localhost:3000" }),
      ),
    ).toBeNull();
  });

  it("treats the locale homes as the switch of /", () => {
    // both are already early-returned as homes, but assert the contract
    expect(
      hardLoadRedirect("/ka", "GET", headers({ referer: "https://8thstate.com/", host: HOST })),
    ).toBeNull();
    expect(
      hardLoadRedirect("/", "GET", headers({ referer: "https://8thstate.com/ka", host: HOST })),
    ).toBeNull();
  });
});

describe("isLocaleSwitch", () => {
  it("requires the paths to match AND the locales to differ", () => {
    expect(isLocaleSwitch("/ka/work", "https://a.test/work", "a.test")).toBe(true);
    // same locale
    expect(isLocaleSwitch("/ka/work", "https://a.test/ka/work", "a.test")).toBe(false);
    // different path
    expect(isLocaleSwitch("/ka/work", "https://a.test/studio", "a.test")).toBe(false);
  });

  it("normalises the locale homes to the same bare path", () => {
    expect(isLocaleSwitch("/ka", "https://a.test/", "a.test")).toBe(true);
  });

  it("does not read a path that merely STARTS with 'ka' as the KA locale", () => {
    // "/kayak" begins with "/ka" as a string but the locale prefix is "/ka/"
    // (or "/ka" exactly), so this is the EN page "/kayak" - and the referer
    // "/ka/kayak" is its KA twin, which makes this a real switch
    expect(isLocaleSwitch("/kayak", "https://a.test/ka/kayak", "a.test")).toBe(true);
    expect(isLocaleSwitch("/ka/kayak", "https://a.test/kayak", "a.test")).toBe(true);
    // ...and two EN paths are never a switch, however they are spelled
    expect(isLocaleSwitch("/kayak", "https://a.test/kayak", "a.test")).toBe(false);
  });

  it("returns false without a referer", () => {
    expect(isLocaleSwitch("/ka/work", null, "a.test")).toBe(false);
  });

  it("does not require a host (a relative referer still resolves)", () => {
    expect(isLocaleSwitch("/ka/work", "/work", null)).toBe(true);
  });
});
