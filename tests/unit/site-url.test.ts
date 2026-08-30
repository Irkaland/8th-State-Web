import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PRODUCTION_ORIGIN, DEV_ORIGIN } from "@/lib/site-url";
import { ogLocale, routeOpenGraph, routeAlternates } from "@/lib/route-metadata";

/**
 * §P7: the canonical origin, and the Open Graph composition that depends on it.
 *
 * The origin is the one value every absolute URL on the site is built from -
 * metadataBase, canonical, hreflang, og:image, robots, sitemap. Phase 1 already
 * proved what happens when it is wrong: a request-time render dropped to the
 * dev fallback and published `canonical="http://localhost:3000"` to the public
 * internet. These tests hold the precedence in place, and hold the line that a
 * production build can never answer with localhost whatever the environment
 * does or does not set.
 *
 * The module reads process.env at call time, so each case re-imports it with a
 * fresh environment rather than trusting import order.
 */

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "URL",
  "DEPLOY_PRIME_URL",
  "NODE_ENV",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  vi.unstubAllEnvs();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.resetModules();
});

/** re-import with whatever the current environment says */
async function siteUrl(): Promise<string> {
  const mod = await import("@/lib/site-url");
  return mod.getSiteUrl();
}

describe("§P7 canonical site origin", () => {
  it("prefers the explicitly configured origin above everything else", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://8thstate.com";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "project.vercel.app";
    process.env.URL = "https://netlify.example";
    expect(await siteUrl()).toBe("https://8thstate.com");
  });

  it("uses the platform's PRODUCTION domain when nothing is configured", async () => {
    // Vercel hands over a bare host - the scheme has to be added
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "8th-state.vercel.app";
    expect(await siteUrl()).toBe("https://8th-state.vercel.app");
  });

  it("never uses the per-deployment Vercel hostname", async () => {
    // VERCEL_URL is unique per deployment; trusting it would let every preview
    // publish itself as its own canonical
    process.env.VERCEL_URL = "8th-state-git-branch-xyz.vercel.app";
    vi.stubEnv("NODE_ENV", "production");
    const url = await siteUrl();
    expect(url).not.toContain("git-branch-xyz");
    expect(url).toBe(PRODUCTION_ORIGIN);
  });

  it("falls back to a real production origin, never localhost, on a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const url = await siteUrl();
    expect(url).toBe(PRODUCTION_ORIGIN);
    expect(url).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it("uses localhost only outside a production build", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await siteUrl()).toBe(DEV_ORIGIN);
  });

  it("treats a blank variable as unset rather than as an origin", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    vi.stubEnv("NODE_ENV", "production");
    expect(await siteUrl()).toBe(PRODUCTION_ORIGIN);
  });

  it("never returns a trailing slash, whatever was configured", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://8thstate.com/";
    expect(await siteUrl()).toBe("https://8thstate.com");
  });
});

describe("§P7 Open Graph composition", () => {
  const shared = { siteName: "8th State Production", title: "T", description: "D" };

  it("maps each locale to its Open Graph form", () => {
    expect(ogLocale("en")).toBe("en_US");
    expect(ogLocale("ka")).toBe("ka_GE");
    expect(ogLocale("nonsense")).toBe("en_US");
  });

  it("keeps the shared identity when a page overrides only its image", () => {
    // the defect this phase fixed: `openGraph: { images: [...] }` REPLACED the
    // parent object, so type, siteName, locale, title and description vanished
    const og = routeOpenGraph("ka", shared, { images: [{ url: "/media/x.jpg" }] }) as Record<
      string,
      unknown
    >;
    expect(og.locale).toBe("ka_GE");
    expect(og.siteName).toBe("8th State Production");
    expect(og.title).toBe("T");
    expect(og.description).toBe("D");
    expect(og.images).toEqual([{ url: "/media/x.jpg" }]);
  });

  it("still lets a page override what is genuinely its own", () => {
    const og = routeOpenGraph("en", shared, { type: "article" }) as Record<string, unknown>;
    expect(og.type).toBe("article");
    expect(og.locale).toBe("en_US");
  });
});

describe("§P7 canonical alternates are per route", () => {
  it("canonicalises each locale to itself, never to the other", () => {
    const en = routeAlternates("en", "/work/aom-summer-collection") as Record<string, unknown>;
    const ka = routeAlternates("ka", "/work/aom-summer-collection") as Record<string, unknown>;
    expect(en.canonical).toBe("/work/aom-summer-collection");
    expect(ka.canonical).toBe("/ka/work/aom-summer-collection");
    expect((ka.languages as Record<string, string>)["x-default"]).toBe(
      "/work/aom-summer-collection",
    );
  });
});
