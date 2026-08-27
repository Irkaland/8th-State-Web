"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { cn } from "@/lib/cn";

/**
 * v7 contract #1 - global contextual return control. A printed paper tab,
 * slightly rotated, pinned top-left beside the mark; hover straightens and
 * lifts 1px. Ground-aware inversion (paper tab on ink, ink tab on paper,
 * cream tab on blue/green). Hidden on mobile (≤720, CSS §11) - the brand
 * mark, the burger and the browser back gesture carry navigation there.
 *
 * THE DESTINATION IS A ROUTE, NOT AN UNDO.
 *
 * This used to call router.back() whenever the current page load had already
 * seen an earlier internal route, on the theory that popping history restores
 * archive scroll and filters for free. It does - but a locale switch is also an
 * internal route, so switching language and pressing the tab walked BACK INTO
 * THE PREVIOUS LANGUAGE'S copy of the same page, and the reader had to press it
 * twice to leave. Every caller already declares the parent it means, so the tab
 * now simply goes there, in the locale the reader is currently in.
 *
 * The browser's own Back is untouched and keeps normal history semantics; this
 * control is site navigation, and the two are deliberately not the same thing.
 *
 * It is a real <Link>, so it prefetches, opens in a new tab on middle-click and
 * shows its destination in the status bar - none of which a button could do.
 */
export function ReturnTab({
  locale,
  label,
  parent,
  ground = "dark",
}: {
  locale: Locale;
  label: string;
  /** the page's intended parent route, locale-free (e.g. "/studio") */
  parent: string;
  ground?: "dark" | "light";
}) {
  return (
    <Link
      href={localeHref(locale, parent)}
      className={cn("dao-returntab", ground === "light" && "dao-returntab--ink")}
      aria-label={label}
      data-dao-parent={parent}
    >
      <span aria-hidden="true" style={{ fontFamily: "sans-serif" }}>
        ←
      </span>
      <span className="dao-returntab__label">{label}</span>
    </Link>
  );
}
