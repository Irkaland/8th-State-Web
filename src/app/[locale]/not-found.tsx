import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_LOCALE, localeHref } from "@/i18n/locales";
import { getNotFoundMessages } from "@/i18n/not-found-messages";
import { up } from "@/lib/cn";
import { NotFoundLocale } from "@/components/dao/NotFoundLocale";

/**
 * /404 - displaced frame (handoff 4g). The bird got out of its frame;
 * never a dead end (IX-28). 200ms fade entrance only.
 *
 * §P7: this was a client component, and a client boundary in the not-found
 * slot does not server-render at all - measured, the whole <body> was
 * `<div hidden><!--$--><!--/$--></div>` plus scripts. A crawler or a no-JS
 * visitor got a correct 404 STATUS attached to an empty document: no heading,
 * no links, 56 characters of text. Both were tested: dropping usePathname()
 * did not help, because it is the "use client" boundary itself that defers
 * here, so the page is a server component now and the markup ships in the
 * response.
 *
 * The locale is the one thing the server cannot know: not-found.tsx receives
 * no params (verified - it is called with no props at all), and Next replaces
 * the layout's <html> with its own error shell, so there is no lang attribute
 * to read either. The server therefore renders the default locale and a small
 * client island upgrades the text to Georgian on a /ka path. That ordering is
 * deliberate: the words a crawler and a no-JS visitor need are in the HTML,
 * and the Georgian visitor gets Georgian as soon as the page hydrates -
 * strictly better than today, where nobody gets anything until it hydrates.
 */

export const metadata: Metadata = {
  title: "404 - Page not found",
  // §P7: the layout's canonical pointed a 404 at the locale HOME, which tells
  // a crawler this dead URL is the homepage. A 404 is not a version of another
  // page; the HTTP status is the whole story, and noindex says the rest.
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const R = getNotFoundMessages(DEFAULT_LOCALE);
  const home = localeHref(DEFAULT_LOCALE, "/");

  return (
    <main id="main" className="dao d404" lang={DEFAULT_LOCALE}>
      <div className="dao-weave" aria-hidden="true" />
      {/* the brand mark is a home link on every page, the 404 included (§12) */}
      <Link
        href={home}
        aria-label="8th State Production"
        style={{
          position: "absolute",
          top: 24,
          left: "var(--dao-gutter)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
        }}
      >
        <span
          className="dao-mask"
          aria-hidden="true"
          style={{
            ["--m" as string]: "url(/assets/graphics/serpent-mark.webp)",
            width: 42,
            height: 22,
            background: "var(--dao-paper)",
          }}
        />
        <span
          style={{
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--dao-paper)",
          }}
        >
          8TH STATE
        </span>
      </Link>
      <div className="d404__frame" aria-hidden="true">
        <span className="d404__swallow dao-mask" />
      </div>
      <div
        style={{
          maxWidth: 520,
          margin: "50px auto 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span className="d404__code">404</span>
        <h1 className="d404__line">
          {R.line.replace(/\.$/, "")}
          <span style={{ color: "var(--dao-red)" }}>.</span>
        </h1>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(242,237,227,.7)" }}>{R.desc}</p>
        <nav className="d404__links" aria-label={R.home}>
          <Link href={home}>
            {up(R.home)}
            <span className="dao-strike dao-strike--on" aria-hidden="true" />
          </Link>
          <Link href={localeHref(DEFAULT_LOCALE, "/work")}>
            {up(R.work)}
            <span className="dao-strike" aria-hidden="true" />
          </Link>
          <Link href={localeHref(DEFAULT_LOCALE, "/contact")}>
            {up(R.contact)}
            <span className="dao-strike" aria-hidden="true" />
          </Link>
        </nav>
        <span
          style={{
            fontFamily: "var(--dao-f-numeral)",
            fontSize: 11,
            color: "rgba(242,237,227,.45)",
            marginTop: 20,
          }}
        >
          {R.fr}
        </span>
      </div>
      <NotFoundLocale />
    </main>
  );
}
