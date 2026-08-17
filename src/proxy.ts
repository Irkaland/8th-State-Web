import { NextResponse, type NextRequest } from "next/server";
import { hardLoadRedirect } from "@/lib/hard-load";

// EN is the default locale and is served WITHOUT a prefix (/, /work ...).
// KA is served under /ka (/ka, /ka/work ...).
// Internally every route lives under app/[locale]; this proxy rewrites
// unprefixed requests to the /en tree and redirects explicit /en URLs to canonical unprefixed paths.
//
// §02 refresh contract: a real document load of any deep route (refresh,
// first visit, address-bar entry) is redirected to the locale home before
// anything renders - deterministic, no routing flash. Client-side
// navigations/prefetches are RSC fetches and pass through untouched, so the
// Studio Ident never replays on internal navigation (§03/§10).

const LOCALES = ["en", "ka"] as const;
const DEFAULT_LOCALE = "en";

const hasExtension = /\.[^/]+$/; // e.g. /favicon.ico, /media/x.jpg

function isIgnored(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/media") ||
    pathname.startsWith("/api") ||
    hasExtension.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isIgnored(pathname)) return NextResponse.next();

  // Canonicalise explicit /en -> unprefixed.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    return NextResponse.redirect(url);
  }

  // §02/§14: hard document loads always re-enter at the locale home.
  const home = hardLoadRedirect(pathname, request.method, request.headers);
  if (home !== null) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // KA is already prefixed and maps directly to [locale] = ka.
  if (pathname === "/ka" || pathname.startsWith("/ka/")) {
    return NextResponse.next();
  }

  // Everything else is the default (EN) locale: rewrite to the /en tree.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-locale", DEFAULT_LOCALE);
  return response;
}

export const config = {
  // Run on everything except Next internals, media, and static files.
  matcher: ["/((?!_next|media|.*\\.).*)"],
};

export { LOCALES, DEFAULT_LOCALE };
