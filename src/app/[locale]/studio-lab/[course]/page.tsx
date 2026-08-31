import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale, LOCALES } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { labCourseBySlug, labCourseSlugs } from "@/content/lab-courses";
import { DaoShell } from "@/components/dao/DaoShell";
import {
  DisciplineIcon,
  LabArrow,
  LabBotanical,
  LabStain,
  LabTexture,
  MediaFigure,
  PencilRule,
} from "@/components/dao/LabKit";
import { LabRegisterButton, LabRegistrationProvider } from "@/components/dao/LabRegistration";
import { cn, up } from "@/lib/cn";

/** Four sheets, two locales - all eight are pre-rendered. */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => labCourseSlugs().map((course) => ({ locale, course })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}): Promise<Metadata> {
  const { locale, course } = await params;
  const m = getMessages(locale);
  const c = labCourseBySlug(course);
  if (!c) return { title: m.dao.nav.lab };
  const loc = (isLocale(locale) ? locale : "en") as Locale;
  return {
    title: `${t(c.name, loc)} - ${m.dao.nav.lab}`,
    description: t(c.blurb, loc),
    alternates: routeAlternates(locale, `/studio-lab/${c.slug}`),
  };
}

/**
 * /studio-lab/[course] - the reusable course sheet.
 *
 * One template, four courses. Everything that differs between them - the mark,
 * the numbering system (M. / ST. / FR.), the module list, the practical sheet
 * and the handwritten line - is data in `@/content/lab-courses`, so a fifth
 * course is a content edit and needs no code.
 *
 * The practical sheet is where the studio's unconfirmed facts live. A row
 * carrying `tbd` renders at the lower ink the handoff specifies; none of those
 * values is invented to look complete.
 */
