import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { StudioSwallow } from "@/components/dao/StudioSwallow";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.nav.studio, description: m.dao.intro.statement };
}

/**
 * /studio - visual manifesto (handoff 4a). Giant swallow behind the
 * statement (moves 15% slower than scroll - midground presence), about
 * spread, "one institution - two rooms" dark band with the Lab panel,
 * contact handoff. Team / collaborators / clients are conditional
 * sections and stay omitted until real content exists.
 */
export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.studio;

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="red"
      returnTab={{ label: up(m.daoRoutes.returnTab.home), fallback: "/", ground: "light" }}
    >
      {/* v7 #11 white-strip fix: the route shell ground is the closing
          section's ink - the paper world ends inside the ink close, so no
          off-white background can surface on overscroll or short viewports. */}
      <div className="dao-page dao-page--ink" style={{ paddingTop: 0 }}>
        {/* the chrome tracks the actual ground: paper world = light chrome,
            ink/lab bands = paper chrome (§14) */}
        <div className="dst__paperblock" data-dao-scene="light">
          <div className="dao-grain" aria-hidden="true" />

          {/* manifesto cover - giant swallow behind statement */}
          <InView className="dst__cover" threshold={0.05}>
            <StudioSwallow />
            <header className="dao-cover" style={{ position: "relative", padding: 0 }}>
              <h1 className="dao-cover__title dao-side" style={{ ["--x" as string]: "-60px" }}>
                {up(m.nav.studio)}
              </h1>
              <span
                className="dao-cover__ka"
                lang={locale === "en" ? "ka" : "en"}
                style={{ color: "rgba(19,18,16,.55)" }}
              >
                {locale === "en" ? "სტუდია" : "STUDIO"}
              </span>
            </header>
            <p className="dst__statement">
              {m.dao.intro.statement
                .split(" ")
                .reduce<string[][]>((groups, word, i, arr) => {
                  const per = Math.ceil(arr.length / 3);
                  const g = Math.floor(i / per);
                  (groups[g] = groups[g] || []).push(word);
                  return groups;
                }, [])
                .map((group, i) => (
                  <span key={i} className="dao-rise">
                    <span style={{ ["--d" as string]: `${i * 90}ms` }}>{group.join(" ")} </span>
                  </span>
                ))}
            </p>
            <div
              className="dao-fade"
              style={{
                ["--d" as string]: "320ms",
                display: "flex",
                gap: 14,
                alignItems: "center",
                marginTop: 28,
                position: "relative",
              }}
            >
              <span
                className="dao-mask--cover"
                style={{
                  ["--m" as string]: "url(/assets/textures/paint-stroke.webp)",
                  width: 120,
                  height: 8,
                  background: "var(--dao-red)",
                  display: "block",
                }}
                aria-hidden="true"
              />
              <span className="dao-label" style={{ color: "var(--dao-brown)" }}>
                {up(m.daoRoutes.contentRequired)} - INTRO 40-70 WORDS
              </span>
            </div>
          </InView>

          {/* about spread */}
          <InView className="dst__about" threshold={0.1}>
            <div className="dst__aboutmedia dao-fade">
              <div className="dsv__img">
                <Image
                  src="/media/bts-set.jpg"
                  alt=""
                  fill
                  sizes="(max-width:720px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <span className="dst__sun dao-mask" aria-hidden="true" />
            </div>
            <div className="dst__abouttext">
              <span className="dao-kicker dao-fade" style={{ color: "var(--dao-red)" }}>
                {up(R.whoWeAre)}
              </span>
              <p
                className="dst__narrative dao-fade"
                style={{ ["--d" as string]: "120ms", color: "rgba(19,18,16,.65)" }}
              >
                {m.home.positioning.statement} - {m.daoRoutes.contentRequired}: about narrative,
                300-500 words.
              </p>
              <div className="dst__scope dao-fade" style={{ ["--d" as string]: "220ms" }}>
                <span className="dao-label" style={{ color: "var(--dao-brown)" }}>
                  {up(R.operatingScope)}
                </span>
                <span style={{ fontSize: 13 }}>{m.common.tbilisi}</span>
              </div>
            </div>
          </InView>
        </div>

        {/* one institution - two rooms */}
        <InView className="dst__rooms" threshold={0.1} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <div className="dst__roomsbody">
            <span className="dao-kicker dao-fade" style={{ color: "var(--dao-blue)" }}>
              {up(R.oneInstitution)}
            </span>
            <p className="dst__roomstext dao-fade" style={{ ["--d" as string]: "120ms" }}>
              {R.roomsText}
            </p>
            <div
              className="dao-fade"
              style={{ ["--d" as string]: "220ms", display: "flex", gap: 28, marginTop: 8 }}
            >
              <Link
                href={localeHref(locale, "/services")}
                className="dao-cta"
                style={{ color: "var(--dao-paper)", fontSize: 10 }}
              >
                {up(R.capabilities)} <span aria-hidden="true">→</span>
                <span
                  className="dao-strike"
                  style={{ background: "var(--dao-blue)" }}
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={localeHref(locale, "/process")}
                className="dao-cta"
                style={{ color: "var(--dao-paper)", fontSize: 10 }}
              >
                {up(R.howWeWork)} <span aria-hidden="true">→</span>
                <span
                  className="dao-strike"
                  style={{ background: "var(--dao-orange)" }}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
          <div className="dst__labpanel">
            <div className="dao-grain--strong" style={{ opacity: 0.4 }} aria-hidden="true" />
            <span className="dst__labstem dao-mask" aria-hidden="true" />
            <div className="dst__labpanel-inner">
              {/* ink text on the olive lab panel (§07 contrast) */}
              <span className="dao-kicker" style={{ color: "rgba(19,18,16,.75)" }}>
                {up(m.dao.nav.lab)}
              </span>
              <span
                style={{
                  fontFamily: "var(--dao-f-display)",
                  fontSize: 30,
                  lineHeight: 1.1,
                  color: "var(--dao-ink)",
                  whiteSpace: "pre-line",
                }}
              >
                {R.labLines}
              </span>
              <Link
                href={localeHref(locale, "/studio-lab")}
                className="dao-cta"
                style={{ color: "var(--dao-ink)", fontSize: 10, marginTop: 10 }}
              >
                {up(R.enterLab)} <span aria-hidden="true">→</span>
                <span
                  className="dao-strike"
                  style={{ background: "var(--dao-yellow)" }}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
          <span className="dst__roomsserpent dao-mask" aria-hidden="true" />
        </InView>

        {/* contact handoff */}
        <InView className="dst__handoff" threshold={0.2} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <span className="dst__handoffsun dao-mask" aria-hidden="true" />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 className="dst__make dao-rise">
              <span>
                {R.make}
                <span style={{ color: "var(--dao-red)" }}>.</span>
              </span>
            </h2>
            <Link
              href={localeHref(locale, "/start-a-project")}
              className="dao-cta dao-fade"
              style={{
                ["--d" as string]: "150ms",
                color: "var(--dao-yellow)",
                alignSelf: "flex-start",
              }}
            >
              {up(R.startProduction)} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </InView>
      </div>
    </DaoShell>
  );
}
