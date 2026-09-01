import type { Metadata } from "next";
import Image from "next/image";
import { MediaSlot } from "@/components/dao/MediaSlot";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { GEORGIA_SCOPE, GEORGIA_STILLS } from "@/content/pathways";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.nav.georgiaProduction,
    description: m.georgia.intro,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/georgia-production"),
  };
}

/** the drawn blue stroke under the cover title */
function TitleStroke() {
  return (
    <svg className="dgp__stroke" viewBox="0 0 400 6" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 3.4 C90 2 210 4.8 398 2.6"
        stroke="#2374b3"
        strokeWidth="2.4"
        fill="none"
        opacity="0.85"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** the imperfect ruled line the file is set on */
function Rule({ className, opacity = 0.34 }: { className?: string; opacity?: number }) {
  return (
    <svg className={className} viewBox="0 0 400 4" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 2.4 C60 1.5 130 3.1 190 2.1 C260 1.2 330 3 400 2.3"
        stroke="#131210"
        strokeWidth="1"
        fill="none"
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * /georgia-production - the production dossier (approved Georgia Production
 * design).
 *
 * A file rather than a page: a metadata strip, a dossier cover with the
 * coordinates of the studio that would run the shoot, an ink band of location
 * plates, the eight-item register of what local support actually covers, and a
 * printed field note beside the way in.
 *
 * IT IS A SERVER COMPONENT. Every responsive decision is CSS; the only motion
 * is the shared InView entrance the rest of the site uses.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED
 * --------------------------------
 * The cover carries its own caveat - no confirmed permits, partnerships or
 * response times - and item 03 of the register repeats it inline. Nothing on
 * this page states a permit, an incentive, a partner network, a turnaround, a
 * crew size or a credit, because the approved content confirms none of them.
 * The register is rendered from `GEORGIA_SCOPE`, which is the studio's own
 * scope list, so a claim cannot be introduced here without being added there.
 */
export default async function GeorgiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.georgia;

  const [plate1, ...plates] = GEORGIA_STILLS;

  return (
    <DaoShell locale={locale} messages={m} veil="blue" footer>
      <div className="dao-page dao-page--paper dgp" data-dao-scene="light">
        <div className="dao-grain" aria-hidden="true" />

        {/* ===== FILE STRIP =====
            Page-level dossier metadata, not navigation: the global chrome
            still carries the brand mark and the locale switch, and this says
            which file of the studio's you are holding. */}
        <div className="dgp__file">
          {/* §02: a Latin wordmark, not translated copy - the slim footer
              prints the same string the same way */}
          <span className="dgp__filemark">8TH STATE PRODUCTION</span>
          <span className="dgp__filemid">{up(R.fileLabel)}</span>
          {/* the design prints EN / KA here as a file stamp. The chrome already
              carries the real, working locale switch, so a second set of
              controls would be two ways to do one thing - this is the stamp
              only, and is hidden from assistive tech for that reason. */}
          <span className="dgp__filelocales" aria-hidden="true">
            EN / KA
          </span>
        </div>

        {/* ===== DOSSIER COVER ===== */}
        <InView className="dgp__cover" threshold={0.05}>
          <div className="dgp__coverlede">
            <span className="dao-kicker mo-f" style={{ color: "var(--dao-blue)" }}>
              {up(R.kicker)}
            </span>
            {/* §12: the size lived here as an inline override - clamp(40px,7.6vw,110px)
                against the shared cover ramp of clamp(44px,9vw,130px) - so this
                title was smaller than every other page title at EVERY width, and
                read as a secondary item purely because its words are longer. It
                is a named class now, and the ramp matches the shared one exactly
                up to its cap. */}
            <h1 className="dao-cover__title dgp__title">
              <span className="dao-rise">
                <span>{up(m.nav.georgiaProduction.split(" ")[0])}</span>
              </span>
              <span className="dao-rise">
                <span style={{ ["--d" as string]: "90ms" }}>
                  {up(m.nav.georgiaProduction.split(" ").slice(1).join(" ")) || "PRODUCTION"}
                </span>
              </span>
            </h1>
            <TitleStroke />
            <p className="dgp__intro dao-fade" style={{ ["--d" as string]: "180ms" }}>
              {m.georgia.intro}
            </p>
            {/* the accuracy note. It is part of the composition, not a footnote:
                the page offers coordination, and says in the same breath what
                coordination is not. */}
            <p className="dao-label dgp__honest dao-fade" style={{ ["--d" as string]: "240ms" }}>
              ※ {m.georgia.honestNote}
            </p>
          </div>
          <div className="dgp__coords dao-fade" style={{ ["--d" as string]: "200ms" }}>
            <span>{R.coords}</span>
            <span>{up(R.city)}</span>
            <span>{R.tz}</span>
            {/* §09: star + official mark are one symbol group. The wrapper is
                display:contents above 720px, so on desktop these two stay direct
                flex children of .dgp__coords and the layout is untouched; on mobile
                it becomes a row and the two read as a cluster instead of drifting to
                opposite edges. align-self moved out of the inline style because an
                inline value cannot be overridden by the mobile media query - that
                was the actual cause of the split. */}
            <span className="dgp__symbols">
              <span className="dgp__star dao-mask" aria-hidden="true" />
              <Image
                className="dgp__mark"
                src="/assets/brand/8th-state-logo-mark.png"
                alt=""
                width={176}
                height={176}
                aria-hidden="true"
              />
            </span>
          </div>
        </InView>
        <Rule className="dgp__coverrule" opacity={0.4} />

        {/* ===== LOCATION PLATES - ink band ===== */}
        <InView threshold={0.06}>
          <section className="dgp__plates" data-dao-scene="dark" aria-labelledby="dgp-plates">
            <div className="dao-weave" aria-hidden="true" />
            <div className="dgp__sectionhead">
              <h2 className="dgp__sectiontitle" id="dgp-plates">
                {up(R.locationPlates)}
              </h2>
              <span className="dgp__sectionmeta">{up(R.platesMeta)}</span>
            </div>

            <div className="dgp__platemain dao-fade">
              <MediaSlot
                src={plate1.src}
                alt={t(plate1.alt, locale)}
                mark={m.common.imagePending}
                sizes="100vw"
              />
              {/* the drawn registration frame - a plate is marked up, not framed
                  in a border */}
              <svg
                className="dgp__plateframe"
                viewBox="0 0 400 170"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 5 C130 3.4 280 6 396 4.2 L397.5 164 C260 166.5 120 163.8 4.5 165.6 L3 5 M3 5 L14 5"
                  stroke="#d03e26"
                  strokeWidth="1.6"
                  fill="none"
                  opacity="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="dgp__platetag">
                <span className="dgp__platenum">{up(R.plate)} 01</span>
                <span className="dgp__platename">{t(plate1.label, locale)}</span>
              </div>
            </div>

            <div className="dgp__platerow">
              {plates.map((p, i) => (
                <div
                  key={p.label.en}
                  className="dao-fade"
                  style={{ ["--d" as string]: `${(i + 1) * 120}ms` }}
                >
                  <MediaSlot
                    src={p.src}
                    alt={t(p.alt, locale)}
                    mark={m.common.imagePending}
                    sizes="(max-width:720px) 78vw, 50vw"
                  />
                  <div className="dgp__platetag dgp__platetag--sm">
                    <span className="dgp__platenum">
                      {up(R.plate)} {String(i + 2).padStart(2, "0")}
                    </span>
                    <span className="dgp__platename">{t(p.label, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </InView>

        {/* ===== PRODUCTION SUPPORT - the register =====
            All eight items, rendered from the studio's own scope list. The
            previous composition printed four of them under invented letters
            A-D, so half the scope the studio actually offers was not on the
            page at all and the four that were had been relabelled. */}
        <InView className="dgp__support" threshold={0.1} aria-labelledby="dgp-support">
          <div className="dgp__sectionhead">
            <h2 className="dgp__sectiontitle" id="dgp-support">
              {up(R.productionSupport)}
            </h2>
            <span className="dgp__sectionmeta">{up(R.supportMeta)}</span>
          </div>
          <Rule className="dgp__supportrule" />
          <div className="dgp__register">
            {GEORGIA_SCOPE.map((s, i) => (
              <div
                key={s.n}
                className="dgp__item"
                style={{ ["--d" as string]: `${Math.min(i, 5) * 60}ms` }}
              >
                <span className="dgp__itemn">{s.n}</span>
                <span className="dgp__itemtitle">{t(s.title, locale)}</span>
                <span className="dgp__itemdesc">{t(s.desc, locale)}</span>
              </div>
            ))}
          </div>
        </InView>

        {/* ===== FIELD NOTE + CTA ===== */}
        <InView className="dgp__close" threshold={0.1}>
          {/* a printed note slipped into the file: blue stock, the studio's own
              paper grain multiplied into it so it is a material and not a panel */}
          <div className="dgp__note">
            <span className="dgp__notegrain" aria-hidden="true" />
            <span className="dgp__notelabel">{up(R.fieldNote)}</span>
            <p className="dgp__notecopy">{m.georgia.ctaDesc}</p>
            <span className="dgp__notecode">GP-NOTE-01</span>
          </div>
          <div className="dgp__cta">
            <span className="dao-label dgp__ctalabel">{up(R.bring)}</span>
            <Link href={localeHref(locale, "/start-a-project")} className="dgp__ctalink">
              {up(R.startProject)}
              <svg viewBox="0 0 46 12" aria-hidden="true">
                <path
                  d="M1 6.4 C14 5.6 28 6.8 43 5.9 M37.5 2.2 C39.6 3.7 41.7 5 44.2 5.9 C41.5 7.1 39.4 8.6 37.8 10.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
