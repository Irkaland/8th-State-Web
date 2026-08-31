import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { DaoShell } from "@/components/dao/DaoShell";
import { ServicesDossier } from "@/components/dao/ServicesDossier";

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

/**
 * /services - the department dossier (approved Services design).
 *
 * The page is a shell: the whole composition lives in ServicesDossier, which is
 * a server component reading `content/services-departments.ts`. Nothing about
 * the five departments is written here, so the homepage preview and this
 * destination cannot drift apart.
 */
export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);

  return (
    <DaoShell locale={locale} messages={m} veil="paper" footer>
      {/* --paper so the fixed-chrome clearance is the dossier's own ground:
          this page is paper from the very top edge, not paper below a dark band */}
      <div className="dao-page dao-page--paper" data-dao-scene="light">
        <ServicesDossier locale={locale} />
      </div>
    </DaoShell>
  );
}
