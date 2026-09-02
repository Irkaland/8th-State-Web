import { MediaSlot } from "@/components/dao/MediaSlot";
import Link from "next/link";
import { type Locale, localeHref } from "@/i18n/locales";
import { t } from "@/content/localized";
import {
  DEPARTMENTS,
  SERVICES_COPY,
  SYSTEM_ROUTES,
  type Department,
} from "@/content/services-departments";
import { projectsSorted } from "@/content/projects";
import { capabilityHasWork } from "@/content/work-filters";
import { up } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { EditorialArrow } from "./EditorialArrow";

/**
 * THE SERVICES DOSSIER (approved Services design).
 *
 * A paper-dominant department file: an editorial opening, a red register of the
 * five departments, five chapters in the approved colour rhythm, the
 * production-line map, and a red closing.
 *
 * IT IS A SERVER COMPONENT, AND IT SHIPS NO CLIENT JAVASCRIPT AT ALL.
 *
 * The prototype held the viewport width in state, re-rendered on resize, and
 * rescanned the DOM with a MutationObserver. None of that survives here.
 * Every responsive decision is a media query, so nothing is measured during
 * render, there is no hydration risk, and the whole page - all five chapters,
 * every capability group - is readable with JavaScript switched off.
 *
 * The running department folio - a sticky strip of `01 AUDIOVISUAL … 05
 * GRAPHICS` with an active underline and an `01 / 05` counter - is gone with
 * this pass, and it was the page's only client component. It repeated, in a
 * second navigation vocabulary and permanently in the reader's way, what the
 * register at the top of the page already says once; the register's own
 * anchors do the travelling. Its reserved band went with it rather than being
 * left as air, so the opening now closes on its own bottom padding and chapter
 * 01 begins directly beneath it.
 *
 * ANCHORS
 * -------
 * Each chapter carries its canonical service id, and additionally the
 * capability ids it absorbs, so `/services#film-video-production` and the other
 * already-published capability links still land on the chapter that now covers
 * them. Placement itself is left entirely to FragmentEntry: nothing here
 * scrolls, and there is no second fragment system.
 */

/**
 * The credited archive, read once.
 *
 * VIEW RELATED WORK filters on a CAPABILITY, not one of the four broad
 * disciplines - that is the archive's own answer to "which service does this
 * project demonstrate", and it is what the previous catalogue used for exactly
 * this link. work-filters.ts says why: four broad categories cannot express
 * Scenography or Post-Production.
 *
 * The link is only drawn where following it lands on real projects. A
 * capability can be legitimate taxonomy and still have nothing credited to it
 * yet, and a link that promises related work and delivers an empty archive is a
 * dead end rather than a destination. Asked of the archive rather than
 * hardcoded, so it appears of its own accord the day that work is published.
 */
const ARCHIVE = projectsSorted();

/** the five ids the chapters themselves already carry */
const CANONICAL = new Set<string>(DEPARTMENTS.map((d) => d.anchor));

