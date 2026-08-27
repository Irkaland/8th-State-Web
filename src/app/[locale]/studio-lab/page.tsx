import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { LabProvider, LabFilterRow, LabNotesGrid } from "@/components/dao/LabFieldNotes";
import { LabTickerRow } from "@/components/dao/LabTicker";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.dao.nav.lab, description: m.daoRoutes.lab.copy };
}

/**
 * /studio-lab - the experimental room (handoff 4b), destination of
 * ENTER THE LAB. Green botanical cover → cream field-notes (paper sheets,
 * not cards) → LAB WORK + collaboration + ticker. Lab studies and lab work
 * are CMS-driven: until real content exists the sheets keep their material
 * frames with explicit CONTENT REQUIRED captions - nothing is invented.
 * /studio-lab/* sub-routes stay reserved.
 */
export default async function StudioLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.lab;
  const cr = m.daoRoutes.contentRequired;

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="green"
      returnTab={{ label: up(m.nav.studio), parent: "/studio" }}
    >
      <LabProvider>
        <div className="dao-page dlb" data-dao-scene="dark">
          <div className="dao-weave" aria-hidden="true" />

          {/* lab cover - botanicals grow in, 120ms stagger */}
          <InView className="dlb__cover" threshold={0.05}>
            <span
              className="dlb__rose dao-mask dao-fade"
              style={{ ["--d" as string]: "120ms" }}
              aria-hidden="true"
            />
            {/* §10: one brandbook symbol on the right, in place of the grown
                stem and the small wreath that used to sit beside it */}
            <span
              className="dlb__bird dao-mask dao-fade"
              style={{ ["--d" as string]: "240ms" }}
              aria-hidden="true"
            />
            <div
              style={{ position: "relative", display: "flex", flexDirection: "column", gap: 26 }}
            >
              <span className="dao-kicker dao-fade" style={{ color: "rgba(19,18,16,.75)" }}>
                {up(R.kicker)}
              </span>
              <h1 className="dlb__title">
                <span className="dao-rise">
                  <span>{up(m.dao.lab.title.split(" ")[0])}</span>
                </span>
                <span className="dao-rise">
                  <span style={{ ["--d" as string]: "90ms" }}>
                    {up(m.dao.lab.title.split(" ").slice(1).join(" "))}
                  </span>
                </span>
              </h1>
              <p className="dlb__copy dao-fade" style={{ ["--d" as string]: "260ms" }}>
                {R.copy}
              </p>
              {/* v7 #10: three equal filters + the separate LAB WORK route */}
              <div className="dao-fade" style={{ ["--d" as string]: "360ms" }}>
                <LabFilterRow locale={locale} messages={m} />
              </div>
            </div>
          </InView>

          {/* field notes on cream paper - notebook, not portfolio */}
          <InView threshold={0.08}>
            <section id="field-notes" className="dlb__notes" data-dao-scene="light">
              <div className="dao-grain" aria-hidden="true" />
              <div className="dlb__noteshead" style={{ position: "relative" }}>
                <h2 className="dlb__notestitle">{up(R.fieldNotes)}</h2>
                <span className="dao-label" style={{ color: "var(--dao-brown)" }}>
                  {up(R.fieldNotesNote)}
                </span>
              </div>
              <div
                className="dao-rule-h"
                style={{ marginTop: 26, background: "rgba(86,98,46,.6)" }}
                aria-hidden="true"
              />
              <LabNotesGrid messages={m} />
            </section>
          </InView>

          {/* lab work + collaboration */}
          <InView threshold={0.08}>
            <section className="dlb__work">
              <h2
                className="dlb__notestitle"
                style={{ color: "var(--dao-ink)", position: "relative" }}
              >
                {up(R.labWork)}
              </h2>
              <div className="dlb__workgrid">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="dlb__workframe dao-fade"
                    style={{ ["--d" as string]: `${i * 120}ms` }}
                  >
                    <span className="dlb__workname">{cr}</span>
                  </div>
                ))}
              </div>
              <div
                className="dao-fade"
                style={{
                  display: "flex",
                  gap: 30,
                  alignItems: "center",
                  marginTop: 50,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={localeHref(locale, "/work?category=studio-lab")}
                  className="dao-cta"
                  style={{ color: "var(--dao-ink)" }}
                >
                  {up(R.allLabWork)} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="dlb__collab">
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
                  <span className="dao-kicker" style={{ color: "rgba(19,18,16,.75)" }}>
                    {up(R.collaboration)}
                  </span>
                  <p className="dlb__collabtext">
                    {R.collabText} {cr}.
                  </p>
                </div>
                {/* §14: brand red at rest, deepening on interaction - the same
                    system and timing as the Contact SEND button */}
                <Link
                  href={localeHref(locale, "/contact")}
                  className="dao-chipcta dao-btnfill dao-btnfill--red"
                >
                  {/* §11: the small bloom that used to hang off the corner is
                      gone. The button's surface now carries the paper grain
                      instead, so it reads as a printed red card rather than as a
                      digital fill with a flower stuck to it. */}
                  {up(R.writeToLab)}
                </Link>
              </div>
            </section>
          </InView>

          {/* ticker */}
          <div
            className="dlb__ticker"
            style={{ position: "relative", bottom: "auto", marginBottom: 0 }}
            aria-hidden="true"
          >
            <LabTickerRow words={m.dao.lab.ticker} />
          </div>
        </div>
      </LabProvider>
    </DaoShell>
  );
}
