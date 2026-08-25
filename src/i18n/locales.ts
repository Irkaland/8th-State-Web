// Locale constants + path helpers. Safe to import from both Server and Client Components.

export const LOCALES = ["en", "ka"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ka: "KA",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  ka: "ka",
};

/**
 * Build a browser href for a given locale + app path.
 * EN is unprefixed; KA is prefixed with /ka.
 * `path` is the locale-independent path starting with "/" (e.g. "/work", "/").
 */
export function localeHref(locale: Locale, path: string): string {
  const clean = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? "/ka" : `/ka${clean}`;
}

/**
 * Given a real browser pathname, return the locale-independent path.
 * "/ka/work" -> "/work" ; "/work" -> "/work" ; "/ka" -> "/" ; "/" -> "/".
 * Also strips the internal "/en" tree the proxy rewrites unprefixed EN
 * requests to - when that rewritten pathname leaks into a client component
 * (e.g. usePathname during SSR), the language switcher must never build
 * "/ka/en/..." hrefs (the KA burger 404 bug).
 */
export function stripLocale(pathname: string): string {
  if (pathname === "/ka" || pathname === "/en") return "/";
  if (pathname.startsWith("/ka/") || pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

/** Detect the active locale from a real browser pathname. */
export function localeFromPathname(pathname: string): Locale {
  return pathname === "/ka" || pathname.startsWith("/ka/") ? "ka" : "en";
}

/** Map a real pathname to its equivalent in another locale (for the language switcher). */
/**
 * The same route in the other locale.
 *
 * `search` carries the query string over. usePathname() drops it, so without
 * this an EN->KA switch on /work?category=photography landed on /ka/work and
 * silently reset the archive to ALL - the visitor lost the filter they were
 * reading. Preserved generically rather than per-parameter: any query the Work
 * archive (or anything else) uses survives the switch, and filter semantics are
 * untouched, so a valid zero-result filter stays a zero-result filter.
 */
export function switchLocalePath(pathname: string, target: Locale, search = ""): string {
  const base = localeHref(target, stripLocale(pathname));
  const q = search.startsWith("?") ? search : search ? `?${search}` : "";
  return q === "?" ? base : `${base}${q}`;
}
