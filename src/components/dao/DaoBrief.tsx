"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { InView } from "./InView";
import { cn, up } from "@/lib/cn";

/**
 * /start-a-project - tactile production brief (handoff 4e). Four paper
 * sheets dealt one by one (80ms); everything optional except how to reach
 * you. Handwriting-scale Adevas inputs; selection draws a blue stroke;
 * error summary receives focus on failed submission; confirmation states
 * the approved response copy. Submission is simulated in-browser exactly
 * like the previous approved brief (no production backend in this phase).
 */
export function DaoBrief({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.daoRoutes.brief;
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const chips = [
    { id: "film-video", label: m.chipFilm },
    { id: "photography", label: m.chipPhoto },
    { id: "production-spatial", label: m.chipSpatial },
    { id: "post-production", label: m.chipPost },
    { id: "studio-lab", label: m.chipLab, lab: true },
    { id: "not-sure", label: m.chipUnsure },
  ];

  const toggle = (id: string) =>
    setDisciplines((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const done = [
    disciplines.length > 0,
    about.trim().length > 0,
    when.trim().length > 0 || where.trim().length > 0,
    name.trim().length > 0 && /.+@.+\..+/.test(email),
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!done[3]) {
      setError(m.errorSummary);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setError(null);
    setSent(true);
  };

  if (sent) {
    const s = messages.brief.success;
    return (
      <div className="dbr__sheets" role="status">
        <div className="dao-sheet dbr__sheet dbr__sheet--cream is-in dbr__deal">
          <div className="dbr__sheethead">
            <span className="dbr__num">✳</span>
            <span className="dbr__q">{s.title}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(19,18,16,.75)", maxWidth: 560 }}>
            {s.desc}
          </p>
          {/* v7 5g: official mark printed on the confirmation sheet,
              print-registration settle on entrance */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand/8th-state-logo-mark.png"
            alt=""
            aria-hidden="true"
            className="dbr__successmark"
          />
        </div>
      </div>
    );
  }

  return (
    <form className="dbr__sheets" onSubmit={submit} noValidate>
      {/* header progress strokes */}
      <div className="dbr__progress" aria-label={m.progress} style={{ alignSelf: "flex-start" }}>
        <span className="dao-label" style={{ color: "rgba(242,237,227,.6)", marginRight: 10 }}>
          {up(m.progress)}
        </span>
        {done.map((d, i) => (
          <span key={i} className={cn("dbr__prog", d && "is-done")} />
        ))}
      </div>

      {/* sheet 01 - what are we making? */}
      <InView threshold={0.1}>
        <fieldset
          className="dao-sheet dbr__sheet dbr__sheet--cream dbr__deal"
          style={{ border: 0, margin: 0 }}
        >
          <span className="dbr__sheetstar dao-mask" aria-hidden="true" />
          <legend className="sr-only">{m.q1}</legend>
          <div className="dbr__sheethead">
            <span className="dbr__num" aria-hidden="true">
              01
            </span>
            <span className="dbr__q">{m.q1}</span>
          </div>
          <div className="dbr__chips">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn("dbr__chip", c.lab && "dbr__chip--lab")}
                aria-pressed={disciplines.includes(c.id)}
                onClick={() => toggle(c.id)}
              >
                {up(c.label)}
                <span className="dao-strike" aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
      </InView>

      {/* sheet 02 - tell us about it */}
      <InView threshold={0.1}>
        <div
          className="dao-sheet dbr__sheet dbr__sheet--cream dbr__deal"
          style={{ ["--d" as string]: "80ms" }}
        >
          <div className="dbr__sheethead">
            <span className="dbr__num" aria-hidden="true">
              02
            </span>
            <label className="dbr__q" htmlFor="brief-about">
              {m.q2}
            </label>
          </div>
          <textarea
            id="brief-about"
            className="dbr__write"
            rows={3}
            placeholder={m.q2Placeholder}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
      </InView>

      {/* sheet 03 - timing & place */}
      <InView threshold={0.1}>
        <div
          className="dao-sheet dbr__sheet dbr__sheet--cream dbr__deal"
          style={{ ["--d" as string]: "160ms" }}
        >
          <div className="dbr__sheethead">
            <span className="dbr__num" aria-hidden="true">
              03
            </span>
            <span className="dbr__q">{m.q3}</span>
          </div>
          <div className="dbr__grid2">
            <div className="dbr__field">
              <label className="dbr__fieldlabel" htmlFor="brief-when">
                {up(m.when)}
              </label>
              <input
                id="brief-when"
                className="dbr__write dbr__write--small"
                placeholder={m.whenPlaceholder}
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
            <div className="dbr__field">
              <label className="dbr__fieldlabel" htmlFor="brief-where">
                {up(m.where)}
              </label>
              <input
                id="brief-where"
                className="dbr__write dbr__write--small"
                placeholder={m.wherePlaceholder}
                value={where}
                onChange={(e) => setWhere(e.target.value)}
              />
            </div>
          </div>
        </div>
      </InView>

      {/* sheet 04 - how do we reach you? */}
      <InView threshold={0.1}>
        <div
          className="dao-sheet dbr__sheet dbr__sheet--cream dbr__deal"
          style={{ ["--d" as string]: "240ms" }}
        >
          <div className="dbr__sheethead">
            <span className="dbr__num" aria-hidden="true">
              04
            </span>
            <span className="dbr__q">{m.q4}</span>
          </div>
          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="dbr__error"
              style={{ marginBottom: 20 }}
            >
              {error}
            </div>
          )}
          <div className="dbr__grid2">
            <div className="dbr__field">
              <label className="dbr__fieldlabel" htmlFor="brief-name">
                {up(m.name)} *
              </label>
              <input
                id="brief-name"
                className="dbr__input"
                autoComplete="name"
                required
                aria-invalid={error ? name.trim().length === 0 : undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="dbr__field">
              <label className="dbr__fieldlabel" htmlFor="brief-email">
                {up(m.email)} *
              </label>
              <input
                id="brief-email"
                className="dbr__input"
                type="email"
                autoComplete="email"
                required
                aria-invalid={error ? !/.+@.+\..+/.test(email) : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              marginTop: 30,
              flexWrap: "wrap",
            }}
          >
            <button type="submit" className="dbr__send">
              {up(m.send)}
              <span
                className="dao-chipcta__glyph dao-mask"
                style={{
                  ["--m" as string]: "url(/assets/graphics/star-solid.webp)",
                  right: -14,
                  top: -14,
                  width: 30,
                  height: 30,
                }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </InView>

      <div className="dbr__foot" style={{ padding: 0, border: 0 }}>
        <span className="dao-label" style={{ color: "rgba(242,237,227,.6)" }}>
          {up(m.justTalk)}
        </span>
        <Link
          href={localeHref(locale, "/contact")}
          className="dao-cta"
          style={{ color: "var(--dao-paper)", fontSize: 10.5 }}
        >
          {up(m.contactStudio)} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </form>
  );
}
