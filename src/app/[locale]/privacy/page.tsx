import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { LegalPage } from "@/components/dao/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.daoRoutes.legal.privacy,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);

  // The approved demo privacy notice is the only confirmed legal text.
  return (
    <LegalPage
      locale={locale}
      messages={m}
      route="privacy"
      title={m.daoRoutes.legal.privacy}
      sections={[{ heading: m.privacy.title, body: m.privacy.body }]}
    />
  );
}
