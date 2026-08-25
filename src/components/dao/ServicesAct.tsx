"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { t } from "@/content/localized";
import { DAO_SERVICES, DAO_SERVICE_GROUPS } from "@/content/dao-services";
import { cn, up } from "@/lib/cn";
import { useInViewOnce } from "./hooks";

// Worked-example fragments per service (editorial placeholder media).
const FRAGMENTS: Record<string, string> = {
  "01": "/media/aom-cover.jpg",
  "02": "/media/berlin-editorial.jpg",
  "03": "/media/georgia-set.jpg",
  "04": "/media/glass-interiors.jpg",
  "05": "/media/pure-royal.jpg",
  "06": "/media/gastronome-kitchen.jpg",
  "07": "/media/volvo-film.jpg",
  "08": "/media/aom-gallery-1.jpg",
  "09": "/media/aom-film-still.jpg",
};

/**
 * Worked-example fragment. The lazy row image must never paint before it is
 * fully decoded: mobile Safari/Chrome fill the undecoded area with opaque
 * white, which flashes inside the shadowed fragment box. The wrapper stays
 * transparent (paper shows through) until load + decode, then reveals.
 */
function FragImage({ src, ready, onReady }: { src: string; ready: boolean; onReady: () => void }) {
  const mark = (img: HTMLImageElement) => {
    // next/image also fires onLoad for failed loads (decode() rejection is
    // swallowed upstream) - a broken image must keep the paper visible.
    if (!(img.naturalWidth > 0)) return;
    if (typeof img.decode === "function") {
      img.decode().then(onReady, onReady);
    } else {
      onReady();
    }
  };
  return (
    <div className={cn("dao-svc__frag", ready && "is-ready")} aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="200px"
        unoptimized={src === "/media/aom-cover.jpg"}
        className="object-cover"
        // Cached images can finish before hydration attaches onLoad.
        ref={(img) => {
          if (img && !ready && img.complete) mark(img);
        }}
        onLoad={(e) => {
          if (!ready) mark(e.currentTarget);
        }}
      />
    </div>
  );
}

/**
 * Act 04 - Services. Editorial typographic index on the brand-blue ground
 * (§05): group rail (four coloured layers) + nine capability rows set in the
 * strong editorial face (§06). A row opens to a plain-language explanation and
 * a worked-example fragment; hover indents with a pencil-weight hand-drawn
 * underline in that capability's own palette colour (§07/§08).
 */
export function ServicesAct({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.services;
  const sectionRef = useInViewOnce<HTMLElement>(0.12);
  const [open, setOpen] = useState<string | null>("03"); // hover state shown captured in 1a
  // Fragments that have finished load + decode stay ready for the session,
  // so revisiting a row reveals instantly without refetching.
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const markReady = (n: string) => setReady((r) => (r[n] ? r : { ...r, [n]: true }));

  const groupOf = (id: string) => DAO_SERVICE_GROUPS.find((g) => g.id === id)!;

  // Rows are rendered grouped on narrow screens (group heading rows inline,
  // 2a/2b) and as one continuous index with the rail on desktop.

  return (
    <section
      ref={sectionRef}
      className="dao-svc"
      /* §05: the blue ground is a DARK scene - the global chrome reads its
         paper treatment from this, so it has to flip with the background */
      data-dao-scene="dark"
      id="services"
      aria-label={m.act}
    >
      <div className="dao-grain--strong" aria-hidden="true" />
      <div className="dao-weave" aria-hidden="true" />

      {/* §02: the explanatory paragraph ("Nine capabilities, four kinds of
          work...") is gone, and so is the row that reserved space beside the
          title for it - the heading is now simply the heading, with no empty
          second column left behind. */}
      <h2 className="dao-svc__title dao-side" style={{ ["--x" as string]: "-60px", marginTop: 40 }}>
        {up(m.title)}
      </h2>

      {/* §03: the separate left taxonomy column is gone. Each group now names
          itself directly above the capabilities that belong to it - the
          behaviour mobile already had - so the reading order is group, layer,
          then that group's capabilities, at every width. */}
      <span
        className="dao-svc__ornament dao-mask"
        style={{ ["--m" as string]: "url(/assets/graphics/symbols-50.webp)" }}
        aria-hidden="true"
      />

      <div className="dao-svc__grid">
        {/* typographic index - groups interleaved with their capabilities */}
        <div className="dao-svc__list">
          {DAO_SERVICES.map((s, i) => {
            const g = groupOf(s.group);
            const isOpen = open === s.n;
            const showGroupHead = i === 0 || DAO_SERVICES[i - 1].group !== s.group;
            return (
              <div key={s.n} style={{ display: "contents" }}>
                {showGroupHead && (
                  <div className="dao-svc__grouphead">
                    <span className="dao-svc__groupname" style={{ color: g.onBlue }}>
                      {up(t(g.name, locale))}
                    </span>
                    <span className="dao-svc__grouplayer">{t(g.layer, locale)}</span>
                  </div>
                )}
                <div
                  className={cn("dao-svc__row", isOpen && "is-open")}
                  style={{
                    ["--g" as string]: s.accent,
                    ["--n" as string]: g.onBlue,
                    ["--tint" as string]: g.tint,
                  }}
                >
                  <button
                    type="button"
                    className="dao-svc__rowbtn"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : s.n)}
                  >
                    <span className="dao-svc__num" aria-hidden="true">
                      {s.n}
                    </span>
                    <span className="dao-svc__name">
                      {t(s.name, locale)}
                      <span className="dao-strike" aria-hidden="true" />
                    </span>
                  </button>
                  <div className="dao-svc__body">
                    <div className="dao-svc__bodyin">
                      <div className="dao-svc__detail">
                        <p className="dao-svc__desc">{t(s.desc, locale)}</p>
                        <FragImage
                          src={FRAGMENTS[s.n] ?? "/media/bts-set.jpg"}
                          ready={!!ready[s.n]}
                          onReady={() => markReady(s.n)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dao-svc__foot">
        <span className="dao-label dao-fade" style={{ color: "rgba(242,237,227,.72)" }}>
          {m.note}
        </span>
        <Link href={localeHref(locale, "/services")} className="dao-svc__all">
          {up(m.all)} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
