import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/i18n";
import { type Locale, localeHref } from "@/i18n/locales";
import { t } from "@/content/localized";
import { WHAT_WE_MAKE, serviceHref } from "@/content/what-we-make";
import { up } from "@/lib/cn";
import { Reveal } from "./Reveal";

/**
 * Act 04 - WHAT WE MAKE (approved production-dossier design).
 *
 * A printed dossier on the approved brand blue: masthead, hand-drawn rule,
 * title band, five service rows on their own rules, and a production chain
 * closing on ALL SERVICES. Behind it, at the lowest layer, a set of drafting
 * and production traces - a set plan, film-frame corners with an aspect
 * notation, contact-sheet frame numbers, a broadcast safe-area corner, a loose
 * pencil gesture, a registration mark and crop marks.
 *
 * IT IS A SERVER COMPONENT.
 *
 * The prototype decided at runtime, from window.innerWidth, whether to draw the
 * plates, the wide marks and the long keyword run. None of that is state: it is
 * presentation, and presentation belongs to CSS. Every responsive decision here
 * is a media query, so there is no width read during render, no resize
 * listener, no hydration risk, and not one byte of JavaScript for a section
 * that is a list of five links (§40/§42). The only client code it touches is
 * the shared reveal wrapper, which is the site's single observer.
 *
 * THE ROWS ARE REAL ROUTES.
 *
 * The prototype linked every row to a placeholder "#services". Each row now
 * goes to its own capability anchor inside the catalogue, built from the
 * canonical capability id - see content/what-we-make.ts for the one row that
 * has no capability to anchor to, and why the catalogue itself is the honest
 * destination for it rather than an invented anchor.
 */
