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
 * Act 04 - Services. Editorial typographic index: group rail (four coloured
 * layers) + nine Adevas rows. A row opens to a plain-language explanation
 * and a worked-example fragment; hover indents with the group-coloured
 * paint-stroke underline (handoff 2g).
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
      data-dao-scene="light"
      id="services"
      aria-label={m.act}
    >
      <div className="dao-grain" aria-hidden="true" />
      {/* ink torn boundary - Selected Work resolves into black before the
          paper act begins (the blue never bridges the two grounds) */}
      <div
        className="dao-tear dao-tear--top"
        style={{ background: "var(--dao-ink)", height: "calc(var(--dao-tear-h) * 1.4)" }}
        aria-hidden="true"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
          marginTop: 40,
        }}
      >
        <h2 className="dao-svc__title dao-side" style={{ ["--x" as string]: "-60px" }}>
          {up(m.title)}
        </h2>
        <p className="dao-svc__intro dao-fade" style={{ ["--d" as string]: "150ms" }}>
          {m.intro}
        </p>
      </div>

      <div className="dao-svc__grid">
        {/* group rail - the four layers */}
        <div className="dao-svc__rail">
          {DAO_SERVICE_GROUPS.map((g, i) => (
            <div
              key={g.id}
              className="dao-svc__group dao-fade"
              style={{ ["--d" as string]: `${i * 90}ms` }}
            >
              <span className="dao-svc__groupname" style={{ color: g.colour }}>
                {up(t(g.name, locale))}
              </span>
              <span className="dao-svc__groupdesc">{t(g.layer, locale)}</span>
            </div>
          ))}
          <span
            className="dao-svc__ornament dao-mask"
            style={{ ["--m" as string]: "url(/assets/graphics/symbols-50.webp)" }}
            aria-hidden="true"
          />
        </div>

        {/* typographic index */}
        <div className="dao-svc__list">
          {DAO_SERVICES.map((s, i) => {
            const g = groupOf(s.group);
            const isOpen = open === s.n;
            const showGroupHead = i === 0 || DAO_SERVICES[i - 1].group !== s.group;
            return (
              <div key={s.n} style={{ display: "contents" }}>
                {showGroupHead && (
                  <div
                    className="dao-svc__grouphead dao-svc__grouphead--inline"
                    style={{ color: g.colour }}
                    aria-hidden="true"
                  >
                    {up(t(g.name, locale))} - {up(t(g.layer, locale))}
                  </div>
                )}
                <div
                  className={cn("dao-svc__row", isOpen && "is-open")}
                  style={{ ["--g" as string]: g.colour, ["--tint" as string]: g.tint }}
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
                      <span
                        className="dao-strike"
                        style={{ background: g.colour }}
                        aria-hidden="true"
                      />
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
        <span className="dao-label dao-fade" style={{ color: "rgba(108,62,19,.7)" }}>
          {m.note}
        </span>
        <Link href={localeHref(locale, "/services")} className="dao-svc__all">
          {up(m.all)} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
