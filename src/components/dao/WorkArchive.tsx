"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { InView } from "./InView";
import { up } from "@/lib/cn";

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
}: {
  locale: Locale;
  messages: Messages;
  items: ArchiveItem[];
  total: number;
}) {
  const m = messages.daoRoutes.work;

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
              <Frame p={p} locale={locale} n={`PRJ-${pad(frameIndex)}`} />
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
                    <Frame p={p} locale={locale} n={`PRJ-${pad(n)}`} lab />
                  </div>
                );
              }
              return <Frame key={p.slug} p={p} locale={locale} n={`PRJ-${pad(n)}`} />;
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
  children,
}: {
  p: ArchiveItem;
  locale: Locale;
  n: string;
  big?: boolean;
  lab?: boolean;
  badge?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link href={localeHref(locale, `/work/${p.slug}`)} className="dwk__frame">
      <Image
        src={p.cover}
        alt={p.alt}
        fill
        sizes={big ? "100vw" : "(max-width: 720px) 100vw, 60vw"}
        priority={priority}
        unoptimized={p.cover === "/media/aom-cover.jpg"}
        className="object-cover"
      />
      {badge ? (
        <span className="dwk__badge">
          {n} · {up(badge)}
        </span>
      ) : (
        <span className="dwk__id">{n}</span>
      )}
      {lab && <span className="dwk__bloom dao-mask" aria-hidden="true" />}
      <span className="dwk__caption">
        <span
          className="dwk__name"
          style={big ? undefined : { fontSize: "clamp(22px,2.4vw,34px)" }}
        >
          {p.title}
          <span className="dao-strike" aria-hidden="true" />
        </span>
        <span className="dwk__meta">
          <span className="dwk__tick" aria-hidden="true" />
          {p.role} · {p.discipline} · {p.year}
        </span>
      </span>
      {children}
    </Link>
  );
}
