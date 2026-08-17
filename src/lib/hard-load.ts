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
  return pathname === "/ka" || pathname.startsWith("/ka/") ? "/ka" : "/";
}
