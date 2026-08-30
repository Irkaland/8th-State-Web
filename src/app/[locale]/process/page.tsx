import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { DAO_SERVICES } from "@/content/dao-services";
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
    title: m.nav.process,
    description: m.daoRoutes.process.intro,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/process"),
  };
}

/**
 * /process - production choreography (handoff 4f). Nine confirmed stages -
 * kinds of work, never a required order - as scattered call sheets threaded
 * only by the serpent. The nine stages are the nine approved capabilities
 * (per the approved "kinds of work" framing); stage sheets rise as paper
 * layers, 80ms stagger. Deliberately not a pipeline.
 */
export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.process;

  return (
    <DaoShell locale={locale} messages={m} veil="paper" footer>
      {/* §15: the orange environment is scoped to this route's own class, not
          to the shared cream .dao-page--paper. The strong stock plus the weave
          is what keeps it reading as printed orange paper rather than a flat
          orange screen. */}
      <div className="dao-page dao-page--paper dpr" data-dao-scene="light">
        <div className="dao-grain--strong" aria-hidden="true" />
        <div className="dao-weave" aria-hidden="true" />

        <InView className="dpr__cover" threshold={0.05}>
          {/* §16: this label was orange on cream. On the orange ground it has to
              leave the ground colour entirely - the brand ink gives the
              strongest editorial reading and needs no new colour. */}
          <span className="dao-kicker mo-f" style={{ color: "var(--dao-ink)" }}>
            {up(R.kicker)}
          </span>
          <h1 className="dao-cover__title dao-side" style={{ ["--x" as string]: "-60px" }}>
            {up(m.nav.process)}
          </h1>
          <p
            className="dao-fade"
            style={{
              ["--d" as string]: "150ms",
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 560,
              textWrap: "pretty",
            }}
          >
            {R.intro}
          </p>
        </InView>

        {/* scattered call sheets 01-09 · the serpent is the only thread */}
        <InView className="dpr__field" threshold={0.04}>
          <span className="dpr__serpent dao-mask" aria-hidden="true" />
          <div className="dpr__scatter">
            {DAO_SERVICES.map((s, i) => (
              <div
                key={s.n}
                className="dao-sheet dpr__sheet dbr__deal"
                style={{ ["--d" as string]: `${i * 80}ms` }}
              >
                <div className="dpr__sheethead">
                  {/* D - the step registers; G - the heading is uncovered.
                      G falls back to a C-style fade at <=768 on its own. */}
                  <span className="dpr__num mo-d" style={{ ["--ls" as string]: "0em" }}>
                    {s.n}
                  </span>
                  <span className="dpr__stagename mo-g" style={{ ["--d" as string]: "90ms" }}>
                    {t(s.name, locale)}
                  </span>
                </div>
                <p className="dpr__stagedesc">{t(s.desc, locale)}</p>
                <span className="dpr__callsheet">
                  {up(R.callSheet)} · PS-{s.n}
                </span>
              </div>
            ))}
          </div>
        </InView>

        {/* in practice */}
        <InView className="dpr__practice" threshold={0.15} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <div className="dpr__practicegrid" style={{ position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <span className="dao-kicker mo-f" style={{ color: "var(--dao-orange)" }}>
                {up(R.inPractice)}
              </span>
              <p className="dpr__practicetext dao-fade" style={{ ["--d" as string]: "120ms" }}>
                {R.practiceText}
              </p>
              <div
                className="dao-fade"
                style={{
                  ["--d" as string]: "220ms",
                  display: "flex",
                  gap: 30,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={localeHref(locale, "/work")}
                  className="dao-cta"
                  style={{ color: "var(--dao-paper)", fontSize: 10.5 }}
                >
                  {up(R.caseStudies)} <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={localeHref(locale, "/start-a-project")}
                  className="dao-cta"
                  style={{ color: "var(--dao-yellow)", fontSize: 10.5 }}
                >
                  {up(R.startProject)} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="dpr__bts dao-fade" style={{ ["--d" as string]: "180ms" }}>
              <Image
                src="/media/bts-camera.jpg"
                alt=""
                fill
                sizes="(max-width:720px) 100vw, 30vw"
                className="object-cover"
              />
            </div>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
