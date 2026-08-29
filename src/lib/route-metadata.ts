import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale, localeHref } from "@/i18n/locales";

/**
 * Per-page canonical + hreflang alternates.
 *
 * §P0: the root layout declared `canonical: locale === "en" ? "/" : "/ka"` as a
 * default, and no page overrode it - so every route on the site canonicalised
 * to the locale HOME. /studio, /services, /team and all twelve case studies
 * each told search engines "the real page is the homepage", which is the same
 * thing as asking not to be indexed.
 *
 * Next merges `alternates` by REPLACEMENT rather than by field, so a page
 * cannot supply only a canonical and inherit the languages map - it has to
 * declare the whole object. That is the entire reason this helper exists: one
 * call per page, so the locale strategy stays in one place and the fourteen
 * pages that need it cannot drift apart.
 *
 * The KA strategy is deliberate and unchanged in spirit: Georgian is a real
 * locale with its own indexable URLs, so /ka/studio canonicalises to ITSELF,
 * never to /studio. The two are declared as alternates of one another, with EN
 * as x-default because EN is the unprefixed default locale.
 *
 * `path` is the locale-independent route, exactly as passed to localeHref
 * (e.g. "/studio", "/work/aom-summer-collection"). Query strings are
 * deliberately excluded: a filtered view of /work is the same document as
 * /work, so it must not advertise a second canonical.
 *
 * `locale` is taken as the raw route param so callers can pass it straight
 * through without narrowing it first; an unrecognised value resolves to the
 * default locale, which is the same fallback getMessages() already applies.
 */
export function routeAlternates(locale: string, path: string): Metadata["alternates"] {
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return {
    canonical: localeHref(resolved, path),
    languages: {
      en: localeHref("en", path),
      ka: localeHref("ka", path),
      "x-default": localeHref("en", path),
    },
  };
}

/** The Open Graph locale for a route, in the form the protocol expects. */
export function ogLocale(locale: string): string {
  return (isLocale(locale) ? locale : DEFAULT_LOCALE) === "ka" ? "ka_GE" : "en_US";
}

/**
 * Open Graph for a page that needs to add its own fields.
 *
 * §P1: Next merges `openGraph` the same way it merges `alternates` - by
 * REPLACEMENT, not field by field. The case studies supplied
 * `openGraph: { images: [...] }` to advertise their own cover, and in doing so
 * silently dropped every field the layout had set: type, siteName, locale,
 * title and description. Measured on the built server, a project route
 * published 3 og:* tags against the 9 on every other route, and `og:locale`
 * was absent in both locales - the exact defect Phase 1 deferred.
 *
 * A page cannot inherit half of the object, so this composes the whole one:
 * the shared identity first, then whatever the page overrides. Callers pass
 * their own title/description/images and get a complete tag set back, which
 * keeps the contract in one place rather than asking twelve case studies to
 * remember five fields each.
 */
export function routeOpenGraph(
  locale: string,
  shared: { siteName: string; title: string; description: string },
  overrides: NonNullable<Metadata["openGraph"]> = {},
): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: shared.siteName,
    locale: ogLocale(locale),
    title: shared.title,
    description: shared.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: shared.siteName }],
    ...overrides,
  };
}