export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; course: string }>;
}) {
  const { locale: raw, course } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const c = labCourseBySlug(course);
  if (!c) notFound();
  const m = getMessages(locale);
  const R = m.daoRoutes.lab;

  return (
    <DaoShell locale={locale} messages={m} veil="green" footer footerGround="dark">
      {/* the same registration file the Lab index opens, on every sheet */}
      <LabRegistrationProvider locale={locale}>
        <div className="dao-page dsc" data-dao-scene="dark" id="top">
          <LabTexture />
          <LabStain style={{ right: "-200px", top: "200px", width: "800px", opacity: 0.045 }} />

          {/* masthead */}
          <div className="dsc__mast">
            <Link href={localeHref(locale, "/studio-lab")} className="dsc__back">
              ← {up(R.backToLab)}
            </Link>
            <span className="dsc__mastmid">
              {up(R.courseSheet)} · {c.no}
            </span>
            <span>{up(t(c.discLabel, locale))}</span>
          </div>
          <PencilRule variant="a" opacity={0.36} className="dsc__mastrule" />

          {/* ------------------------------------------------------- hero -- */}
          <section className="dsc__hero">
            <div className="dsc__herobody">
              <div className="dsc__kicker">
                <DisciplineIcon icon={c.icon} rot={-1.5} weight={1.15} className="dsl-icon--md" />
                <span>{up(t(c.kicker, locale))}</span>
              </div>
              <h1 className="dsc__title">{t(c.name, locale)}</h1>
              <p className="dsc__blurb">{t(c.blurb, locale)}</p>
              <div className="dsl__meta">
                <span>
                  <span className="dsl__metak">{up(R.lecturerLabel)}</span>
                  <span>{c.lecturer}</span>
                </span>
                <span>
                  <span className="dsl__metak">{up(R.formatLabel)}</span>
                  <span className={cn("dsl__pre", c.formatTbd && "is-tbd")}>
                    {t(c.format, locale)}
                  </span>
                </span>
                <span>
                  <span className="dsl__metak">{up(R.disciplineLabel)}</span>
                  <span>{t(c.disc, locale)}</span>
                </span>
              </div>
              <LabRegisterButton course={c.id} className="dsl__cta">
                {up(R.registerForCourse)}
                <LabArrow />
              </LabRegisterButton>
            </div>
            <div className="dsc__heromedia">
              <MediaFigure
                ratio="16 / 10"
                pending={R.coursePending}
                caption={up(R.courseCaption)}
                meta={c.no}
              />
            </div>
          </section>

          {/* --------------------------------------------- who / learn ---- */}
          <section className="dsc__two" aria-label={R.whoLabel}>
            <div className="dsc__col">
              <span className="dsc__collabel">{up(R.whoLabel)}</span>
              <PencilRule variant="d" opacity={0.3} />
              <ul className="dsc__list">
                {c.who.map((w) => (
                  <li key={w.en}>{t(w, locale)}</li>
                ))}
              </ul>
            </div>
            <div className="dsc__col">
              <span className="dsc__collabel">{up(R.learnLabel)}</span>
              <PencilRule variant="c" opacity={0.3} />
              <ul className="dsc__list">
                {c.learn.map((l) => (
                  <li key={l.en}>{t(l, locale)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------------------------------------------- full program --- */}
          <section className="dsc__program" aria-labelledby="dsc-program">
            <span className="dsc__programorn" aria-hidden="true">
              <LabBotanical src="/assets/graphics/stem.webp" />
            </span>
            <div className="dsl-head">
              <span className="dsl-head__l">
                <h2 className="dsl-head__h" id="dsc-program">
                  {up(R.programLabel)}
                </h2>
              </span>
              <span className="dsl-head__r">{up(t(c.programNote, locale))}</span>
            </div>
            <PencilRule variant="a" opacity={0.34} className="dsl-head__rule" />
            <div className="dsc__modules">
              {c.program.map((mod) => (
                <div key={mod.n} className="dsc__modwrap">
                  <div className="dsc__mod">
                    <span className="dsc__modn" aria-hidden="true">
                      {mod.n}
                    </span>
                    <span className="dsc__modt">{up(t(mod.title, locale))}</span>
                    <span className="dsc__modnote">{up(t(mod.note, locale))}</span>
                  </div>
                  <PencilRule variant="b" opacity={0.24} short />
                </div>
              ))}
            </div>
            <span className="dsc__hand" aria-hidden="true">
              {t(c.annotation, locale)}
            </span>
          </section>

          {/* -------------------------------------------- practical sheet -- */}
          <section className="dsc__sheet" aria-labelledby="dsc-sheet">
            <div className="dsl-head">
              <span className="dsl-head__l">
                <h2 className="dsl-head__h" id="dsc-sheet">
                  {up(R.practicalLabel)}
                </h2>
              </span>
              <span className="dsl-head__r">{up(R.practicalContext)}</span>
            </div>
            <PencilRule variant="d" opacity={0.34} className="dsl-head__rule" />
            <dl className="dsc__sheetgrid">
              {c.sheet.map((s) => (
                <div key={s.key.en} className="dsc__sheetcell">
                  <dt className="dsc__sheetk">{up(t(s.key, locale))}</dt>
                  <dd className={cn("dsc__sheetv", s.tbd && "is-tbd")}>{t(s.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ---------------------------------------------------- register -- */}
          <section className="dsc__register" id="register" aria-labelledby="dsc-register">
            <span className="dsc__registerorn" aria-hidden="true">
              <LabBotanical src="/assets/graphics/floral-rose.webp" />
            </span>
            <PencilRule variant="c" opacity={0.34} />
            <div className="dsc__reggrid">
              <h2 className="dsc__regtitle" id="dsc-register">
                {up(R.registerTitle)}
              </h2>
              <div className="dsc__regbody">
                <p className="dsc__regcopy">{R.courseRegisterCopy}</p>
                <LabRegisterButton course={c.id} className="dsl__regcta">
                  {up(R.beginRegistration)}
                  <LabArrow />
                </LabRegisterButton>
              </div>
            </div>
          </section>

          <footer className="dsc__foot">
            <PencilRule variant="d" opacity={0.34} />
            <div className="dsl__footrow">
              <span>{up(R.footerMark)}</span>
              <Link href={localeHref(locale, "/studio-lab")} className="dsl__footlink">
                ← {up(R.allCourses)}
              </Link>
              <span>{up(R.city)}</span>
            </div>
          </footer>
        </div>
      </LabRegistrationProvider>
    </DaoShell>
  );
}
