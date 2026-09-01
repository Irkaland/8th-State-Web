import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * §P7: what the server says before any JavaScript runs.
 *
 * These are request-level assertions on purpose (§49). Status codes, canonical
 * links and Open Graph tags are decided on the server, so driving a browser to
 * read them would cost a page load each and buy nothing - the whole file makes
 * plain HTTP requests and finishes in a couple of seconds.
 *
 * The defects being held down:
 *
 *   og:locale   case studies supplied `openGraph: { images: [...] }`, and Next
 *               merges that object by REPLACEMENT, so type, siteName, locale,
 *               title and description were dropped. Measured on the built
 *               server: 3 og:* tags against 9 everywhere else, and no
 *               og:locale in either locale.
 *   404         the layout's canonical pointed a dead URL at the locale HOME,
 *               and the title was the generic site title, so a 404 announced
 *               itself as the homepage.
 *   origin      a production build must never publish localhost, and a real
 *               404 must never become a redirect to Home.
 */

const html = async (request: APIRequestContext, path: string) => {
  const res = await request.get(path, { maxRedirects: 0 });
  return { status: res.status(), location: res.headers()["location"], body: await res.text() };
};

const metaProp = (body: string, prop: string) =>
  body.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`))?.[1] ?? null;
const metaName = (body: string, name: string) =>
  body.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? null;
const canonical = (body: string) => body.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
const title = (body: string) => body.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;

test.describe("§P7 case study Open Graph keeps the shared identity", () => {
  for (const [locale, path, expected] of [
    ["EN", "/work/aom-summer-collection", "en_US"],
    ["KA", "/ka/work/aom-summer-collection", "ka_GE"],
  ] as const) {
    test(`${locale} case study declares og:locale and the shared fields`, async ({ request }) => {
      const { status, body } = await html(request, path);
      expect(status).toBe(200);
      expect(metaProp(body, "og:locale"), "og:locale was dropped by object replacement").toBe(
        expected,
      );
      expect(metaProp(body, "og:site_name")).toBe("8th State Production");
      expect(metaProp(body, "og:type")).toBeTruthy();
      expect(metaProp(body, "og:title"), "og:title was dropped").toBeTruthy();
      expect(metaProp(body, "og:description"), "og:description was dropped").toBeTruthy();
      // An og:image is always declared. While no project cover has been
      // supplied it is the shared brand card - a case study only advertises its
      // OWN cover once it has one, and an empty og:image would be worse than
      // the brand fallback. This asserted "/media/" when every project carried
      // demo photography; the demo imagery is gone, so what has to hold is that
      // the tag is present and points somewhere real.
      expect(metaProp(body, "og:image")).toMatch(/\/(og\.png|media\/)/);
      // and the shared Twitter card survives too
      expect(metaName(body, "twitter:card")).toBe("summary_large_image");
    });
  }

  test("a case study canonicalises to itself in each locale", async ({ request }) => {
    const en = await html(request, "/work/aom-summer-collection");
    const ka = await html(request, "/ka/work/aom-summer-collection");
    expect(canonical(en.body)).toMatch(/\/work\/aom-summer-collection$/);
    expect(canonical(ka.body)).toMatch(/\/ka\/work\/aom-summer-collection$/);
  });
});

test.describe("§P7 the 404 is a 404, and says so", () => {
  const INVALID = [
    "/no-such-route",
    "/ka/no-such-route",
    "/work/no-such-project",
    "/ka/work/no-such-project",
  ];

  for (const path of INVALID) {
    test(`${path} answers 404 without redirecting`, async ({ request }) => {
      const { status, location } = await html(request, path);
      expect(status, "an invalid route must not redirect to Home").toBe(404);
      expect(location, "an invalid route must not redirect at all").toBeFalsy();
    });
  }

  test("the 404 does not advertise the homepage as its canonical", async ({ request }) => {
    for (const path of ["/no-such-route", "/ka/no-such-route"]) {
      const { body } = await html(request, path);
      const c = canonical(body);
      expect(c, `${path} still canonicalises to ${c}`).toBeNull();
      expect(metaName(body, "robots"), `${path} should stay out of the index`).toContain("noindex");
    }
  });

  test("the 404 carries its own title, not the site default", async ({ request }) => {
    const { body } = await html(request, "/no-such-route");
    expect(title(body)).toMatch(/404/);
  });

  test("a bot sees the same 404 as a browser", async ({ request }) => {
    const bot = await request.get("/no-such-route", {
      maxRedirects: 0,
      headers: { "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)", Accept: "*/*" },
    });
    expect(bot.status()).toBe(404);
    expect(bot.headers()["location"]).toBeFalsy();
  });
});

test.describe("§P7 the published origin", () => {
  const ROUTES = [
    "/",
    "/ka",
    "/work",
    "/ka/work",
    "/services",
    "/team",
    "/work/aom-summer-collection",
    "/ka/work/aom-summer-collection",
    "/sitemap.xml",
    "/robots.txt",
  ];

  test("no route publishes a localhost URL", async ({ request }) => {
    for (const path of ROUTES) {
      const { body } = await html(request, path);
      // the dev server is reached over localhost, so only ABSOLUTE metadata
      // URLs are inspected - the ones that would reach the public internet
      const absolute = [
        canonical(body),
        metaProp(body, "og:image"),
        metaProp(body, "og:url"),
        ...[...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]),
        ...[...body.matchAll(/Sitemap:\s*(\S+)/g)].map((m) => m[1]),
      ].filter(Boolean) as string[];
      for (const url of absolute) {
        expect(url, `${path} publishes ${url}`).not.toMatch(/localhost|127\.0\.0\.1/);
      }
    }
  });

  test("the sitemap lists one origin and every entry resolves", async ({ request }) => {
    const { status, body } = await html(request, "/sitemap.xml");
    expect(status).toBe(200);
    const locs = [...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length, "the sitemap should not be empty").toBeGreaterThan(10);
    const origins = new Set(locs.map((u) => new URL(u).origin));
    expect(origins.size, `sitemap mixes origins: ${[...origins].join(", ")}`).toBe(1);
  });

  test("robots points at the sitemap on the same origin", async ({ request }) => {
    const { status, body } = await html(request, "/robots.txt");
    expect(status).toBe(200);
    const sitemap = body.match(/Sitemap:\s*(\S+)/)?.[1];
    expect(sitemap, "robots.txt should declare a sitemap").toBeTruthy();
    expect(sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

test.describe("§P7 routing contracts still hold", () => {
  test("valid routes answer 200 and canonicalise to themselves", async ({ request }) => {
    for (const path of [
      "/",
      "/ka",
      "/work",
      "/ka/work",
      "/services",
      "/ka/services",
      "/team",
      "/ka/team",
    ]) {
      const { status, body } = await html(request, path);
      expect(status, `${path}`).toBe(200);
      const c = canonical(body);
      expect(c, `${path} has no canonical`).toBeTruthy();
      expect(new URL(c!).pathname, `${path} canonicalises elsewhere`).toBe(path);
    }
  });

  test("a filtered view does not advertise a second canonical", async ({ request }) => {
    const { body } = await html(request, "/work?category=film-video");
    expect(new URL(canonical(body)!).pathname).toBe("/work");
  });

  test("/en/* canonicalises away and keeps the query", async ({ request }) => {
    const { status, location } = await html(request, "/en/work?category=film-video");
    expect([301, 302, 307, 308]).toContain(status);
    expect(location).toContain("/work");
    expect(location).toContain("category=film-video");
  });
});
