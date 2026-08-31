"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * The running department folio.
 *
 * The only client code on the Services page, and it exists for one reason: to
 * say which chapter you are currently reading. That is a fact about scroll
 * position, and no amount of CSS can answer it - `:target` reflects the URL,
 * not where the page actually is.
 *
 * WHAT IT DELIBERATELY IS NOT
 * ---------------------------
 * The prototype read `window.innerWidth` into state, re-rendered on resize, and
 * re-scanned the document with a MutationObserver. None of that is here. Which
 * labels are drawn at which width is a media query; the chapters are server
 * rendered and never change, so they are observed once.
 *
 * It is also not a scroll manager. It never moves the page - the links are
 * ordinary anchors, and placement stays with FragmentEntry. Without JavaScript
 * the folio still renders and every link still works; all that is lost is the
 * highlight.
 */
export function ServicesFolio({
  items,
  label,
}: {
  items: { n: string; anchor: string; short: string }[];
  label: string;
}) {
  const [active, setActive] = useState(items[0]?.n ?? "01");
  const nav = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const chapters = items
      .map((i) => document.getElementById(i.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (!chapters.length) return;

    // the band the reader is actually reading in, rather than the whole viewport
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const n = e.target.getAttribute("data-dept");
            if (n) setActive(n);
          }
        }
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    for (const c of chapters) io.observe(c);
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="dsvc__folio" aria-label={label} ref={nav}>
      <div className="dsvc__foliorail">
        {items.map((i) => (
          <Link
            key={i.anchor}
            href={`#${i.anchor}`}
            className="dsvc__foliolink"
            data-active={i.n === active ? "true" : undefined}
            aria-current={i.n === active ? "true" : undefined}
          >
            <span className="dsvc__folion">{i.n}</span>
            <span className="dsvc__folioshort">{i.short}</span>
          </Link>
        ))}
        <span className="dsvc__foliocount" aria-hidden="true">
          {active} / 05
        </span>
      </div>
    </nav>
  );
}
