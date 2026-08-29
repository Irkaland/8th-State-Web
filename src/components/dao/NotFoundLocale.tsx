"use client";

import { useEffect } from "react";
import { localeFromPathname, localeHref } from "@/i18n/locales";
import { getNotFoundMessages } from "@/i18n/not-found-messages";
import { up } from "@/lib/cn";

/**
 * §P7: the Georgian half of the 404.
 *
 * The page itself is a server component so the words reach the HTML, and the
 * server cannot know the locale there - not-found.tsx is called with no props
 * and Next swaps the layout's <html> for its own error shell, so neither a
 * param nor a lang attribute is available. This island reads the real browser
 * path after mount and, only on a /ka route, rewrites the four strings and the
 * three destinations in place.
 *
 * It renders nothing of its own. Everything it edits is already in the server
 * HTML, so there is no second copy of the copy, no duplicated headings for a
 * screen reader to find, and an English visitor's DOM is never touched. It
 * imports the same 6-string table the page does - never the dictionaries,
 * which would put every EN and KA string into the shared client graph and undo
 * Phase 3.
 */
export function NotFoundLocale() {
  useEffect(() => {
    const locale = localeFromPathname(window.location.pathname);
    if (locale === "en") return;

    const R = getNotFoundMessages(locale);
    const root = document.querySelector<HTMLElement>("main.d404");
    if (!root) return;

    root.lang = locale;

    const line = root.querySelector<HTMLElement>(".d404__line");
    // the trailing full stop is a red span of its own - replace only the text
    if (line?.firstChild) line.firstChild.textContent = R.line.replace(/\.$/, "");

    const desc = line?.parentElement?.querySelector("p");
    if (desc) desc.textContent = R.desc;

    const nav = root.querySelector<HTMLElement>(".d404__links");
    if (nav) {
      nav.setAttribute("aria-label", R.home);
      const labels = [R.home, R.work, R.contact];
      const paths = ["/", "/work", "/contact"];
      nav.querySelectorAll("a").forEach((a, i) => {
        if (i >= labels.length) return;
        // the label is the anchor's first text node; the strike span stays put
        const text = [...a.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
        if (text) text.textContent = up(labels[i]);
        a.setAttribute("href", localeHref(locale, paths[i]));
      });
    }
  }, []);

  return null;
}
