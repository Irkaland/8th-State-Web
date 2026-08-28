import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages, format } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { projectsSorted } from "@/content/projects";
import { DAO_DISCIPLINES, disciplineOf, disciplineLabel } from "@/content/dao-work";
import {
  IN_DEVELOPMENT_FILTER,
  IN_DEVELOPMENT_LABEL,
  applyWorkFilter,
  parseWorkFilter,
  workFilterHref,
  workFilterLabel,
} from "@/content/work-filters";
import { DaoShell } from "@/components/dao/DaoShell";
import { WorkArchive, type ArchiveItem } from "@/components/dao/WorkArchive";
import { cn, up } from "@/lib/cn";
import { workArchiveMessages } from "@/i18n/slices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.nav.work,
    description: m.work.description,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/work"),
  };
}

// /work - living production archive (handoff 3b). Filter state lives entirely
// in the query string, so every view survives a hard load, back/forward and a
// locale switch. Three kinds of filter are addressable - see content/
// work-filters.ts for why a category, a capability and a status are kept apart.
export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; capability?: string; status?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const w = m.daoRoutes.work;

  const all = projectsSorted();
  const filter = parseWorkFilter(sp);
  const filtered = applyWorkFilter(all, filter);
  // the broad category index only self-highlights for a category filter; a
  // capability or status filter is surfaced by the contextual chip instead, so
  // ALL is never falsely marked as the active one (§17)
  const activeCategory = filter.kind === "category" ? filter.id : null;
  const contextLabel =
    filter.kind === "capability" || filter.kind === "status" ? workFilterLabel(filter) : null;

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
      returnTab={{ label: up(m.daoRoutes.returnTab.home), parent: "/" }}
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
              {/* §17: arriving through a Related Work link must be legible. The
                  chip names the active capability (or status) and offers the way
                  back to the whole archive - without pretending ALL is on. */}
              {contextLabel && (
                <span className="dwk__context">
                  <span className="dwk__contextlabel">{up(w.showing)}</span>
                  <span className="dwk__contextvalue">{up(t(contextLabel, locale))}</span>
                  <Link className="dwk__contextclear" href={localeHref(locale, "/work")}>
                    {up(w.clearFilter)} <span aria-hidden="true">→</span>
                  </Link>
                </span>
              )}
            </div>
            {/* editorial filter index - paint stroke marks the active line */}
            <nav className="dwk__filters" aria-label={m.work.filterLabel}>
              <Link
                href={localeHref(locale, "/work")}
                className="dwk__filter"
                aria-current={filter.kind === "all" ? "true" : undefined}
              >
                {w.all}
                <span className="dao-strike" aria-hidden="true" />
              </Link>
              {DAO_DISCIPLINES.map((d) => (
                <Link
                  key={d.id}
                  href={localeHref(locale, `/work?category=${d.id}`)}
                  className={cn("dwk__filter", d.id === "studio-lab" && "dwk__filter--lab")}
                  aria-current={activeCategory === d.id ? "true" : undefined}
                >
                  {d.n}&nbsp;&nbsp;{t(d.label, locale)}
                  <span
                    className="dao-strike"
                    style={d.id === "studio-lab" ? { background: "var(--dao-mint)" } : undefined}
                    aria-hidden="true"
                  />
                </Link>
              ))}
              {/* §10: fifth in the index, but a STATUS filter rather than a
                  fifth discipline - "in development" describes how finished a
                  project is, not what kind of work it is. */}
              <Link
                href={localeHref(locale, workFilterHref(IN_DEVELOPMENT_FILTER))}
                className="dwk__filter"
                aria-current={filter.kind === "status" ? "true" : undefined}
              >
                05&nbsp;&nbsp;{t(IN_DEVELOPMENT_LABEL, locale)}
                <span
                  className="dao-strike"
                  style={{ background: "var(--dao-gold)" }}
                  aria-hidden="true"
                />
              </Link>
            </nav>
          </div>
        </header>

        <WorkArchive locale={locale} messages={workArchiveMessages(m)} items={items} total={all.length} />
      </div>
    </DaoShell>
  );
}
