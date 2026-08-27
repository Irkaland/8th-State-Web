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
