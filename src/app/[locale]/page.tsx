import { existsSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { t } from "@/content/localized";
import { featuredProjects } from "@/content/projects";
import { DaoShell } from "@/components/dao/DaoShell";
import { Showreel } from "@/components/dao/Showreel";
import { StudioIntro } from "@/components/dao/StudioIntro";
import { SelectedWork, type DaoWorkProject } from "@/components/dao/SelectedWork";
import { ServicesAct } from "@/components/dao/ServicesAct";
import { StudioLab } from "@/components/dao/StudioLab";
import { ContactAct } from "@/components/dao/ContactAct";
import { up } from "@/lib/cn";

// Homepage - "One Continuous Take" (approved Digital Art Object Direction 01).
// Eight acts in a locked order: Ident → Showreel → Studio → Selected Work →
// Services → Studio Lab → Contact → end credits.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);

  const projects: DaoWorkProject[] = featuredProjects()
    .slice(0, 5)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: up(t(p.categoryLabel, locale)),
      role: p.services
        .slice(0, 2)
        .map((s) => up(t(s, locale)))
        .join(" · "),
      client: p.client + (p.titleProvisional ? "*" : ""),
      year: p.year,
      cover: (p.hero ?? p.cover).src,
      alt: t((p.hero ?? p.cover).alt, locale),
    }));

  return (
    <DaoShell locale={locale} messages={m} veil="none">
      <h1 className="sr-only">{m.meta.defaultTitle}</h1>
      <Showreel
        messages={m}
        hasReel={existsSync(join(process.cwd(), "public", "media", "showreel.mp4"))}
      />
      <StudioIntro locale={locale} messages={m} />
      <SelectedWork locale={locale} messages={m} projects={projects} />
      <ServicesAct locale={locale} messages={m} />
      <StudioLab locale={locale} messages={m} />
      <ContactAct locale={locale} messages={m} />
    </DaoShell>
  );
}
