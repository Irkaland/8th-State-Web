import { NextResponse, type NextRequest } from "next/server";

// EN is the default locale and is served WITHOUT a prefix (/, /work ...).
// KA is served under /ka (/ka, /ka/work ...).
// Internally every route lives under app/[locale]; this proxy rewrites
// unprefixed requests to the /en tree and redirects explicit /en URLs to canonical unprefixed paths.
//
// §P0 ROUTING CONTRACT (this replaces the former "refresh contract").
//
// A URL identifies a page, and nothing here may change that. Every valid
// request - document load, refresh, address-bar entry, crawler, RSC fetch -
// resolves the route it asked for, with its query string intact:
//
//   /studio                     -> /studio
//   /ka/studio                  -> /ka/studio
//   /team?person=production-01  -> /team?person=production-01
//   /work?category=photography  -> /work?category=photography
//   /nope                       -> the real 404, never Home
//
// This file previously 307-redirected any browser-like document load of a deep
// route to its locale home, so that the Studio Ident would always be followed
// by the Master Showreel. That cost the entire URL surface: deep links could
// not be shared, a refresh lost the reader's place, every sitemap URL
// redirected away, crawlers received a 307, and the 404 route was unreachable.
// It also made routing depend on the request's `Accept` header, so the same URL
// answered differently for a browser than for curl or a link previewer.
//
// The Ident did not need any of it. Its "should I play?" decision is - and
// always was - client session state: a module-scope flag in
// components/dao/StudioIdent.tsx that is fresh on every real document load and
// already true on every client-side navigation. So the Ident still plays on a
// hard load of any route, renders as an overlay above the route that was
// actually requested, and reveals it on exit. The URL is never involved.
//
// INTRO STATE MUST NOT CONTROL URL ROUTING.

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

  // Canonicalise explicit /en -> unprefixed. This is the one redirect left,
  // and it is a true canonicalisation: /en/work and /work are the same page,
  // so only one of them may be addressable. The query string is carried over
  // by nextUrl.clone(), so no filter or deep link is lost on the way.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    return NextResponse.redirect(url);
  }

  // KA is already prefixed and maps directly to [locale] = ka.
  if (pathname === "/ka" || pathname.startsWith("/ka/")) {
    return NextResponse.next();
  }

  // Everything else is the default (EN) locale: rewrite to the /en tree.
  // A rewrite, never a redirect - the visitor's URL stays exactly as typed.
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
