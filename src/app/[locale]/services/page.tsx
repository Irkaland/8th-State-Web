import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { t } from "@/content/localized";
import { DAO_SERVICES, DAO_SERVICE_GROUPS } from "@/content/dao-services";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { ServicesFilmCarousel } from "@/components/dao/ServicesFilmCarousel";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.nav.services, description: m.dao.services.intro };
}

const svc = (n: string) => DAO_SERVICES.find((s) => s.n === n)!;

/**
 * /services - editorial production catalogue (handoff 3d). Four group
 * spreads, each with its own composition: I typography-led split on paper ·
 * II dark made-world full-frame · III blue capture layer film-strip ·
 * IV quiet finishing.
 */
export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.services;
  const [g1, g2, g3, g4] = DAO_SERVICE_GROUPS;

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="paper"
      returnTab={{ label: up(m.daoRoutes.returnTab.home), fallback: "/", ground: "light" }}
    >
      <div className="dao-page dsv" data-dao-scene="light">
        <div className="dao-grain" aria-hidden="true" />

        {/* catalogue cover */}
        <InView threshold={0.05}>
          <header className="dao-cover" style={{ position: "relative" }}>
            <h1 className="dao-cover__title dao-side" style={{ ["--x" as string]: "-60px" }}>
              {up(m.nav.services)}
            </h1>
            <span
              className="dao-cover__ka"
              lang={locale === "en" ? "ka" : "en"}
              style={{ color: "rgba(19,18,16,.55)" }}
            >
              {locale === "en" ? "სერვისები" : "SERVICES"}
            </span>
          </header>
          <div className="dsv__coverhead">
            <p className="dsv__intro dao-fade" style={{ ["--d" as string]: "120ms" }}>
              {m.dao.services.intro}
            </p>
            <div className="dsv__index dao-fade" style={{ ["--d" as string]: "220ms" }}>
              <span style={{ color: g1.colour }}>I&nbsp;&nbsp;{t(g1.name, locale)}</span>
              <span style={{ color: g2.colour }}>II&nbsp;&nbsp;{t(g2.name, locale)}</span>
              <span style={{ color: g3.colour }}>III&nbsp;&nbsp;{t(g3.name, locale)}</span>
              <span style={{ color: g4.colour }}>IV&nbsp;&nbsp;{t(g4.name, locale)}</span>
            </div>
          </div>
          <div
            className="dao-rule-h"
            style={{ margin: "50px var(--dao-gutter) 0" }}
            aria-hidden="true"
          />
        </InView>

        {/* I · CREATIVE & ART DIRECTION - typography-led split */}
        <InView className="dsv__group" threshold={0.1}>
          <div
            className="dsv__grouplabel"
            style={{ color: g1.colour, padding: "60px var(--dao-gutter) 0" }}
          >
            I - {up(t(g1.name, locale))} · {up(R.thinking)}
          </div>
          <div className="dsv__g1">
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              {/* E1: left-positioned typography enters from the left, masked,
                  650ms EDITORIAL with 80ms line stagger */}
              <div className="dsv__g1names">
                <span className="dsv__name dao-rise dao-rise--x">
                  <span>{t(svc("01").name, locale)}</span>
                </span>
                <span className="dsv__name dao-rise dao-rise--x" style={{ position: "relative" }}>
                  <span style={{ ["--d" as string]: "80ms", position: "relative" }}>
                    {t(svc("02").name, locale)}
                    <span
                      className="dao-strike dao-strike--on"
                      style={{ background: g1.colour, height: 10 }}
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </div>
              <p className="dsv__desc dao-fade" style={{ ["--d" as string]: "200ms" }}>
                {t(svc("01").desc, locale)} {t(svc("02").desc, locale)}
              </p>
              <Link
                href={localeHref(locale, "/work")}
                className="dao-cta"
                style={{ color: "var(--dao-ink)" }}
              >
                {up(R.relatedWork)} <span aria-hidden="true">→</span>
                <span className="dao-strike" style={{ background: g1.colour }} aria-hidden="true" />
              </Link>
            </div>
            {/* E2: right-positioned fragment mirrors the direction */}
            <div
              className="dsv__g1media dao-side"
              style={{ ["--d" as string]: "150ms", ["--x" as string]: "60px" }}
            >
              <div className="dsv__img">
                <Image
                  src="/media/berlin-editorial.jpg"
                  alt=""
                  fill
                  sizes="(max-width:720px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <span className="dsv__rosette dao-mask" aria-hidden="true" />
              <span className="dsv__star4 dao-mask" aria-hidden="true" />
            </div>
          </div>
        </InView>

        {/* II · PRODUCTION & SPATIAL DESIGN - made-world, full-frame */}
        <InView className="dsv__g2" threshold={0.08} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <div className="dao-cut" style={{ background: "var(--dao-paper)" }} aria-hidden="true" />
          <div
            className="dsv__grouplabel"
            style={{ color: g2.colour, padding: "0 var(--dao-gutter)", position: "relative" }}
          >
            II - {up(t(g2.name, locale))} · {up(R.madeWorld)}
          </div>
          <div className="dsv__g2frame">
            <div className="dsv__img">
              <Image
                src="/media/georgia-set.jpg"
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="dsv__g2grid">
            {(["03", "04", "05", "06"] as const).map((n, i) => {
              const s = svc(n);
              const worked = n !== "05";
              return (
                <div
                  key={n}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  className="dao-fade"
                >
                  <span
                    className="dsv__name"
                    style={{ position: "relative", alignSelf: "flex-start" }}
                  >
                    {t(s.name, locale)}
                    {i === 0 && (
                      <span
                        className="dao-strike dao-strike--on"
                        style={{ background: g2.colour, height: 7 }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  {worked && <span className="dsv__worked">{up(R.workedExample)} ✓</span>}
                  <span className="dsv__g2desc">{t(s.desc, locale)}</span>
                </div>
              );
            })}
          </div>
        </InView>

        {/* III · IMAGE PRODUCTION - blue capture layer, film strip */}
        <InView className="dsv__g3" threshold={0.08} scene="dark">
          <div className="dao-grain--strong" aria-hidden="true" />
          <div className="dao-cut" style={{ background: "var(--dao-ink)" }} aria-hidden="true" />
          <div
            className="dsv__grouplabel"
            style={{
              color: "var(--dao-yellow)",
              padding: "0 var(--dao-gutter)",
              position: "relative",
            }}
          >
            III - {up(t(g3.name, locale))} · {up(R.capture)}
          </div>
          {/* v7 5e E4: active name controls which media set cycles */}
          <ServicesFilmCarousel
            filmLabel={t(svc("07").name, locale)}
            photoLabel={t(svc("08").name, locale)}
          />
          <div className="dsv__g3foot">
            <p className="dsv__desc" style={{ color: "var(--dao-paper)" }}>
              {t(svc("07").desc, locale)} {t(svc("08").desc, locale)}
            </p>
            <Link
              href={localeHref(locale, "/work?category=film-video")}
              className="dao-cta"
              style={{ color: "var(--dao-yellow)" }}
            >
              {up(R.relatedWork)} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </InView>

        {/* IV · FINISHING - quiet completion layer */}
        <InView className="dsv__g4" threshold={0.1}>
          <div className="dao-cut" style={{ background: "var(--dao-blue)" }} aria-hidden="true" />
          <div
            className="dsv__grouplabel"
            style={{ color: g4.colour, padding: "0 var(--dao-gutter)" }}
          >
            IV - {up(t(g4.name, locale))} · {up(R.completion)}
          </div>
          <div className="dsv__g4body">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <span className="dsv__name dao-rise">
                <span>{t(svc("09").name, locale)}</span>
              </span>
              <p
                className="dsv__desc dao-fade"
                style={{ ["--d" as string]: "120ms", maxWidth: 560 }}
              >
                {R.postDesc} {t(svc("09").desc, locale)}
              </p>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <Link
                  href={localeHref(locale, "/work")}
                  className="dao-cta"
                  style={{ color: "var(--dao-ink)" }}
                >
                  {up(R.relatedWork)} <span aria-hidden="true">→</span>
                  <span
                    className="dao-strike"
                    style={{ background: g4.colour }}
                    aria-hidden="true"
                  />
                </Link>
                <span
                  className="dao-mask"
                  style={{
                    ["--m" as string]: "url(/assets/graphics/star-solid.webp)",
                    width: 26,
                    height: 26,
                    background: g4.colour,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="dsv__g4media dao-fade" style={{ ["--d" as string]: "150ms" }}>
              <div className="dsv__img">
                <Image
                  src="/media/chronograph.jpg"
                  alt=""
                  fill
                  sizes="(max-width:720px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div
            className="dao-rule-h"
            style={{ margin: "70px var(--dao-gutter) 0" }}
            aria-hidden="true"
          />
          <div className="dsv__end">
            <span className="dao-label" style={{ color: "var(--dao-brown)" }}>
              {up(R.end)}
            </span>
            <Link
              href={localeHref(locale, "/start-a-project")}
              className="dao-cta"
              style={{ color: "var(--dao-ink)" }}
            >
              {up(m.daoRoutes.work.startProduction)} <span aria-hidden="true">→</span>
              <span
                className="dao-strike"
                style={{ background: "var(--dao-red)" }}
                aria-hidden="true"
              />
            </Link>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
