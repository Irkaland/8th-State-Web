"use client";

import type { Messages } from "@/i18n";
import { type Locale, localeHref } from "@/i18n/locales";
import { useInViewOnce } from "./hooks";
import { up } from "@/lib/cn";

/**
 * Act 05 - Studio Lab portal. Green room in the same house: #126149 field,
 * botanicals grow in staggered (120ms) after the sheet threshold, mint CTA
 * with paint-stroke, Glacier ticker (36s loop; paused under reduced motion).
 */
export function StudioLab({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.lab;
  const sectionRef = useInViewOnce<HTMLElement>(0.25);
  const ticker = m.ticker.map((w) => up(w)).join(" ✳ ") + " ✳ ";

  return (
    <section
      ref={sectionRef}
      className="dao-lab"
      data-dao-scene="dark"
      id="studio-lab"
      aria-label={m.act}
    >
      <div className="dao-weave" aria-hidden="true" />
      {/* paper torn boundary from Services */}
      <div
        className="dao-tear dao-tear--top"
        style={{ background: "var(--dao-paper)" }}
        aria-hidden="true"
      />

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
          <a href={localeHref(locale, "/studio-lab")} className="dao-lab__cta" aria-label={m.cta}>
            {up(m.cta)}
            <span className="dao-strike" aria-hidden="true" />
          </a>
          <span className="dao-lab__wreath dao-mask" aria-hidden="true" />
        </div>
      </div>

      <div className="dao-lab__ticker" aria-hidden="true">
        <div className="dao-lab__tickerrow">
          <span>{ticker}</span>
          <span>{ticker}</span>
        </div>
      </div>
    </section>
  );
}
