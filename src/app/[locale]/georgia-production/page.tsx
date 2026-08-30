import type { Metadata } from "next";
import Image from "next/image";
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

/**
 * /georgia-production - cinematic field guide (handoff 4d). Dossier cover
 * with coordinates, dark location-plates band (plates hand off laterally;
 * swipe on mobile), production-support index A-D on real approved scope
 * content, field note, CTA. No capability is claimed that approved content
 * does not confirm.
 */
export default async function GeorgiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.georgia;

  // Index A-D descriptions reuse the matching approved scope items.
  const scope = (n: string) => GEORGIA_SCOPE.find((s) => s.n === n);
  const index = [
    { letter: "A", name: R.indexA, desc: scope("01")?.desc },
    { letter: "B", name: R.indexB, desc: scope("02")?.desc },
    { letter: "C", name: R.indexC, desc: scope("03")?.desc },
    { letter: "D", name: R.indexD, desc: scope("04")?.desc },
  ];

  const [plate1, ...plates] = GEORGIA_STILLS;

  return (
    <DaoShell locale={locale} messages={m} veil="blue" footer>
      <div className="dao-page dao-page--paper" data-dao-scene="light">
        <div className="dao-grain" aria-hidden="true" />

        {/* dossier cover */}
        <InView className="dgp__cover" threshold={0.05}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
            <span className="dao-kicker dao-fade" style={{ color: "var(--dao-blue)" }}>
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
            <p
              className="dao-fade"
              style={{
                ["--d" as string]: "180ms",
                fontSize: 16,
                lineHeight: 1.7,
                maxWidth: 560,
                textWrap: "pretty",
              }}
            >
              {m.georgia.intro}
            </p>
            <p
              className="dao-label dao-fade"
              style={{ ["--d" as string]: "240ms", color: "rgba(108,62,19,.7)", maxWidth: 560 }}
            >
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
                style={{
                  width: 88,
                  height: "auto",
                  mixBlendMode: "multiply",
                  transform: "rotate(2deg)",
                  marginTop: 10,
                }}
              />
            </span>
          </div>
        </InView>
        <div className="dao-rule-h" style={{ margin: "0 var(--dao-gutter)" }} aria-hidden="true" />

        {/* location plates - dark band */}
        <InView threshold={0.06}>
          <section className="dgp__plates" data-dao-scene="dark">
            <div className="dao-weave" aria-hidden="true" />
            <h2
              className="dlb__notestitle"
              style={{
                color: "var(--dao-paper)",
                padding: "0 var(--dao-gutter)",
                position: "relative",
                fontSize: "clamp(28px,3vw,44px)",
              }}
            >
              {up(R.locationPlates)}
            </h2>
            <div className="dgp__platemain dao-fade">
              <Image
                src={plate1.src}
                alt={t(plate1.alt, locale)}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="dgp__platetag">
                <span className="dgp__platenum">{up(R.plate)} 01</span>
                <span className="dgp__platename">{t(plate1.label, locale)}</span>
              </div>
            </div>
            <div className="dgp__platerow">
              {plates.map((p, i) => (
                <div
                  key={p.src}
                  className="dao-fade"
                  style={{ ["--d" as string]: `${(i + 1) * 120}ms` }}
                >
                  <Image
                    src={p.src}
                    alt={t(p.alt, locale)}
                    fill
                    sizes="(max-width:720px) 78vw, 33vw"
                    className="object-cover"
                  />
                  <div className="dgp__platetag" style={{ left: 12, bottom: 12 }}>
                    <span className="dgp__platenum" style={{ fontSize: 12, padding: "4px 8px" }}>
                      {up(R.plate)} {String(i + 2).padStart(2, "0")}
                    </span>
                    <span className="dgp__platename" style={{ fontSize: 8.5, padding: "4px 8px" }}>
                      {t(p.label, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </InView>

        {/* production support index */}
        <InView className="dgp__support" threshold={0.1}>
          <h2
            className="dlb__notestitle"
            style={{ color: "var(--dao-ink)", fontSize: "clamp(28px,3vw,44px)" }}
          >
            {up(R.productionSupport)}
          </h2>
          <div className="dgp__supportgrid">
            <div>
              {index.map((row, i) => (
                <div
                  key={row.letter}
                  className="dgp__indexrow dao-fade"
                  style={{ ["--d" as string]: `${i * 80}ms` }}
                >
                  <span className="dgp__letter">{row.letter}</span>
                  <span className="dgp__indexname">{row.name}</span>
                  {row.desc && <span className="dgp__indexdesc">{t(row.desc, locale)}</span>}
                </div>
              ))}
            </div>
            {/* §18: blue stock. The three text colours were all dark - ink body,
                red kicker, brown reference - and none of them survives on
                #2374b3 (the red measures 1.04:1 against it). They move to the
                palette's light end: yellow for the label, paper for the copy,
                paper at 0.72 for the reference. Copy, sizes and hierarchy are
                unchanged. */}
            <div className="dao-sheet dgp__note dao-fade" style={{ ["--d" as string]: "200ms" }}>
              <span className="dao-kicker" style={{ color: "var(--dao-yellow)" }}>
                {up(R.fieldNote)}
              </span>
              {/* paper measures 4.26:1 on #2374b3 - just under AA for 14px copy,
                  so the body takes white (5.05:1). The label above stays brand
                  yellow, which already clears at 4.59:1. */}
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#fff" }}>{m.georgia.ctaDesc}</p>
              <span
                style={{
                  fontFamily: "var(--dao-f-numeral)",
                  fontSize: 12,
                  // full white: on #2374b3 nothing under 0.95 alpha clears AA,
                  // and a 5% step is not a hierarchy. The numeral face and the
                  // smaller size already separate this from the body copy.
                  color: "#fff",
                }}
              >
                GP-NOTE-01
              </span>
            </div>
          </div>
          <div className="dgp__cta">
            <span className="dao-label" style={{ color: "var(--dao-brown)" }}>
              {up(R.bring)}
            </span>
            <Link
              href={localeHref(locale, "/start-a-project")}
              className="dao-cta"
              style={{ color: "var(--dao-ink)" }}
            >
              {up(R.startProject)} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