/** an imperfect ruled line, drawn rather than stroked */
function Rule({
  className,
  stroke = "#131210",
  opacity = 0.4,
}: {
  className?: string;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <svg className={className} viewBox="0 0 400 4" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 2.4 C60 1.5 130 3.1 190 2.1 C260 1.2 330 3 400 2.3"
        stroke={stroke}
        strokeWidth="1"
        fill="none"
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** the studio's drawn arrow, at the dossier's own sizes */
function Arrow({ className, stroke }: { className?: string; stroke?: string }) {
  return <EditorialArrow className={className} weight={1.3} stroke={stroke} />;
}

function Chapter({ d, locale, index }: { d: Department; locale: Locale; index: number }) {
  const name = t(d.service.name, locale);
  const related = d.relatedWork && capabilityHasWork(ARCHIVE, d.relatedWork) ? d.relatedWork : null;
  return (
    <>
      <Reveal
        as="section"
        id={d.anchor}
        data-dept={d.n}
        data-surface={d.surface}
        // the chrome reads the ground it is over: the blue and ink chapters are
        // dark grounds, and without this the chrome keeps its paper variant and
        // prints dark text on them
        data-dao-scene={d.surface === "paper" ? "light" : "dark"}
        className="dsvc__chapter"
        style={{ ["--accent" as string]: d.accent }}
        aria-labelledby={`dept-${d.anchor}`}
      >
        {/* The capability anchors this chapter absorbs, so published links land
            here. Three capabilities are spelled exactly like the chapter that
            absorbs them - production-design, photography, creative-direction -
            and those need no alias: the chapter's own id already answers them.
            Emitting one anyway would put the same id in the document twice. */}
        {d.absorbs
          .filter((c) => !CANONICAL.has(c))
          .map((c) => (
            <span key={c} id={c} className="dsvc__alias" aria-hidden="true" />
          ))}

        {/* the paper chapters take the printed stock the light surfaces of
            this page all carry. The blue and ink chapters deliberately do not:
            the grain multiplies, which cannot lift fibre out of a dark ground -
            their weave is already the material treatment approved for them. */}
        {d.surface === "paper" ? <div className="dao-grain--strong" aria-hidden="true" /> : null}
        <div className="dao-weave" aria-hidden="true" />
        <span className="dsvc__numeral" aria-hidden="true">
          {d.n}
        </span>

        <div className="dsvc__chaptermast mo-f">
          <span className="dsvc__file dsvc__file--accent">DEPT. {d.n} / 05</span>
          <span className="dsvc__file">{t(d.file, locale)}</span>
        </div>

        <h2 id={`dept-${d.anchor}`} className="dsvc__chaptertitle mo-b">
          {up(name)}
          <svg
            className="dsvc__chapterrule"
            viewBox="0 0 400 5"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 2.8 C70 1.4 150 3.8 230 2.3 C300 1.3 360 3.4 398 2.6"
              stroke={d.accent}
              strokeWidth="2.6"
              fill="none"
              opacity="0.9"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </h2>

        <div className="dsvc__lede">
          <p className="dsvc__desc mo-c">{t(d.desc, locale)}</p>
          <figure className="dsvc__plate">
            <span className="dsvc__plateimg">
              <MediaSlot
                src={d.service.plate.src}
                alt={t(d.service.plate.label, locale)}
                mark={t(SERVICES_COPY.imagePending, locale)}
                sizes="(max-width: 760px) 0px, 360px"
              />
              <span className="dao-grain" aria-hidden="true" />
            </span>
            <figcaption className="dsvc__platecap">
              <span>PL. {d.n}</span>
              <span>{up(t(d.service.plate.label, locale))}</span>
            </figcaption>
          </figure>
        </div>

        {/* No evidence strip. Photography used to carry three extra frames
            here - one wide selected frame and two from the sheet beside it -
            which made it the only department with four image positions while
            01, 02, 04 and 05 each had one. One department, one plate. */}

        <div className="dsvc__register">
          <div className="dsvc__registerhead">
            <span>{t(SERVICES_COPY.capabilityRegister, locale)}</span>
            <span>{t(d.groupCount, locale)}</span>
          </div>
          {/* the groups are static: a register is read, not performed (§22) */}
          <div className="dsvc__groups">
            {d.groups.map((grp) => (
              <div key={grp.key} className="dsvc__group">
                <span className="dsvc__grouphead">
                  <span className="dsvc__grouptitle">{t(grp.title, locale)}</span>
                  <span className="dsvc__groupkey">{grp.key}</span>
                </span>
                <span className="dsvc__groupitems">{t(grp.items, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dsvc__chapterfoot">
          <span className="dsvc__works">
            <span className="dsvc__workslabel">{t(SERVICES_COPY.worksWith, locale)}</span>
            <Arrow className="dsvc__worksarrow" />
            {d.worksWith.map((a) => {
              const target = DEPARTMENTS.find((x) => x.anchor === a);
              if (!target) return null;
              return (
                <Link key={a} href={`#${a}`} className="dsvc__workslink">
                  {target.n} {up(t(target.service.name, locale))}
                </Link>
              );
            })}
          </span>
          {/* only where a Work filter genuinely exists - 04 and 05 have none */}
          {related ? (
            <Link
              href={localeHref(locale, `/work?capability=${related}`)}
              className="dsvc__related"
            >
              {t(SERVICES_COPY.relatedWork, locale)}
              <Arrow className="dsvc__relatedarrow" />
            </Link>
          ) : null}
        </div>
      </Reveal>
      {index < DEPARTMENTS.length - 1 ? (
        <Rule className="dsvc__chapterbreak" opacity={0.3} />
      ) : null}
    </>
  );
}

/**
 * One step of a production-line route.
 *
 * A DEPARTMENT is printed as its number in that department's own colour plus
 * its short name, and links to its chapter. A WORKFLOW STAGE is printed
 * smaller and quieter, with no number and no link, because it is not a sixth
 * department and must never be mistaken for one - see SYSTEM_ROUTES.
 */
function RouteStep({
  step,
  locale,
}: {
  step: (typeof SYSTEM_ROUTES)[number]["steps"][number];
  locale: Locale;
}) {
  if (step.kind === "stage") {
    return <span className="dsvc__stage">{t(step.label, locale)}</span>;
  }
  const d = DEPARTMENTS.find((x) => x.anchor === step.anchor);
  if (!d) return null;
  return (
    <Link href={`#${d.anchor}`} className="dsvc__node">
      <span className="dsvc__noden">{d.n}</span>
      <span className="dsvc__nodename">{up(t(d.short, locale))}</span>
    </Link>
  );
}

export function ServicesDossier({ locale }: { locale: Locale }) {
  return (
    <div className="dsvc">
      {/* ===== OPENING ===== */}
      {/* §11 material: paper grain AND canvas weave, in that order - the light
          surfaces of this page carry the same printed stock the rest of the
          site does. The grain layer used to sit on .dsvc itself, where every
          section's own opaque background painted straight over it, so the
          off-white areas rendered as flat colour. It is applied per surface
          now, which is the only place it can actually be seen. */}
      <Reveal as="header" className="dsvc__open">
        <div className="dao-grain--strong" aria-hidden="true" />
        <div className="dao-weave" aria-hidden="true" />
        <svg className="dsvc__crop" viewBox="0 0 26 26" aria-hidden="true">
          <path
            d="M10 1 L10 10 L1 10 M16 25 L16 16 L25 16"
            stroke="#131210"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <div className="dsvc__mast mo-f">
          <span>{t(SERVICES_COPY.eyebrow, locale)}</span>
          <span className="dsvc__mastmid">{t(SERVICES_COPY.system, locale)}</span>
          <span className="dsvc__mastright">
            {t(SERVICES_COPY.dossier, locale)}
            <svg viewBox="0 0 11 11" aria-hidden="true" className="dsvc__mastcross">
              <path
                d="M5.6 0.8 L5.4 10.3 M0.7 5.7 L10.4 5.4"
                stroke="#d03e26"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <Rule className="dsvc__mastrule" />

        <div className="dsvc__band">
          <h1 className="dsvc__title mo-a mo-a--entry">{t(SERVICES_COPY.title, locale)}</h1>
          <div className="dsvc__lead">
            <p className="dsvc__intro mo-c">{t(SERVICES_COPY.intro, locale)}</p>
            <span className="dsvc__statement mo-c" style={{ ["--d" as string]: "120ms" }}>
              {t(SERVICES_COPY.statement, locale)}
            </span>
          </div>
        </div>

        {/* ===== DEPARTMENT REGISTER =====
            Printed on the brand red, on the same paper stock as everything
            else, so it reads as a red page bound into the file rather than a
            filled rectangle. Each row's number and square take
            `service.accent` - the colour the homepage already prints that
            department in - so a department has ONE colour across the site. */}
        <div className="dsvc__index" id="top-register">
          <span className="dao-grain--strong" aria-hidden="true" />
          <span className="dao-weave" aria-hidden="true" />
          <div className="dsvc__indexhead">
            <span>{t(SERVICES_COPY.registerTitle, locale)}</span>
            <span className="dsvc__indexcontents">{t(SERVICES_COPY.registerContents, locale)}</span>
          </div>
          {DEPARTMENTS.map((d, i) => (
            <Link
              key={d.anchor}
              href={`#${d.anchor}`}
              className="dsvc__row mo-d"
              // the department's own accent, except where the red ground
              // cannot carry it - see `onRed` in services-departments.ts
              style={{
                ["--d" as string]: `${i * 60}ms`,
                ["--n" as string]: d.onRed ?? d.service.accent,
              }}
              data-service={d.anchor}
            >
              <span className="dsvc__swatch" aria-hidden="true" />
              <span className="dsvc__rown">{d.n}</span>
              <span className="dsvc__rowname">{up(t(d.service.name, locale))}</span>
              {/* the contents-page leader: it is what makes the row read as
                  "this department ---- these capabilities" at a glance */}
              <span className="dsvc__rowlead" aria-hidden="true" />
              <span className="dsvc__rowtag">{t(d.tag, locale)}</span>
            </Link>
          ))}
        </div>
      </Reveal>

      {DEPARTMENTS.map((d, i) => (
        <Chapter key={d.anchor} d={d} locale={locale} index={i} />
      ))}

      {/* ===== SYSTEM MAP =====
          Four typical routes, each a run of steps rather than a sentence. The
          department steps are emphasised and linked; SHOOT and POST are drawn
          as the smaller secondary process labels they are, so nobody reads the
          studio as having six departments. */}
      <Reveal as="section" className="dsvc__map" aria-labelledby="services-map">
        <div className="dao-grain--strong" aria-hidden="true" />
        <div className="dao-weave" aria-hidden="true" />
        <div className="dsvc__maphead">
          <h2 className="dsvc__maptitle mo-f" id="services-map">
            {t(SERVICES_COPY.mapTitle, locale)}
          </h2>
          {/* two halves, each unbreakable - so the key can only ever wrap
              between the two definitions, never inside one */}
          <span className="dsvc__mapkey mo-f">
            <span>{t(SERVICES_COPY.mapKeyDept, locale)}</span>
            <span>{t(SERVICES_COPY.mapKeyStage, locale)}</span>
          </span>
        </div>
        <ol className="dsvc__routes" aria-label={t(SERVICES_COPY.mapRoutes, locale)}>
          {SYSTEM_ROUTES.map((r, i) => (
            <li
              key={r.key.en}
              className="dsvc__route mo-f"
              style={{ ["--d" as string]: `${i * 70}ms` }}
            >
              <span className="dsvc__routehead">
                <span className="dsvc__routekey">{t(r.key, locale)}</span>
                <span className="dsvc__routeout">{t(r.outcome, locale)}</span>
              </span>
              <span className="dsvc__routepath">
                {r.steps.map((s, j) => (
                  <span key={j} className="dsvc__step">
                    {j > 0 ? <Arrow className="dsvc__steparrow" /> : null}
                    <RouteStep step={s} locale={locale} />
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="dsvc__mapnote mo-c">{t(SERVICES_COPY.mapNote, locale)}</p>
      </Reveal>

      {/* ===== CLOSING ===== */}
      <Reveal
        as="section"
        className="dsvc__close"
        data-dao-scene="dark"
        aria-labelledby="services-close"
      >
        {/* the same stock the register is printed on, so the page's two reds
            are one material - the weave alone left this one reading as a fine
            digital mesh beside the register's fibre */}
        <div className="dao-grain--strong" aria-hidden="true" />
        <div className="dao-weave" aria-hidden="true" />
        <svg className="dsvc__closemark" viewBox="0 0 34 34" aria-hidden="true">
          <path
            d="M17 1 L17 33 M1 17 L33 17"
            stroke="#f2ede3"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M17 7 C23 7 27 11.5 26.8 17 C26.6 22.8 22.5 27 17 26.8 C11.5 26.6 7.2 22.3 7.4 16.8 C7.6 11.4 11.8 7.1 17 7 Z"
            stroke="#f2ede3"
            strokeWidth="1.1"
            fill="none"
          />
        </svg>
        <div className="dsvc__closeband">
          <p className="dsvc__closecopy mo-b" id="services-close">
            {t(SERVICES_COPY.closing, locale)}
          </p>
          <Link href={localeHref(locale, "/start-a-project")} className="dsvc__cta">
            {t(SERVICES_COPY.cta, locale)}
            <Arrow className="dsvc__ctaarrow" stroke="#f2ede3" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
