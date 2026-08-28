"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "@/i18n";
import type { ServicesActMessages } from "@/i18n/slices";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { t } from "@/content/localized";
import {
  DAO_SERVICES,
  DAO_SERVICE_GROUPS,
  type CapabilityId,
  capabilityWorkHref,
} from "@/content/dao-services";
import { cn, up } from "@/lib/cn";
import { useInViewOnce } from "./hooks";

/**
 * What a capability can honestly show of itself, resolved on the server from the
 * credit data (see capabilityPreview in content/work-filters).
 *
 * `still` is null when no project is credited with the capability - the row then
 * offers the route without borrowing a photograph from unrelated work.
 */
export type CapabilityStill = {
  count: number;
  still: { src: string; alt: string } | null;
};

/**
 * Worked-example still. The lazy row image must never paint before it is fully
 * decoded: mobile Safari/Chrome fill the undecoded area with opaque white, which
 * flashes inside the shadowed fragment box. The wrapper stays transparent (paper
 * shows through) until load + decode, then reveals.
 */
function FragImage({
  src,
  alt,
  ready,
  onReady,
}: {
  src: string;
  alt: string;
  ready: boolean;
  onReady: () => void;
}) {
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
    <Image
      src={src}
      alt={alt}
      fill
      sizes="200px"
      className={cn("dao-svc__fragimg object-cover", ready && "is-ready")}
      // Cached images can finish before hydration attaches onLoad.
      ref={(img) => {
        if (img && !ready && img.complete) mark(img);
      }}
      onLoad={(e) => {
        if (!ready) mark(e.currentTarget);
      }}
    />
  );
}

/**
 * Act 04 - Services. Editorial typographic index on the brand-blue ground
 * (§05): four group headings, each above its own capability rows, set in the
 * strong editorial face (§06). A row opens to a plain-language explanation and
 * a worked example; hover indents with a pencil-weight hand-drawn underline in
 * that capability's own palette colour (§07/§08).
 *
 * §02: the worked example is a route, not just a picture. Opening a row reveals
 * the still, and the still is a link into that capability's own filtered
 * archive - /work?capability=<id>, built from the canonical id, the same mapping
 * the Services page uses. Three things make it behave:
 *
 *   - the row control is a <button> and the still is a <Link> in a SIBLING
 *     element, never inside it, so there is no nested interactive content;
 *   - the closed body is inert, so a collapsed row keeps its link out of the
 *     tab order and out of the accessibility tree entirely;
 *   - the row opens on click/Enter (aria-expanded), so nothing here depends on
 *     hover, and the link carries its own visible label and focus ring.
 *
 * A capability with no credited projects shows no photograph and still links to
 * its own archive, which answers honestly with nothing.
 */
export function ServicesAct({
  locale,
  messages,
  stills,
}: {
  locale: Locale;
  messages: ServicesActMessages;
  stills: Partial<Record<CapabilityId, CapabilityStill>>;
}) {
  const m = messages.services;
  const sectionRef = useInViewOnce<HTMLElement>(0.12);
  const [open, setOpen] = useState<string | null>("03"); // hover state shown captured in 1a
  // Stills that have finished load + decode stay ready for the session, so
  // revisiting a row reveals instantly without refetching.
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const markReady = (n: string) => setReady((r) => (r[n] ? r : { ...r, [n]: true }));

  const groupOf = (id: string) => DAO_SERVICE_GROUPS.find((g) => g.id === id)!;

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

      <h2 className="dao-svc__title dao-side" style={{ ["--x" as string]: "-60px", marginTop: 40 }}>
        {up(m.title)}
      </h2>

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
            const info = stills[s.id];
            const href = localeHref(locale, capabilityWorkHref(s.id));
            const name = t(s.name, locale);
            const shown = format(messages.projectsShown, {
              count: info?.count ?? 0,
            });
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
                      {name}
                      <span className="dao-strike" aria-hidden="true" />
                    </span>
                  </button>
                  {/* inert while collapsed: the body still occupies the grid at
                      0fr, so without this the still's link stays tabbable and
                      screen-reader reachable behind a closed row */}
                  <div className="dao-svc__body" inert={!isOpen}>
                    <div className="dao-svc__bodyin">
                      <div className="dao-svc__detail">
                        <p className="dao-svc__desc">{t(s.desc, locale)}</p>
                        {info?.still ? (
                          <Link
                            href={href}
                            className={cn("dao-svc__frag", ready[s.n] && "is-ready")}
                            data-dao-capability={s.id}
                            aria-label={`${m.previewCta}: ${name} (${shown})`}
                            title={info.still.alt}
                          >
                            <FragImage
                              src={info.still.src}
                              alt=""
                              ready={!!ready[s.n]}
                              onReady={() => markReady(s.n)}
                            />
                            {/* the still is a destination, and it says so -
                                nothing here is hover-only */}
                            <span className="dao-svc__fragcta" aria-hidden="true">
                              {up(m.previewCta)} <span>&rarr;</span>
                            </span>
                          </Link>
                        ) : (
                          /* no credited project, so no photograph is borrowed -
                             the route stays, and it is honest about the result */
                          <span className="dao-svc__fragnone">
                            <span className="dao-svc__fragnonetext">{m.previewEmpty}</span>
                            <Link
                              href={href}
                              className="dao-cta dao-svc__fragnonecta"
                              data-dao-capability={s.id}
                              aria-label={`${m.previewCta}: ${name} (${shown})`}
                            >
                              {up(m.previewCta)} <span aria-hidden="true">&rarr;</span>
                            </Link>
                          </span>
                        )}
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
          {up(m.all)} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
