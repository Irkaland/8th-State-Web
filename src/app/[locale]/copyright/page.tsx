import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { LegalPage } from "@/components/dao/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.daoRoutes.legal.copyright };
}

export default async function CopyrightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);

  return (
    <LegalPage
      locale={locale}
      messages={m}
      route="copyright"
      title={m.daoRoutes.legal.copyright}
      sections={[{ heading: m.daoRoutes.legal.pendingHeading, body: [m.daoRoutes.legal.pending] }]}
    />
  );
}
