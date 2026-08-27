import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale, LOCALES } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { t } from "@/content/localized";
import { getProject, projectSlugs, projectsSorted } from "@/content/projects";
import { disciplineOf, disciplineLabel } from "@/content/dao-work";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { up } from "@/lib/cn";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => projectSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} - ${t(project.categoryLabel, locale as Locale)}`,
    description: t(project.summary, locale as Locale),
    openGraph: { images: [{ url: (project.hero ?? project.cover).src }] },
  };
}

/**
 * /work/[slug] - cinematic visual essay (handoff 3c). Expanded Case Study
 * variant; Standard Project = the same system minus narrative modules.
 * Omitted CMS areas take their headings with them.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const project = getProject(slug);
  if (!project) notFound();
  const m = getMessages(locale);
  const L = m.daoRoutes.project;

  const sorted = projectsSorted();
  const idx = sorted.findIndex((p) => p.slug === slug);
  const next = sorted[(idx + 1) % sorted.length];
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  const hero = project.hero ?? project.cover;
  const gallery = project.gallery.filter((g) => g.kind !== "bts");
  const diptych = gallery.slice(0, 2);
  const fullBleed = gallery[2] ?? gallery[0];
  const bts = [...(project.bts ?? []), ...project.gallery.filter((g) => g.kind === "bts")].slice(
    0,
    4,
  );
  const roles = project.services.slice(0, 2).map((s) => up(t(s, locale)));
  const provisional = project.titleProvisional ? "*" : "";

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="blue"
      returnTab={{ label: up(m.nav.work), parent: "/work" }}
    >
      <article className="dao-page dpj" data-dao-scene="light" style={{ paddingTop: 0 }}>
        {/* opening title on the blue sheet the archive frame expanded into */}
        <header className="dpj__opening" data-dao-scene="dark">
          <div className="dao-grain--strong" aria-hidden="true" />
          <div className="dao-weave" aria-hidden="true" />
          <InView className="dpj__openinggrid" threshold={0.05}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 26, position: "relative" }}
            >
              <div className="dpj__idrow dao-fade">
                <span className="dpj__prj">PRJ-{pad(idx)}</span>
                <span className="dpj__casestudy">{up(L.caseStudy)}</span>
              </div>
              <h1 className="dpj__title">
                <span className="dao-rise">
                  <span>
                    {project.title}
                    {provisional}
                  </span>
                </span>
              </h1>
              <p className="dpj__statement dao-fade" style={{ ["--d" as string]: "180ms" }}>
                {t(project.summary, locale)}
              </p>
            </div>
            <dl className="dpj__meta dao-fade" style={{ ["--d" as string]: "260ms" }}>
              <div className="dpj__metarow">
                <dt className="dpj__metalabel">{L.client}</dt>
                <dd>
                  {project.client}
                  {provisional}
                </dd>
              </div>
              <div className="dpj__metarow">
                <dt className="dpj__metalabel">{L.year}</dt>
                <dd>{project.year}</dd>
              </div>
              <div className="dpj__metarow">
                <dt className="dpj__metalabel">{L.location}</dt>
                <dd>{t(project.location, locale)}</dd>
              </div>
              <div className="dpj__metarow">
                <dt className="dpj__metalabel">{L.discipline}</dt>
                <dd>{t(disciplineLabel(disciplineOf(project)), locale).toUpperCase()}</dd>
              </div>
              <div className="dpj__metarow dpj__metarow--role">
                <dt className="dpj__metalabel">{L.role}</dt>
                <dd style={{ fontWeight: 500 }}>
                  {roles.map((r) => (
                    <span key={r} style={{ display: "block" }}>
                      {r}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </InView>
        </header>

        <div className="dao-grain" aria-hidden="true" />

        {/* hero media */}
        <div className="dpj__hero">
          <Image
            src={hero.src}
            alt={t(hero.alt, locale)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* concept narrative - the essay's thesis */}
        <InView className="dpj__concept">
          <span
            className="dao-mask"
            aria-hidden="true"
            style={{
              ["--m" as string]: "url(/assets/graphics/star.webp)",
              position: "absolute",
              left: "8%",
              top: 60,
              width: 26,
              height: 26,
              background: "var(--dao-red)",
            }}
          />
          <div className="dpj__conceptbody">
            <p className="dpj__concepttext dao-fade">{t(project.creativeIdea, locale)}</p>
            <span
              className="dpj__bluestroke dao-mask--cover dao-fade"
              style={{ ["--d" as string]: "150ms" }}
              aria-hidden="true"
            />
          </div>
          <span
            className="dao-mask"
            aria-hidden="true"
            style={{
              ["--m" as string]: "url(/assets/graphics/sun.webp)",
              position: "absolute",
              right: "10%",
              bottom: 70,
              width: 60,
              height: 60,
              background: "rgba(19,18,16,.12)",
            }}
          />
        </InView>

        {/* diptych - offset pair */}
        {diptych.length === 2 && (
          <>
            <InView className="dpj__diptych">
              {diptych.map((g) => (
                <div key={g.src}>
                  <Image
                    src={g.src}
                    alt={t(g.alt, locale)}
                    fill
                    sizes="(max-width:720px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </InView>
            <p className="dpj__caption">{t(project.productionApproach, locale)}</p>
          </>
        )}

        {/* full bleed with paper caption */}
        {fullBleed && (
          <div className="dpj__full">
            <Image
              src={fullBleed.src}
              alt={t(fullBleed.alt, locale)}
              fill
              sizes="100vw"
              className="object-cover"
            />
            {project.usage && (
              <div className="dpj__papercap">
                <span>
                  {L.usage} - {t(project.usage, locale)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* contact-sheet strip - process / BTS · case study only */}
        {bts.length >= 2 && (
          <InView className="dpj__contactsheet">
            <div className="dao-rule-h" style={{ marginBottom: 22 }} aria-hidden="true" />
            <span
              className="dao-label"
              style={{ color: "var(--dao-brown)", display: "block", marginBottom: 26 }}
            >
              {up(L.contactSheet)}
            </span>
            <div className="dpj__sheetgrid">
              {bts.map((g, i) => (
                <div
                  key={g.src}
                  style={{
                    transform: `rotate(${[-1, 0.8, -0.6, 1.2][i % 4]}deg)`,
                    top: i % 2 ? 18 : 0,
                  }}
                >
                  <Image
                    src={g.src}
                    alt={t(g.alt, locale)}
                    fill
                    sizes="(max-width:960px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="dpj__fr">
              FR {pad(idx)}12 - {pad(idx)}48
            </div>
          </InView>
        )}

        {/* credits - CMS-driven, only real credits render */}
        {project.credits.length > 0 && (
          <section className="dpj__credits" data-dao-scene="dark">
            <div className="dao-weave" aria-hidden="true" />
            {/* v7 5g: one-colour silkscreen mark closes the credits */}
            <span
              className="dao-mask"
              aria-hidden="true"
              style={{
                ["--m" as string]: "url(/assets/graphics/serpent-mark.webp)",
                position: "absolute",
                right: "var(--dao-gutter)",
                top: 90,
                width: 64,
                height: 33,
                background: "rgba(242,237,227,.95)",
              }}
            />
            <h2 className="dpj__creditstitle" style={{ position: "relative" }}>
              {L.credits}
            </h2>
            <div className="dpj__creditsgrid" style={{ position: "relative" }}>
              <div className="dpj__credit">
                <span className="dpj__creditrole">{L.production}</span>
                <span>8TH STATE PRODUCTION</span>
              </div>
              {project.credits.map((c, i) => (
                <div key={i} className="dpj__credit">
                  <span className="dpj__creditrole">{t(c.role, locale)}</span>
                  <span>
                    {c.name}
                    {c.provisional ? "*" : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* next project tear */}
        <Link href={localeHref(locale, `/work/${next.slug}`)} className="dpj__next">
          <div className="dao-grain--strong" aria-hidden="true" />
          <span
            className="dao-label"
            style={{
              display: "block",
              color: "rgba(242,237,227,.8)",
              letterSpacing: ".26em",
              position: "relative",
            }}
          >
            {up(L.next)} - PRJ-{pad((idx + 1) % sorted.length)}
          </span>
          <span className="dpj__nexttitle" style={{ marginTop: 10 }}>
            {next.title}
            {next.titleProvisional ? "*" : ""}
            <span className="dao-strike" aria-hidden="true" />
          </span>
          <span className="dpj__nextpeek" aria-hidden="true">
            <Image
              src={(next.hero ?? next.cover).src}
              alt=""
              fill
              sizes="300px"
              className="object-cover"
            />
          </span>
        </Link>
      </article>
    </DaoShell>
  );
}
