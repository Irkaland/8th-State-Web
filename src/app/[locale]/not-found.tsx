"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPathname, localeHref } from "@/i18n/locales";
import { getNotFoundMessages } from "@/i18n/not-found-messages";
import { up } from "@/lib/cn";

/**
 * /404 - displaced frame (handoff 4g). The bird got out of its frame;
 * never a dead end (IX-28). 200ms fade entrance only.
 */
export default function NotFound() {
  const pathname = usePathname() || "/";
  const locale = localeFromPathname(pathname);
  // perf phase 2A: only the 404 strings - never the full dictionaries,
  // which would enter the shared client graph of every route
  const R = getNotFoundMessages(locale);

  return (
    <main id="main" className="dao d404">
      <div className="dao-weave" aria-hidden="true" />
      {/* the brand mark is a home link on every page, the 404 included (§12) */}
      <Link
        href={localeHref(locale, "/")}
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
          <Link href={localeHref(locale, "/")}>
            {up(R.home)}
            <span className="dao-strike dao-strike--on" aria-hidden="true" />
          </Link>
          <Link href={localeHref(locale, "/work")}>
            {up(R.work)}
            <span className="dao-strike" aria-hidden="true" />
          </Link>
          <Link href={localeHref(locale, "/contact")}>
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
    </main>
  );
}
