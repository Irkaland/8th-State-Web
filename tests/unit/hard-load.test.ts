import { describe, expect, it } from "vitest";
import { HARD_LOAD_BYPASS_HEADER, hardLoadRedirect } from "@/lib/hard-load";

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
