import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { DaoShell } from "@/components/dao/DaoShell";
import { DaoBrief } from "@/components/dao/DaoBrief";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.nav.startProject, description: m.daoRoutes.brief.intro };
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
      returnTab={{ label: up(m.daoRoutes.returnTab.back), fallback: "/" }}
    >
      <div className="dao-page dbr" data-dao-scene="dark">
        <div className="dao-weave" aria-hidden="true" />
        <header className="dbr__intro">
          <span className="dao-kicker" style={{ color: "var(--dao-yellow)" }}>
            {up(R.kicker)}
          </span>
          <h1 className="dbr__title">
            {R.title}
            <span style={{ color: "var(--dao-red)" }}>.</span>
          </h1>
          <p
            style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(242,237,227,.75)", maxWidth: 520 }}
          >
            {R.intro}
          </p>
        </header>
        <DaoBrief locale={locale} messages={m} />
      </div>
    </DaoShell>
  );
}
