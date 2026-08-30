import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { StudioDecor } from "@/components/dao/StudioDecor";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.nav.studio,
    description: m.dao.intro.statement,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/studio"),
  };
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
    <DaoShell locale={locale} messages={m} veil="red">
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
            <StudioDecor />
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
            {/* B - editorial assembly over AUTHORED clauses (§22). The
                statement used to be chopped by dividing its word count by
                three, which cut the Georgian sentence somewhere else entirely
                and re-cut both the moment the copy changed. */}
            <p className="dst__statement">
              {m.dao.intro.statementGroups.map((group, i) => (
                <span key={group} className="dao-rise">
                  <span style={{ ["--d" as string]: `${i * 90}ms` }}>{group} </span>
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
              <span className="dao-kicker mo-f" style={{ color: "var(--dao-red)" }}>
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
              {/* §19: the route to the people, inside "who we are" rather than
                  bolted on as a separate band - the team IS the studio, so it
                  belongs to this paragraph. Uses the shared decorative text-CTA
                  treatment, so it reads as editorial rather than as an HR link,
                  and it sits above the Studio/Studio Lab split so that
                  hierarchy is untouched. */}
              {/* §03: the route to the people was a single line of text and read as
                  an afterthought. It is now a production slate - the hinged board
                  that goes in front of the lens before a take - which says "these
                  are the people who make the production happen" in the language of
                  the work itself rather than in HR language. Built from type, rule
                  and the brand tokens: no stock icon, no portrait, no invented
                  person. The whole board is ONE link, so there is nothing nested
                  inside it, and the fields carry only facts the site already
                  states. */}
              <div className="dst__team dao-fade" style={{ ["--d" as string]: "300ms" }}>
                <span className="dao-label dst__teamkicker" style={{ color: "var(--dao-brown)" }}>
                  {up(R.thePeople)}
                </span>
                <Link
                  href={localeHref(locale, "/team")}
                  className="dst__slate"
                  data-dao-team-cta
                  aria-label={`${R.meetTheTeam} - ${R.thePeople}`}
                >
                  {/* the hinged clapper: it lifts on hover/focus, the way the real
                      board is held open before the take */}
                  <span className="dst__slateclap" aria-hidden="true" />
                  <span className="dst__slatebody">
                    <span className="dst__slatefields" aria-hidden="true">
                      <span className="dst__slatefield">
                        <span className="dst__slatekey">{up(R.slateProd)}</span>
                        <span className="dst__slateval">8TH STATE</span>
                      </span>
                      <span className="dst__slatefield">
                        <span className="dst__slatekey">{up(R.slateScene)}</span>
                        <span className="dst__slateval">{up(R.slateSceneValue)}</span>
                      </span>
                      <span className="dst__slatefield">
                        <span className="dst__slatekey">{up(R.slateLoc)}</span>
                        <span className="dst__slateval">{up(m.common.tbilisi)}</span>
                      </span>
                    </span>
                    <span className="dst__slatecta">
                      {up(R.meetTheTeam)} <span aria-hidden="true">→</span>
                    </span>
                  </span>
                  {/* frame/focus marks, as on a ground glass - four corners only */}
                  <span className="dst__slatemarks" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </InView>
        </div>

        {/* one institution - two rooms */}
        <InView className="dst__rooms" threshold={0.1} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <div className="dst__roomsbody">
            <span className="dao-kicker mo-f" style={{ color: "var(--dao-blue)" }}>
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
              </Link>
              <Link
                href={localeHref(locale, "/process")}
                className="dao-cta"
                style={{ color: "var(--dao-paper)", fontSize: 10 }}
              >
                {up(R.howWeWork)} <span aria-hidden="true">→</span>
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
              {/* §04: was a block of inline font declarations; it is now a named
                  class so the type lives with the rest of the design system. The
                  three-line structure is preserved by pre-line on the same
                  newline-separated string. */}
              <span className="dst__lablines">{R.labLines}</span>
              {/* §04: .dst__labpanel-inner is a column flex container, so this link
                  was stretching to the full panel width and .dao-cta::after (left:0
                  right:0) drew its rule all the way across the card. alignSelf
                  flex-start gives the link its intrinsic width, so the rule measures
                  the words - and keeps measuring them when the label changes length
                  between EN and KA. No width is hardcoded. */}
              <Link
                href={localeHref(locale, "/studio-lab")}
                className="dao-cta"
                style={{
                  color: "var(--dao-ink)",
                  fontSize: 10,
                  marginTop: 10,
                  alignSelf: "flex-start",
                }}
              >
                {up(R.enterLab)} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <span className="dst__roomsserpent dao-mask" aria-hidden="true" />
        </InView>

        {/* contact handoff */}
        <InView className="dst__handoff" threshold={0.2} scene="dark">
          <div className="dao-weave" aria-hidden="true" />
          <span className="dst__handoffsun dao-mask" aria-hidden="true" />
          <div className="dst__handoffbody">
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