export function WhatWeMake({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.services;

  return (
    <Reveal
      as="section"
      className="dao-wwm"
      /* the blue ground is a DARK scene - the global chrome reads its paper
         treatment from this, so it has to flip with the background */
      data-dao-scene="dark"
      id="services"
      aria-labelledby="wwm-title"
    >
      <div className="dao-grain--strong" aria-hidden="true" />
      <div className="dao-weave" aria-hidden="true" />

      {/* Production traces. Lowest layer, never over a text column, and all of
          it decorative: pointer-events none, out of the tab order and out of
          the accessibility tree (§43). The heavier marks are drawn only on
          wide viewports - the mobile composition keeps the registration mark
          and the crop corner and nothing else. */}
      <div className="dao-wwm__marks" aria-hidden="true">
        <svg className="dao-wwm__mark dao-wwm__mark--plan" viewBox="0 0 640 520">
          <path
            d="M40 60 L470 52 L476 350 L44 358 Z M40 60 L44 358 M212 56 L216 354 M212 200 L474 195 M330 54 L333 198"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 390 L212 386 M40 382 L40 398 M212 378 L212 394"
            strokeWidth="1"
            fill="none"
          />
          <text x="106" y="380" className="dao-wwm__marktext">
            420
          </text>
          <path
            d="M500 60 L502 348 M492 60 L508 60 M494 348 L510 348"
            strokeWidth="1"
            fill="none"
          />
          <text x="512" y="210" className="dao-wwm__marktext">
            310
          </text>
          <path
            d="M60 90 C140 120 190 170 200 190 M75 84 C160 108 220 150 250 186"
            strokeWidth="0.9"
            fill="none"
            opacity="0.7"
          />
          <text x="230" y="235" className="dao-wwm__marktext dao-wwm__marktext--wide">
            SET B — FLAT WALL
          </text>
        </svg>

        <svg className="dao-wwm__mark dao-wwm__mark--frame" viewBox="0 0 230 110">
          <path
            d="M4 26 L4 6 L26 5 M204 4 L226 4 L226 24 M226 84 L227 105 L206 105 M25 106 L4 106 L3 87"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M113 3 L113 12 M113 98 L113 107" strokeWidth="1" fill="none" />
          <text x="130" y="102" className="dao-wwm__marktext dao-wwm__marktext--wide">
            2.39 : 1
          </text>
        </svg>

        <svg className="dao-wwm__mark dao-wwm__mark--sheet" viewBox="0 0 150 40">
          <path
            d="M4 8 L4 32 M40 7 L40 31 M76 8 L76 32 M112 7 L112 31 M146 8 L146 32"
            strokeWidth="1"
            fill="none"
          />
          <text x="12" y="25" className="dao-wwm__marktext">
            24
          </text>
          <text x="48" y="24" className="dao-wwm__marktext">
            25
          </text>
          <text x="84" y="25" className="dao-wwm__marktext">
            26A
          </text>
        </svg>

        <svg className="dao-wwm__mark dao-wwm__mark--pencil" viewBox="0 0 300 150">
          <path
            d="M10 120 C70 40 160 20 240 55 M28 132 C90 60 170 40 252 70"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M240 55 C246 57 250 60 253 64 M240 55 C245 54 250 54 255 55"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <svg className="dao-wwm__mark dao-wwm__mark--safe" viewBox="0 0 260 120">
          <path
            d="M6 118 L6 24 L250 20 M6 60 L14 60 M60 22 L60 30 M130 21 L130 29 M200 21 L200 29"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <text x="18" y="44" className="dao-wwm__marktext dao-wwm__marktext--wide">
            SAFE 90%
          </text>
        </svg>

        {/* registration mark and crop corner - every width */}
        <svg className="dao-wwm__mark dao-wwm__mark--reg" viewBox="0 0 34 34">
          <path d="M17 1 L17 33 M1 17 L33 17" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path
            d="M17 7 C23 7 27 11.5 26.8 17 C26.6 22.8 22.5 27 17 26.8 C11.5 26.6 7.2 22.3 7.4 16.8 C7.6 11.4 11.8 7.1 17 7 Z"
            strokeWidth="1.1"
            fill="none"
          />
        </svg>
        <svg className="dao-wwm__mark dao-wwm__mark--crop" viewBox="0 0 26 26">
          <path
            d="M10 1 L10 10 L1 10 M16 25 L16 16 L25 16"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* masthead */}
      <div className="dao-wwm__mast">
        <span className="mo-f">04 — {up(m.act)}</span>
        <span className="dao-wwm__mastmid mo-f" style={{ ["--d" as string]: "80ms" }}>
          {up(m.departments)}
        </span>
        <span className="dao-wwm__mastright mo-f" style={{ ["--d" as string]: "160ms" }}>
          {up(m.dossier)}
          <svg viewBox="0 0 11 11" aria-hidden="true">
            <path
              d="M5.6 0.8 L5.4 10.3 M0.7 5.7 L10.4 5.4"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      <Rule className="dao-wwm__mastrule" />

      {/* title band */}
      <div className="dao-wwm__band">
        <h2 id="wwm-title" className="dao-wwm__title mo-a mo-a--entry">
          <span>{up(m.title)}</span>
        </h2>
        <p className="dao-wwm__lede mo-c" style={{ ["--d" as string]: "140ms" }}>
          {m.lede}
        </p>
      </div>

      {/* the five rows */}
      <div className="dao-wwm__rows">
        <Rule />
        {WHAT_WE_MAKE.map((s, i) => (
          <div key={s.id} style={{ display: "contents" }}>
            <Link
              href={localeHref(locale, serviceHref(s))}
              className="dao-wwm__row"
              id={s.id}
              data-dao-service={s.id}
              style={{ ["--g" as string]: s.accent }}
            >
              <span className="dao-wwm__n mo-d" style={{ ["--ls" as string]: "0.2em" }}>
                {s.n}
              </span>

              <span className="dao-wwm__body">
                <span className="dao-wwm__namewrap">
                  {/* G on desktop; the family becomes a C-style fade at <=768
                      on its own, so a wrapped Georgian title never clips */}
                  <span className="dao-wwm__name mo-g" style={{ ["--d" as string]: `${i * 60}ms` }}>
                    {up(t(s.name, locale))}
                  </span>
                  <svg
                    className="dao-wwm__namerule"
                    viewBox="0 0 400 4"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 2.3 C70 1.2 150 3.2 230 2 C300 1.1 360 2.9 398 2.2"
                      stroke={s.accent}
                      strokeWidth="2.4"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
                {/* One keyword run in the markup, two presentations. The long
                    run and the short one are both printed and CSS chooses; a
                    screen reader is given the long one and the short one is
                    aria-hidden, so the row is never read out twice. */}
                <span className="dao-wwm__kw mo-c" style={{ ["--d" as string]: "90ms" }}>
                  {up(t(s.keywords, locale))}
                </span>
                <span className="dao-wwm__kw dao-wwm__kw--short mo-c" aria-hidden="true">
                  {up(t(s.keywordsShort, locale))}
                </span>
              </span>

              {/* the production plate. Decorative: the caption beside it names
                  the plate, and the row's own title names the service, so a
                  meaningful alt here would only repeat text the reader has
                  already been given (§30). */}
              <span className="dao-wwm__plate">
                <span className="dao-wwm__plateimg">
                  <Image
                    src={s.plate.src}
                    alt=""
                    fill
                    sizes="(max-width: 1100px) 180px, 230px"
                    className="object-cover"
                  />
                  <span className="dao-wwm__plategrain" aria-hidden="true" />
                </span>
                <span className="dao-wwm__platecap">
                  <span>
                    {up(m.plate)} {s.n}
                  </span>
                  <span>{up(t(s.plate.label, locale))}</span>
                </span>
              </span>
            </Link>
            <Rule />
          </div>
        ))}
      </div>

      {/* foot - the production chain, and the way into the catalogue */}
      <div className="dao-wwm__foot">
        <span className="dao-wwm__chain">
          {m.chain.map((word, i) => (
            <span key={word}>
              {i > 0 && <Arrow />}
              {up(word)}
            </span>
          ))}
        </span>
        <Link href={localeHref(locale, "/services")} className="dao-wwm__all mo-h">
          {up(m.all)}
          <Arrow wide />
        </Link>
      </div>
    </Reveal>
  );
}

/** A hand-drawn horizontal rule - a drawn path, never a border. */
function Rule({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `dao-wwm__rule ${className}` : "dao-wwm__rule"}
      viewBox="0 0 400 4"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 2.2 C80 3.1 160 1.3 240 2.4 C310 3.2 360 1.8 400 2.5"
        strokeWidth="1"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The brand's drawn arrow. */
function Arrow({ wide }: { wide?: boolean }) {
  return (
    <svg
      className={wide ? "dao-wwm__arrow dao-wwm__arrow--wide" : "dao-wwm__arrow"}
      viewBox="0 0 46 12"
      aria-hidden="true"
    >
      <path
        d="M1 6.4 C14 5.6 28 6.8 43 5.9 M37.5 2.2 C39.6 3.7 41.7 5 44.2 5.9 C41.5 7.1 39.4 8.6 37.8 10.2"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
