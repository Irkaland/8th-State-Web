import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import {
  LAB_DISCIPLINES,
  LAB_ECOSYSTEM,
  LAB_FACULTY,
  LAB_FEATURED_INDEX,
  LAB_PROGRAM,
  labCourseBySlug,
} from "@/content/lab-courses";
import { DaoShell } from "@/components/dao/DaoShell";
import {
  DisciplineIcon,
  LabArrow,
  LabBotanical,
  LabCross,
  LabIndex,
  LabSectionHead,
  LabStain,
  LabTexture,
  MediaFigure,
  PencilRule,
} from "@/components/dao/LabKit";
import { cn, up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.dao.nav.lab,
    description: m.daoRoutes.lab.copy,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/studio-lab"),
  };
}

/**
 * /studio-lab - the approved Studio Lab, sections 01-11.
 *
 * The experimental room as an editorial sheet: an olive ground under the Lab
 * texture stack, pencil rules instead of borders, drawn discipline marks, and
 * static cropped botanicals. Every course row and index row is a whole-row
 * link; the only motion is a 12-14px shift on hover and the CTA arrow drifting
 * right, both pure CSS.
 *
 * SUPERSEDES the earlier field-notes page (cream sheets, filter row, marquee).
 *
 * This is a server component. Course content lives in `@/content/lab-courses`
 * and page copy in the dictionary, so nothing here reaches for the client.
 */
