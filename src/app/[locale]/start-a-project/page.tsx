import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { DaoShell } from "@/components/dao/DaoShell";
import { DaoBrief } from "@/components/dao/DaoBrief";
import { up } from "@/lib/cn";
import { briefMessages } from "@/i18n/slices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.nav.startProject,
    description: m.daoRoutes.brief.intro,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/start-a-project"),
  };
}

// /start-a-project - a production brief, not a form (handoff 4e).
export default async function StartAProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.brief;

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="ink"
      returnTab={{ label: up(m.daoRoutes.returnTab.back), parent: "/" }}
    >
      <div className="dao-page dbr" data-dao-scene="dark">
        <div className="dao-weave" aria-hidden="true" />
        <header className="dbr__intro">
          <div className="dbr__introtext">
            <span className="dao-kicker" style={{ color: "var(--dao-yellow)" }}>
              {up(R.kicker)}
            </span>
            <h1 className="dbr__title">
              {R.title}
              <span style={{ color: "var(--dao-red)" }}>.</span>
            </h1>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(242,237,227,.75)",
                maxWidth: 520,
              }}
            >
              {R.intro}
            </p>
          </div>
          {/* §14: the brandbook swallow, cream on the ink ground, answering the
              heading from the opposite side of the page. It is the same alpha
              artwork the rest of the site uses, so the printed edge is the
              brandbook's own - only the colour it is painted in changes. */}
          <span className="dbr__swallow dao-mask" aria-hidden="true" />
        </header>
        <DaoBrief locale={locale} messages={briefMessages(m)} />
      </div>
    </DaoShell>
  );
}
