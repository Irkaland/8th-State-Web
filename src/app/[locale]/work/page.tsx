import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages, format } from "@/i18n";
import { t } from "@/content/localized";
import { projectsSorted } from "@/content/projects";
import { DAO_DISCIPLINES, disciplineOf, disciplineLabel, isDiscipline } from "@/content/dao-work";
import { DaoShell } from "@/components/dao/DaoShell";
import { WorkArchive, type ArchiveItem } from "@/components/dao/WorkArchive";
import { cn, up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.nav.work, description: m.work.description };
}

// /work - living production archive (handoff 3b). Categories are filter
// states of this route; selection re-composes the archive.
export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale: raw } = await params;
  const { category } = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const w = m.daoRoutes.work;

  const all = projectsSorted();
  const active = category && isDiscipline(category) ? category : null;
  const filtered = active ? all.filter((p) => disciplineOf(p) === active) : all;

  const items: ArchiveItem[] = filtered.map((p) => {
    const d = disciplineOf(p);
    return {
      slug: p.slug,
      title: p.title,
      cover: (p.hero ?? p.cover).src,
      alt: t((p.hero ?? p.cover).alt, locale),
      discipline: up(t(disciplineLabel(d), locale)),
      disciplineId: d,
      role: p.services
        .slice(0, 2)
        .map((s) => up(t(s, locale)))
        .join(" · "),
      year: p.year,
    };
  });

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="blue"
      returnTab={{ label: up(m.daoRoutes.returnTab.home), fallback: "/" }}
    >
      <div className="dao-page dwk" data-dao-scene="dark">
        {/* blue material plane carried in from Selected Work */}
        <header className="dwk__plane">
          <div className="dao-grain--strong" aria-hidden="true" />
          <div className="dao-weave" aria-hidden="true" />
          <div className="dwk__head" style={{ position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="dwk__title-row">
                <h1 className="dwk__title">{up(m.nav.work)}</h1>
                <span
                  className="dao-cover__ka"
                  lang={locale === "en" ? "ka" : "en"}
                  style={{ color: "rgba(242,237,227,.7)" }}
                >
                  {locale === "en" ? "ნამუშევრები" : "WORK"}
                </span>
              </div>
              <span className="dwk__count">
                {up(w.archive)} - {up(format(w.projectsShown, { count: filtered.length }))}
              </span>
            </div>
            {/* editorial filter index - paint stroke marks the active line */}
            <nav className="dwk__filters" aria-label={m.work.filterLabel}>
              <Link
                href={localeHref(locale, "/work")}
                className="dwk__filter"
                aria-current={!active ? "true" : undefined}
              >
                {w.all}
                <span className="dao-strike" aria-hidden="true" />
              </Link>
              {DAO_DISCIPLINES.map((d) => (
                <Link
                  key={d.id}
                  href={localeHref(locale, `/work?category=${d.id}`)}
                  className={cn("dwk__filter", d.id === "studio-lab" && "dwk__filter--lab")}
                  aria-current={active === d.id ? "true" : undefined}
                >
                  {d.n}&nbsp;&nbsp;{t(d.label, locale)}
                  <span
                    className="dao-strike"
                    style={d.id === "studio-lab" ? { background: "var(--dao-mint)" } : undefined}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <WorkArchive locale={locale} messages={m} items={items} total={all.length} />
      </div>
    </DaoShell>
  );
}