export default async function StudioLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.lab;

  const photography = labCourseBySlug("photography")!;
  const portfolio = labCourseBySlug("portfolio")!;
  const film = labCourseBySlug("film")!;
  const href = (slug: string) => localeHref(locale, `/studio-lab/${slug}`);
  const courseName = (slug: string) => t(labCourseBySlug(slug)!.name, locale);

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="green"
      returnTab={{ label: up(m.nav.studio), parent: "/studio" }}
    >
      <div className="dao-page dsl" data-dao-scene="dark" id="top">
        <LabTexture />

        {/* ================================================= 01 · HERO === */}
        <section className="dsl__hero">
          <LabStain style={{ left: "30%", top: "-160px", width: "820px", opacity: 0.045 }} />

          <div className="dsl__mast">
            <span>{up(R.mastheadLeft)}</span>
            <span className="dsl__mastmid">{up(R.mastheadMid)}</span>
            <span className="dsl__mastr">
              {up(R.city)}
              <LabCross />
            </span>
          </div>
          <PencilRule variant="a" opacity={0.36} className="dsl__mastrule" />

          <span className="dsl__heroorn" aria-hidden="true">
            <LabBotanical src="/assets/graphics/floral-rose.webp" />
          </span>

          <div className="dsl__herobody">
            <div className="dsl__lede">
              <h1 className="dsl__title">
                <span>{up(R.titleLine1)}</span>
                <span>{up(R.titleLine2)}</span>
              </h1>
              <p className="dsl__copy">{R.copy}</p>
              <div className="dsl__heroctas">
                <a href="#register" className="dsl__cta">
                  {up(R.beginRegistration)}
                  <LabArrow />
                </a>
                <a href="#program" className="dsl__ctaquiet">
                  {up(R.viewProgram)}
                </a>
              </div>
            </div>

            <div className="dsl__herorows">
              {LAB_DISCIPLINES.map((d, i) => (
                <div key={d.id} className="dsl__herorowwrap">
                  {i > 0 ? <PencilRule variant={i === 1 ? "b" : "c"} opacity={0.3} /> : null}
                  <a href={d.href} className="dsl__herorow">
                    <span className="dsl__rowno" aria-hidden="true">
                      {d.n}
                    </span>
                    <DisciplineIcon icon={d.id} rot={d.rot} />
                    <span className="dsl__rowtext">
                      <span className="dsl__rowname">{up(t(d.name, locale))}</span>
                      <span className="dsl__rowsub">{t(d.sub, locale)}</span>
                    </span>
                  </a>
                </div>
              ))}
              <p className="dsl__heroindex" aria-hidden="true">
                {R.heroIndex.map((w) => (
                  <span key={w}>{up(w)}</span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================== 02 · THE LAB === */}
        <section className="dsl__about" id="about" aria-labelledby="dsl-s02">
          <LabSectionHead
            n="02"
            label={R.s02Label}
            context={R.s02Context}
            variant="d"
            headingId="dsl-s02"
          />
          <div className="dsl__aboutgrid">
            <div className="dsl__aboutmain">
              <p className="dsl__statement">{R.s02Statement}</p>
              {/* the approved handwritten annotation, with its registration cross */}
              <span className="dsl__hand" aria-hidden="true">
                <LabCross />
                <span className="dsl__handtext">
                  <span>{R.s02Annotation1}</span>
                  <span>{R.s02Annotation2}</span>
                  <span>{R.s02Annotation3}</span>
                </span>
              </span>
            </div>
            <div className="dsl__aboutside">
              <MediaFigure
                ratio="4 / 3"
                pending={R.roomPending}
                caption={up(R.roomCaption)}
                meta={up(R.roomMeta)}
              />
              <p className="dsl__keywords">
                {R.s02Keywords.map((k) => (
                  <span key={k}>{up(k)}</span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================== 03 · DISCIPLINES === */}
        <section className="dsl__disc" id="disciplines" aria-labelledby="dsl-s03">
          <LabSectionHead
            n="03"
            label={R.s03Label}
            context={R.s03Context}
            variant="c"
            headingId="dsl-s03"
          />
          {LAB_DISCIPLINES.map((d) => (
            <div key={d.id} className="dsl__discwrap">
              <a href={d.href} className="dsl__discrow">
                <span className="dsl__discno" aria-hidden="true">
                  {d.n}
                </span>
                <DisciplineIcon icon={d.id} rot={d.rot} weight={1.15} className="dsl-icon--lg" />
                <span className="dsl__discname">{up(t(d.name, locale))}</span>
                <span className="dsl__discmeta">
                  <span>{t(d.courses, locale)}</span>
                  <span className="dsl__discnote">{up(t(d.note, locale))}</span>
                </span>
              </a>
              <PencilRule variant="b" opacity={0.3} />
            </div>
          ))}
        </section>

        {/* ======================================== 04 · CURRENT PROGRAM === */}
        <section className="dsl__program" id="program" aria-labelledby="dsl-s04">
          <span className="dsl__programorn" aria-hidden="true">
            <LabBotanical src="/assets/graphics/stem.webp" />
          </span>
          <div className="dsl-head">
            <span className="dsl-head__l">
              <span aria-hidden="true">04 - </span>
              <span>{R.s04Label}</span>
            </span>
            <span className="dsl-head__r">{R.s04Context}</span>
          </div>
          <h2 className="dsl__programtitle" id="dsl-s04">
            {up(R.programTitle)}
          </h2>

          <div className="dsl__cols" aria-hidden="true">
            <span>{up(R.colNo)}</span>
            <span>{up(R.colCourse)}</span>
            <span>{up(R.colLecturer)}</span>
            <span>{up(R.colFormat)}</span>
            <span />
          </div>
          <PencilRule variant="d" opacity={0.34} />

          {LAB_PROGRAM.map((p) => (
            <div key={p.slug} className="dsl__prowrap">
              <Link href={href(p.slug)} className="dsl__prow">
                <span className="dsl__prno" aria-hidden="true">
                  {p.n}
                </span>
                <span className="dsl__prname">
                  <span className="dsl__prtitle">{courseName(p.slug)}</span>
                  <span className="dsl__prdisc">{up(t(p.disc, locale))}</span>
                </span>
                <span className="dsl__prlect">{labCourseBySlug(p.slug)!.lecturer}</span>
                <span className={cn("dsl__prfmt", p.formatTbd && "is-tbd")}>
                  {t(p.format, locale)}
                </span>
                <span className="dsl__prreg">
                  {up(R.register)}
                  <LabArrow weight={1.4} />
                </span>
                {/* the mobile composition folds the same fields into 3 lines */}
                <span className="dsl__prmeta" aria-hidden="true">
                  <span>
                    {p.n} · {up(t(p.disc, locale))}
                  </span>
                  <span className={p.formatTbd ? "is-tbd" : undefined}>
                    {up(t(p.formatShort, locale))}
                  </span>
                </span>
              </Link>
              <PencilRule variant="b" opacity={0.3} />
            </div>
          ))}
          <p className="dsl__profoot">{up(R.programFootnote)}</p>
        </section>

        {/* ========================================== 05 · FEATURED COURSE === */}
        <section className="dsl__feat" id="featured" aria-labelledby="dsl-s05">
          <LabSectionHead n="05" label={R.s05Label} context={R.s05Context} variant="a" />
          <div className="dsl__featgrid">
            <div className="dsl__featmedia">
              <MediaFigure
                ratio="4 / 5"
                pending={R.featuredPending}
                caption={up(R.featuredCaption)}
                meta={up(R.featuredMeta)}
              />
            </div>
            <div className="dsl__featbody">
              <h2 className="dsl__feattitle" id="dsl-s05">
                {t(photography.name, locale)}
              </h2>
              <div className="dsl__meta">
                <span>
                  <span className="dsl__metak">{up(R.lecturerLabel)}</span>
                  <span>{photography.lecturer}</span>
                </span>
                <span>
                  <span className="dsl__metak">{up(R.formatLabel)}</span>
                  <span className="dsl__pre">{t(photography.format, locale)}</span>
                </span>
                <span>
                  <span className="dsl__metak">{up(R.disciplineLabel)}</span>
                  <span>{t(photography.disc, locale)}</span>
                </span>
              </div>
              <div className="dsl__featindex">
                {LAB_FEATURED_INDEX.map((f) => (
                  <div key={f.n} className="dsl__featrowwrap">
                    <div className="dsl__featrow">
                      <span className="dsl__featn" aria-hidden="true">
                        {f.n}
                      </span>
                      <span className="dsl__featt">{up(t(f.title, locale))}</span>
                      <span className="dsl__featnote">{up(t(f.note, locale))}</span>
                    </div>
                    <PencilRule variant="b" opacity={0.24} short />
                  </div>
                ))}
              </div>
              <Link href={href("photography")} className="dsl__cta">
                {up(R.openSheet)}
                <LabArrow />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================= 06 · PORTFOLIO === */}
        <section className="dsl__folio" id="portfolio" aria-labelledby="dsl-s06">
          <span className="dsl__folioorn" aria-hidden="true">
            <LabBotanical src="/assets/graphics/bloom.webp" />
          </span>
          <LabSectionHead n="06" label={R.s06Label} context={R.s06Context} variant="c" />
          <div className="dsl__foliogrid">
            <div className="dsl__foliolede">
              <h2 className="dsl__foliotitle" id="dsl-s06">
                {t(portfolio.name, locale)}
              </h2>
              <p className="dsl__foliocopy">{t(portfolio.blurb, locale)}</p>
              <span className="dsl__lect">
                {portfolio.lecturer} {R.lecturerSuffix}
              </span>
            </div>
            <div className="dsl__steps">
              {portfolio.program.map((s, i) => (
                <div key={s.n} className="dsl__stepwrap">
                  <div className="dsl__step">
                    <span className="dsl__stepn" aria-hidden="true">
                      {["i.", "ii.", "iii.", "iv.", "v."][i]}
                    </span>
                    <span className="dsl__stept">{up(t(s.title, locale))}</span>
                    <LabArrow className="dsl__steparrow" />
                  </div>
                  <PencilRule variant="b" opacity={0.24} short />
                </div>
              ))}
              <span className="dsl__folionote" aria-hidden="true">
                {R.portfolioAnnotation}
              </span>
            </div>
          </div>
        </section>

        {/* ================================================ 07 · CINEMA === */}
        <section className="dsl__cinema" id="cinema" aria-labelledby="dsl-s07">
          <LabSectionHead n="07" label={R.s07Label} context={R.s07Context} variant="d" />
          <div className="dsl__cinemagrid">
            <div className="dsl__cinemalede">
              <h2 className="dsl__cinematitle" id="dsl-s07">
                {t(film.name, locale)}
              </h2>
              <p className="dsl__cinemacopy">{t(film.blurb, locale)}</p>
              <div className="dsl__cinemarow">
                <span className="dsl__lect">
                  {film.lecturer} {R.lecturerSuffix}
                </span>
                <span className="dsl__badge">{up(R.onlineOnly)}</span>
              </div>
            </div>
            <div className="dsl__frames">
              {film.program.map((f) => (
                <div key={f.n} className="dsl__framewrap">
                  <div className="dsl__frame">
                    <span className="dsl__framen" aria-hidden="true">
                      {f.n}
                    </span>
                    <span className="dsl__framet">{up(t(f.title, locale))}</span>
                  </div>
                  <PencilRule variant="b" opacity={0.24} short />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== 08 · THE WIDER LAB === */}
        <section className="dsl__wider" id="lab-life" aria-labelledby="dsl-s08">
          <span className="dsl__widerorn" aria-hidden="true">
            <LabBotanical src="/assets/graphics/rosette.webp" />
          </span>
          <div className="dsl-head">
            <span className="dsl-head__l">
              <span aria-hidden="true">08 - </span>
              <span>{R.s08Label}</span>
            </span>
            <span className="dsl-head__r">{R.s08Context}</span>
          </div>
          <h2 className="dsl__widertitle" id="dsl-s08">
            {up(R.widerTitle)}
          </h2>
          <div className="dsl__ecolist">
            <PencilRule variant="a" opacity={0.34} />
            {LAB_ECOSYSTEM.map((e) => (
              <div key={e.tag.en} className="dsl__ecowrap">
                <div className="dsl__eco">
                  <span className="dsl__ecot">{t(e.title, locale)}</span>
                  <span className="dsl__ecod">{t(e.desc, locale)}</span>
                  <span className="dsl__ecotag">{up(t(e.tag, locale))}</span>
                </div>
                <PencilRule variant="b" opacity={0.3} />
              </div>
            ))}
          </div>
        </section>

        {/* ============================================= 09 · LECTURERS === */}
        <section className="dsl__faculty" id="lecturers" aria-labelledby="dsl-s09">
          <LabSectionHead
            n="09"
            label={R.s09Label}
            context={R.s09Context}
            variant="c"
            headingId="dsl-s09"
          />
          <div className="dsl__facgrid">
            {LAB_FACULTY.map((p) => (
              <div key={p.slug} className="dsl__fac">
                <MediaFigure
                  ratio="3 / 4"
                  pending={t(p.portraitLabel, locale)}
                  caption={up(t(p.disc, locale))}
                  className="dsl__facfig"
                />
                <span className="dsl__facname">{p.name}</span>
                <span className="dsl__facbio">{R.bioPending}</span>
                <Link href={href(p.href)} className="dsl__faclink">
                  {up(t(p.course, locale))}
                  <LabArrow weight={1.4} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================== 10 · REGISTRATION === */}
        <section className="dsl__register" id="register" aria-labelledby="dsl-s10">
          <span className="dsl__registerorn" aria-hidden="true">
            <LabBotanical src="/assets/graphics/floral-rose.webp" />
          </span>
          <LabSectionHead n="10" label={R.s10Label} context={R.s10Context} variant="a" />
          <div className="dsl__reggrid">
            <div className="dsl__regmain">
              <h2 className="dsl__regtitle" id="dsl-s10">
                {up(R.registerTitle)}
              </h2>
              <p className="dsl__regcopy">{R.registerCopy}</p>
              <Link href={localeHref(locale, "/start-a-project")} className="dsl__regcta">
                {up(R.beginRegistration)}
                <LabArrow />
              </Link>
            </div>
            <div className="dsl__regside">
              <span className="dsl__regask">{up(R.sheetAsks)}</span>
              <ul className="dsl__regfields">
                {R.registerFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <span className="dsl__regnote">{up(R.paymentNote)}</span>
            </div>
          </div>
        </section>

        {/* ========================================== 11 · FOOTER INDEX === */}
        <footer className="dsl__foot">
          <PencilRule variant="d" opacity={0.34} />
          <LabIndex words={R.index} />
          <PencilRule variant="b" opacity={0.3} />
          <div className="dsl__footrow">
            <span>{up(R.footerMark)}</span>
            <a href="#top" className="dsl__footlink">
              ← {up(R.backToSite)}
            </a>
            <span>{up(R.city)}</span>
          </div>
        </footer>
      </div>
    </DaoShell>
  );
}
