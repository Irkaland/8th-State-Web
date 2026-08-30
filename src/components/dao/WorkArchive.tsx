"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import type { WorkArchiveMessages } from "@/i18n/slices";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { InView } from "./InView";
import { up } from "@/lib/cn";
import { safeSession } from "@/lib/session-lifecycle";
import { WK_CTX_KEY, parseWorkContext } from "@/lib/work-context";

export type ArchiveItem = {
  slug: string;
  title: string;
  cover: string;
  alt: string;
  discipline: string; // localized label, uppercase
  disciplineId: string;
  role: string;
  year: string;
};

/**
 * /work - living production archive (3b). Frames compose in a repeating
 * editorial rhythm: full-width feature on its blue paper, an offset
 * portrait+wide pair, a centred frame, then a pair where Lab work carries
 * its green sheet - the only green on this route. Filtering re-composes
 * the archive; the paint stroke marks the active index line. No pills,
 * no grid.
 */
export function WorkArchive({
  locale,
  messages,
  items,
  total,
  canonicalSearch,
}: {
  locale: Locale;
  messages: WorkArchiveMessages;
  items: ArchiveItem[];
  total: number;
  /**
   * The query string the SERVER actually applied - "" or "?category=film-video".
   * The client compares it with the address bar and quietly corrects the URL when
   * they disagree (FINAL UX §11), so a dead filter parameter never stands in a URL
   * claiming a filter the page is not applying.
   */
  canonicalSearch: string;
}) {
  const m = messages;

  /**
   * FINAL UX §01, WRITE side: opening an archive project stamps the return
   * context. Two fields of state - the active query and the clicked slug -
   * plus a marker for which control the reader eventually returns by.
   *
   * No scrollY. A pixel offset stops being true the moment the viewport, the
   * fonts, the filter or the archive itself changes; the card anchor answers
   * the same question in terms that survive all four.
   */
  const stamp = useCallback((slug: string) => {
    const store = safeSession();
    if (!store) return;
    try {
      store.setItem(
        WK_CTX_KEY,
        JSON.stringify({ search: window.location.search, slug, anchor: false }),
      );
    } catch {
      /* private mode - "<- WORK" falls back to the canonical archive */
    }
  }, []);

  /**
   * FINAL UX §01, READ side: bring the originating card back into view, then
   * consume the context.
   *
   * The positioning runs ONLY when the reader used the project's own "<- WORK"
   * control, which is what sets `anchor`. Browser Back leaves it false, so
   * native history restoration is never fought over - which §01 requires, and
   * which is strictly better than anything reconstructed here.
   *
   * The card is POSITIONED, not pixel-restored: block:"center" holds across
   * viewport width, font metrics, image loading and a growing archive, where a
   * stored offset does not. It is instant, so there is no travel to watch and
   * no race with a smooth scroll already in flight.
   */
  useEffect(() => {
    const store = safeSession();
    if (!store) return;
    let raw: string | null = null;
    try {
      raw = store.getItem(WK_CTX_KEY);
    } catch {
      return;
    }
    const ctx = parseWorkContext(raw);
    if (!ctx) return;
    // consumed on read, whatever happens next - one return journey, one use
    try {
      store.removeItem(WK_CTX_KEY);
    } catch {
      /* nothing to clean up */
    }
    let anchor = false;
    try {
      anchor = (JSON.parse(raw ?? "{}") as { anchor?: unknown }).anchor === true;
    } catch {
      anchor = false;
    }
    if (!anchor) return;
    // one frame, so the grid has laid out at its real width before we measure
    const id = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-dao-card="${CSS.escape(ctx.slug)}"]`);
      el?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  /**
   * FINAL UX §11: parseWorkFilter already ignores an unknown filter value and
   * renders the full archive - but the URL is then making a claim the page is
   * not honouring. The dead parameter is stripped with replaceState: no
   * redirect, no extra history entry, and the address bar agrees with the page.
   */
  useEffect(() => {
    if (window.location.search === canonicalSearch) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${canonicalSearch}${window.location.hash}`,
    );
  }, [canonicalSearch]);

  // Compose rows: 6-frame cycle → feature · pair · center · pair.
  const rows = useMemo(() => {
    const out: { kind: "feature" | "pair" | "center"; items: ArchiveItem[] }[] = [];
    let i = 0;
    while (i < items.length) {
      const step = out.length % 4;
      if (step === 0 || step === 2) {
        out.push({ kind: step === 0 ? "feature" : "center", items: [items[i]] });
        i += 1;
      } else {
        out.push({ kind: "pair", items: items.slice(i, i + 2) });
        i += 2;
      }
    }
    return out;
  }, [items]);

  const pad = (n: number) => String(n + 1).padStart(2, "0");
  let frameIndex = -1;

  if (items.length === 0) {
    return (
      <div className="dwk__empty">
        <p className="dao-work__title" style={{ fontSize: "clamp(24px,3vw,40px)" }}>
          {m.emptyTitle}
        </p>
        <p
          style={{ maxWidth: 420, fontSize: 13, lineHeight: 1.65, color: "rgba(242,237,227,.75)" }}
        >
          {m.emptyDesc}
        </p>
        <Link
          href={localeHref(locale, "/work")}
          className="dao-cta"
          style={{ color: "var(--dao-paper)" }}
        >
          {up(m.viewAll)} <span aria-hidden="true">→</span>
          <span
            className="dao-strike"
            style={{ background: "var(--dao-blue)" }}
            aria-hidden="true"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="dwk__archive">
      <span className="dwk__serpent dao-mask" aria-hidden="true" />
      {rows.map((row, r) => {
        if (row.kind === "feature") {
          const p = row.items[0];
          frameIndex += 1;
          const n = frameIndex;
          return (
            <InView key={p.slug} className="dwk__row--feature">
              {/* §09: the feature frame - brand red now, hence the rename off
                  "bluepaper" */}
              <div className="dwk__framepaper" aria-hidden="true">
                <div className="dao-grain--strong" />
              </div>
              <Frame
                p={p}
                locale={locale}
                big
                badge={m.caseStudy}
                n={`PRJ-${pad(n)}`}
                priority={r === 0}
                onOpen={stamp}
              >
                <span className="dwk__counter">
                  {pad(n)} / {pad(total - 1)}
                </span>
              </Frame>
            </InView>
          );
        }
        if (row.kind === "center") {
          const p = row.items[0];
          frameIndex += 1;
          return (
            <InView key={p.slug} className="dwk__row--center">
              <Frame p={p} locale={locale} n={`PRJ-${pad(frameIndex)}`} onOpen={stamp} />
            </InView>
          );
        }
        return (
          <InView
            key={row.items.map((p) => p.slug).join("-")}
            className={
              row.items.some((p) => p.disciplineId === "studio-lab")
                ? "dwk__row--labpair"
                : "dwk__row--pair"
            }
          >
            {row.items.map((p) => {
              frameIndex += 1;
              const n = frameIndex;
              if (p.disciplineId === "studio-lab") {
                return (
                  <div key={p.slug} className="dwk__labwrap">
                    <div className="dwk__greenpaper" aria-hidden="true">
                      <div className="dao-grain--strong" style={{ opacity: 0.45 }} />
                    </div>
                    <Frame p={p} locale={locale} n={`PRJ-${pad(n)}`} lab onOpen={stamp} />
                  </div>
                );
              }
              return (
                <Frame key={p.slug} p={p} locale={locale} n={`PRJ-${pad(n)}`} onOpen={stamp} />
              );
            })}
          </InView>
        );
      })}

      <div className="dwk__end">
        <div className="dao-grain" aria-hidden="true" />
        {/* #fff on blue: AA at label size, visually identical to paper */}
        <span className="dao-label" style={{ color: "#fff" }}>
          {up(format(m.end, { count: items.length }))}
        </span>
        <Link
          href={localeHref(locale, "/start-a-project")}
          className="dao-cta"
          style={{ color: "var(--dao-yellow)" }}
        >
          {up(m.startProduction)} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function Frame({
  p,
  locale,
  n,
  big,
  lab,
  badge,
  priority,
  onOpen,
  children,
}: {
  p: ArchiveItem;
  locale: Locale;
  n: string;
  big?: boolean;
  lab?: boolean;
  badge?: string;
  priority?: boolean;
  /** §01: stamp the return context on the way out of the archive */
  onOpen?: (slug: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={localeHref(locale, `/work/${p.slug}`)}
      className="dwk__frame"
      /* the anchor a "<- WORK" return journey scrolls back to (§01) */
      data-dao-card={p.slug}
      onClick={() => onOpen?.(p.slug)}
    >
      <Image
        src={p.cover}
        alt={p.alt}
        fill
        sizes={big ? "100vw" : "(max-width: 720px) 100vw, 60vw"}
        priority={priority}
        className="object-cover"
      />
      {badge ? (
        <span className="dwk__badge mo-d">
          {n} · {up(badge)}
        </span>
      ) : (
        <span className="dwk__id mo-d" style={{ ["--ls" as string]: "0em" }}>
          {n}
        </span>
      )}
      {lab && <span className="dwk__bloom dao-mask" aria-hidden="true" />}
      <span className="dwk__caption">
        {/* §P6: the archive listed twelve projects and offered exactly one
            heading - the page's own H1 - so there was no way to move between
            entries by heading. The project title is the heading of its entry,
            so it becomes one. `.dwk__name` already computes display:block with
            zero margin inside a flex caption, and preflight makes a heading
            inherit size and weight, so the swap is semantics only. */}
        {/* G - cropped horizontal reveal on desktop; the family becomes a
            C-style fade at <=768 on its own, so a wrapped title never clips */}
        <h2
          className="dwk__name mo-g"
          style={big ? undefined : { fontSize: "clamp(22px,2.4vw,34px)" }}
        >
          {p.title}
          <span className="dao-strike" aria-hidden="true" />
        </h2>
        <span className="dwk__meta mo-c" style={{ ["--d" as string]: "120ms" }}>
          <span className="dwk__tick" aria-hidden="true" />
          {p.role} · {p.discipline} · {p.year}
        </span>
      </span>
      {children}
    </Link>
  );
}
