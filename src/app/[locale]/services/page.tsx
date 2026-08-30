import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { DAO_SERVICES, DAO_SERVICE_GROUPS } from "@/content/dao-services";
import { projectsSorted } from "@/content/projects";
import { capabilityHasWork } from "@/content/work-filters";
import { CapabilityWorkLink } from "@/components/dao/CapabilityWorkLink";
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
  return {
    title: m.nav.services,
    description: m.dao.services.intro,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/services"),
  };
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
  // the credited archive, so a capability's "worked example" mark is read from
  // the same data its Related Work link filters on
  const archive = projectsSorted();

  return (
    <DaoShell locale={locale} messages={m} veil="paper" footer>
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
            <div className="dsv__index">
              {/* D - index registration, one step apart. --ls is 0em because
                  the roman index carries no designed tracking of its own, so
                  the settle closes to zero rather than inventing spacing. */}
              {[g1, g2, g3, g4].map((g, i) => (
                <span
                  key={g.id}
                  className="mo-d"
                  style={{
                    color: g.colour,
                    ["--ls" as string]: "0em",
                    ["--d" as string]: `${220 + i * 40}ms`,
                  }}
                >
                  {["I", "II", "III", "IV"][i]}&nbsp;&nbsp;{t(g.name, locale)}
                </span>
              ))}
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
            className="dsv__grouplabel mo-f"
            style={{ color: g1.colour, padding: "60px var(--dao-gutter) 0" }}
          >
            I - {up(t(g1.name, locale))} · {up(R.thinking)}
          </div>
          <div className="dsv__g1">
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              {/* E1: left-positioned typography enters from the left, masked,
                  650ms EDITORIAL with 80ms line stagger */}
              {/* §29: every capability carries its canonical id as an anchor,
                  so the homepage dossier and a project's discipline link can
                  route to the exact row rather than to the top of the page.
                  scroll-margin-top is set once in dao-routes.css. */}
              <div className="dsv__g1names">
                <h2 id={svc("01").id} className="dsv__name dao-rise dao-rise--x">
                  <span>{t(svc("01").name, locale)}</span>
                </h2>
                <h2
                  id={svc("02").id}
                  className="dsv__name dao-rise dao-rise--x"
                  style={{ position: "relative" }}
                >
                  <span style={{ ["--d" as string]: "80ms", position: "relative" }}>
                    {t(svc("02").name, locale)}
                    <span
                      className="dao-strike dao-strike--on"
                      style={{ background: g1.colour, height: 10 }}
                      aria-hidden="true"
                    />
                  </span>
                </h2>
              </div>
              <p className="dsv__desc dao-fade" style={{ ["--d" as string]: "200ms" }}>
                {t(svc("01").desc, locale)} {t(svc("02").desc, locale)}
              </p>
              {/* §13: one Related Work link PER capability. This group used to
                  carry a single link to bare /work, which showed the whole
                  archive to someone reading about Art Direction. */}
              <div className="dsv__caplinks">
                {[svc("01"), svc("02")].map((cap) => (
                  <span key={cap.id} className="dsv__caplink">
                    <span className="dsv__caplinkname">{t(cap.name, locale)}</span>
                    <CapabilityWorkLink
                      id={cap.id}
                      locale={locale}
                      messages={m}
                      style={{ color: "var(--dao-ink)" }}
                    />
                  </span>
                ))}
              </div>
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
          <div
            className="dsv__grouplabel mo-f"
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
              // never asserted by hand: this mark sits directly above the
              // capability's Related Work link, so a hardcoded claim would show a
              // tick above an empty archive
              const worked = capabilityHasWork(archive, s.id);
              return (
                <div
                  key={n}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  className="dao-fade"
                >
                  <h2
                    id={s.id}
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
                  </h2>
                  {worked && <span className="dsv__worked">{up(R.workedExample)} ✓</span>}
                  <span className="dsv__g2desc">{t(s.desc, locale)}</span>
                  {/* §13: Scenography, Costume Design and Decoration had no
                      Related Work route at all before this pass. */}
                  <CapabilityWorkLink
                    id={s.id}
                    locale={locale}
                    messages={m}
                    style={{ color: "var(--dao-paper)", alignSelf: "flex-start" }}
                  />
                </div>
              );
            })}
          </div>
        </InView>

        {/* III · IMAGE PRODUCTION - blue capture layer, film strip */}
        <InView className="dsv__g3" threshold={0.08} scene="dark">
          <div className="dao-grain--strong" aria-hidden="true" />
          <div
            className="dsv__grouplabel mo-f"
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
            {/* §13: was one link to the broad film-video category, which is not
                the same question as "which projects show Photography". */}
            <div className="dsv__caplinks">
              {[svc("07"), svc("08")].map((cap) => (
                <span key={cap.id} id={cap.id} className="dsv__caplink">
                  <span className="dsv__caplinkname" style={{ color: "var(--dao-paper)" }}>
                    {t(cap.name, locale)}
                  </span>
                  <CapabilityWorkLink
                    id={cap.id}
                    locale={locale}
                    messages={m}
                    style={{ color: "var(--dao-yellow)" }}
                  />
                </span>
              ))}
            </div>
          </div>
        </InView>

        {/* IV · FINISHING - quiet completion layer */}
        <InView className="dsv__g4" threshold={0.1}>
          <div
            className="dsv__grouplabel mo-f"
            style={{ color: g4.colour, padding: "0 var(--dao-gutter)" }}
          >
            IV - {up(t(g4.name, locale))} · {up(R.completion)}
          </div>
          <div className="dsv__g4body">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 id={svc("09").id} className="dsv__name dao-rise">
                <span>{t(svc("09").name, locale)}</span>
              </h2>
              <p
                className="dsv__desc dao-fade"
                style={{ ["--d" as string]: "120ms", maxWidth: 560 }}
              >
                {R.postDesc} {t(svc("09").desc, locale)}
              </p>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <CapabilityWorkLink
                  id={svc("09").id}
                  locale={locale}
                  messages={m}
                  style={{ color: "var(--dao-ink)" }}
                />
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
            </Link>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
