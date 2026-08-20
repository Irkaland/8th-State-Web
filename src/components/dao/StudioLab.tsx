"use client";

import Link from "next/link";
import type { Messages } from "@/i18n";
import { type Locale, localeHref } from "@/i18n/locales";
import { useInViewOnce } from "./hooks";
import { LabTickerRow } from "./LabTicker";
import { up } from "@/lib/cn";

/**
 * Act 05 - Studio Lab portal. Green room in the same house: the brand
 * olive #9DAB5C field (§07), cream botanicals grow in staggered (120ms)
 * after the sheet threshold, ink CTA with paint-stroke, Glacier ticker
 * (36s loop; paused under reduced motion).
 */
export function StudioLab({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.lab;
  const sectionRef = useInViewOnce<HTMLElement>(0.25);

  return (
    <section
      ref={sectionRef}
      className="dao-lab"
      data-dao-scene="dark"
      id="studio-lab"
      aria-label={m.act}
    >
      <div className="dao-weave" aria-hidden="true" />

      {/* botanicals - enter staggered after the green sheet rises */}
      <span
        className="dao-lab__rose dao-mask dao-fade"
        style={{ ["--d" as string]: "120ms" }}
        aria-hidden="true"
      />
      <span
        className="dao-lab__stem dao-mask dao-fade"
        style={{ ["--d" as string]: "240ms" }}
        aria-hidden="true"
      />
      <span
        className="dao-lab__bloom dao-mask dao-fade"
        style={{ ["--d" as string]: "360ms" }}
        aria-hidden="true"
      />

      <div className="dao-label dao-lab__label">{m.act}</div>

      <div className="dao-lab__body">
        <h2 className="dao-lab__title">
          {m.title.split(" ").map((word, i) => (
            <span key={i} className="dao-rise">
              <span style={{ ["--d" as string]: `${i * 90}ms` }}>{up(word)}</span>
            </span>
          ))}
        </h2>
        <p className="dao-lab__copy dao-fade" style={{ ["--d" as string]: "220ms" }}>
          {m.copy}
        </p>
        <div className="dao-lab__ctarow dao-fade" style={{ ["--d" as string]: "320ms" }}>
          {/* client-side Link, never a raw <a>: a raw anchor forces a full
              document load, which replays the Studio Ident (§03/§10) */}
          <Link
            href={localeHref(locale, "/studio-lab")}
            className="dao-lab__cta"
            aria-label={m.cta}
          >
            {up(m.cta)}
            <span className="dao-strike" aria-hidden="true" />
          </Link>
          <span className="dao-lab__wreath dao-mask" aria-hidden="true" />
        </div>
      </div>

      <div className="dao-lab__ticker" aria-hidden="true">
        <LabTickerRow words={m.ticker} />
      </div>
    </section>
  );
}
