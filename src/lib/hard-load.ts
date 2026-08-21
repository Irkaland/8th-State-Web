// §02 - final refresh contract (pure helpers, unit-tested).
//
// A REAL document load (first visit, browser refresh, address-bar entry) on
// any deep route always re-enters the site at the locale home: Studio Ident
// -> Home -> Master Showreel at the top. Internal client-side navigations and
// prefetches are RSC fetches - they carry Next router headers and/or the
// `_rsc` search param - and are never redirected, so the Ident never replays
// on them.

/** Minimal header surface so the policy stays testable without NextRequest. */
export type HeadersLike = {
  has(name: string): boolean;
  get(name: string): string | null;
};

export type SearchParamsLike = {
  has(name: string): boolean;
};

/**
 * Header that lets automated suites (Playwright) render a deep route
 * directly - the e2e config sends it on every request so existing deep-route
 * coverage keeps working, while dedicated refresh tests omit it.
 */
export const HARD_LOAD_BYPASS_HEADER = "x-dao-hard-load";

/** "/ka/work" -> "/work" ; "/ka" -> "/" ; "/work" -> "/work". */
function barePath(pathname: string): string {
  if (pathname === "/ka" || pathname === "/en") return "/";
  if (pathname.startsWith("/ka/") || pathname.startsWith("/en/")) {
    return pathname.slice(3) || "/";
  }
  return pathname || "/";
}

/** "ka" for /ka and /ka/*, otherwise "en" (EN is served unprefixed). */
function localeOf(pathname: string): "en" | "ka" {
  return pathname === "/ka" || pathname.startsWith("/ka/") ? "ka" : "en";
}

/**
 * §13: is this request the SAME page in the other language?
 *
 * The language switcher is a client-side `<Link>`, so in principle it is an
 * RSC fetch and never reaches the redirect below. In practice it crosses the
 * `[locale]` route-group boundary, and on the deployed edge that has been
 * observed arriving as a plain document GET with none of the router headers -
 * at which point the refresh contract cannot tell "switched language on
 * /work" from "typed /ka/work into the address bar", and sends the visitor to
 * the locale home. That is the reported bug: changing language throws you back
 * to Home instead of staying on the page you were reading.
 *
 * The Referer distinguishes the two unambiguously. A locale switch is the only
 * navigation whose referrer is the same bare path under a DIFFERENT locale, so
 * requiring both halves - paths equal, locales different - keeps every other
 * document load, including a refresh of the page itself (same locale) and a
 * deep link from elsewhere (different path), on the existing contract.
 *
 * A malformed or cross-origin Referer simply fails the check and falls back to
 * the old behaviour, which is the safe direction.
 */
export function isLocaleSwitch(
  pathname: string,
  referer: string | null,
  host: string | null,
): boolean {
  if (!referer) return false;
  let from: URL;
  try {
    from = new URL(referer, "http://dao.invalid");
  } catch {
    return false;
  }
  // A Referer from another site says nothing about our own navigation. Compared
  // on hostname rather than origin so http/https and the port do not matter
  // (the proxy sees the platform's internal scheme, not the visitor's).
  if (host && from.hostname !== "dao.invalid") {
    const hostname = host.split(":")[0]!.toLowerCase();
    if (from.hostname.toLowerCase() !== hostname) return false;
  }
  if (barePath(from.pathname) !== barePath(pathname)) return false;
  return localeOf(from.pathname) !== localeOf(pathname);
}

/**
 * Decide where a request must be redirected under the refresh contract.
 * Returns the locale home ("/" or "/ka") for a real document load of any
 * deep route, or null when the request must pass through untouched.
 */
export function hardLoadRedirect(
  pathname: string,
  method: string,
  headers: HeadersLike,
  searchParams?: SearchParamsLike,
): string | null {
  if (method !== "GET") return null;
  if (headers.get(HARD_LOAD_BYPASS_HEADER) === "allow") return null;
  // RSC fetch or prefetch = internal client-side navigation, never redirected.
  // Production Netlify/Next requests include `_rsc` on these fetches even
  // when middleware-visible headers vary, so treat it as an internal marker.
  if (
    searchParams?.has("_rsc") ||
    headers.has("rsc") ||
    headers.has("next-router-prefetch") ||
    headers.has("next-router-state-tree") ||
    headers.has("next-url")
  ) {
    return null;
  }
  const accept = headers.get("accept");
  if (accept && !accept.includes("text/html")) return null;
  // The locale homes are already the destination.
  if (pathname === "/" || pathname === "/ka") return null;
  // §13: switching language keeps you where you are, always.
  if (isLocaleSwitch(pathname, headers.get("referer"), headers.get("host"))) {
    return null;
  }
  return pathname === "/ka" || pathname.startsWith("/ka/") ? "/ka" : "/";
}
