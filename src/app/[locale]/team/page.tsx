import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
import { t } from "@/content/localized";
import { hasConfirmedTeam, teamByDepartment, teamInSectionOrder } from "@/content/team";
import { teamDocument } from "@/content/team-documents";
import { PROJECTS } from "@/content/projects";
import { capabilityById, isCapabilityId } from "@/content/dao-services";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { MastheadBack } from "@/components/dao/MastheadBack";
import { Reveal } from "@/components/dao/Reveal";
import {
  TeamContactSheet,
  type TeamCard,
  type TeamSection,
  type TeamWorkCredit,
} from "@/components/dao/TeamContactSheet";
import { TeamDecor } from "@/components/dao/TeamDecor";
import { up } from "@/lib/cn";
import { teamSheetMessages } from "@/i18n/slices";
import { EditorialArrow } from "@/components/dao/EditorialArrow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return {
    title: m.daoRoutes.team.title,
    description: m.daoRoutes.team.intro,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/team"),
  };
}

/**
 * /team - the contact sheet (approved Direction 1A).
 *
 * A photographic roster on paper: portraits in complete hand-drawn frames,
 * grouped under editorial department headings, each opening into an editorial
 * profile sheet laid INTO the grid without leaving the route.
 *
 * This file is the data boundary. Everything the sheet needs is resolved here -
 * localised, joined to the Work archive, and flattened to plain strings - so the
 * client component never imports the content layer. Two rules are enforced at
 * this boundary rather than in the UI:
 *
 *   - a project only reaches a profile through a CONFIRMED credit. selectedWork
 *     is joined against PROJECTS by slug, and a slug with no matching project is
 *     dropped rather than rendered as a dead link.
 *   - every optional field is passed through only when it carries content, so the
 *     sheet renders the blocks that exist and omits the rest entirely.
 */
export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.team;

  const groups = teamByDepartment();

  /** Join a person's credits to the real archive, dropping anything unmatched. */
  const workOf = (slugs: { slug: string; role?: { en: string; ka: string } }[]): TeamWorkCredit[] =>
    slugs
      .map((c): TeamWorkCredit | null => {
        const p = PROJECTS.find((x) => x.slug === c.slug);
        if (!p) return null;
        const media = p.hero ?? p.cover;
        return {
          slug: p.slug,
          title: p.title,
          client: p.client,
          year: p.year,
          cover: media.src,
          alt: t(media.alt, locale),
          ...(c.role ? { role: t(c.role, locale) } : {}),
        };
      })
      .filter((x): x is TeamWorkCredit => x !== null);

  const sections: TeamSection[] = groups.map((g) => ({
    id: g.id,
    name: t(g.name, locale),
    people: g.people.map((p): TeamCard => {
      /**
       * The professional link row - only the platforms this person actually has.
       *
       * Deliberately excludes the portfolio and the email address: the portfolio
       * is its own VIEW PORTFOLIO call to action (§10) and the email belongs to
       * the CONTACT block (§09), so neither is duplicated in this row.
       */
      const links: TeamCard["links"] = [];
      if (p.vimeoUrl) links.push({ key: "vimeo", label: "Vimeo", href: p.vimeoUrl });
      if (p.instagramUrl)
        links.push({ key: "instagram", label: "Instagram", href: p.instagramUrl });
      // LinkedIn is deliberately NOT in this row: it is its own LINKEDIN
      // PROFILE action in the profile footer, beside VIEW PORTFOLIO, for the
      // same reason the portfolio is - listing it in both places would give one
      // person two links to the same page in one profile.
      if (p.imdbUrl) links.push({ key: "imdb", label: "IMDb", href: p.imdbUrl });
      if (p.behanceUrl) links.push({ key: "behance", label: "Behance", href: p.behanceUrl });

      return {
        slug: p.slug,
        name: p.name ? t(p.name, locale) : undefined,
        provisional: p.provisional,
        department: g.id,
        departmentName: t(g.name, locale),
        role: p.role ? t(p.role, locale) : undefined,
        secondaryRoles: p.secondaryRoles.map((r) => t(r, locale)),
        // a portrait entry with no file yet is the same thing as no portrait:
        // the sheet draws its initials-and-pending frame either way, and this
        // keeps it from ever being handed an empty src
        portrait: p.portrait?.src
          ? { src: p.portrait.src, alt: t(p.portrait.alt, locale) }
          : undefined,
        shortStatement: p.shortStatement ? t(p.shortStatement, locale) : undefined,
        bio: p.bio ? t(p.bio, locale) : undefined,
        // practice speaks the Services vocabulary wherever the id is canonical
        expertise: p.expertise.map((e) =>
          isCapabilityId(e) ? t(capabilityById(e).name, locale) : e,
        ),
        experience: p.experience.map((x) => ({
          role: t(x.role, locale),
          ...(x.organization ? { organization: x.organization } : {}),
          ...(x.period ? { period: x.period } : {}),
          ...(x.location ? { location: t(x.location, locale) } : {}),
          ...(x.description ? { description: t(x.description, locale) } : {}),
        })),
        selectedWork: workOf(p.selectedWork),
        clients: p.clients,
        awards: p.awards.map((x) => t(x, locale)),
        credits: p.credits.map((x) => t(x, locale)),
        education: p.education.map((x) => t(x, locale)),
        languages: p.languages.map((x) => t(x, locale)),
        location: p.location ? t(p.location, locale) : undefined,
        email: p.email,
        phone: p.phone,
        portfolioUrl: p.portfolioUrl,
        linkedinUrl: p.linkedinUrl,
        // resolved on the server so the client bundle never carries the
        // document content layer; a person with no documents passes nothing
        resumeSrc: p.documents?.resume?.src,
        biography: p.documents?.biography ? teamDocument(p.documents.biography.id) : undefined,
        artistStatement: p.documents?.artistStatement
          ? teamDocument(p.documents.artistStatement.id)
          : undefined,
        links,
      };
    }),
  }));

  const order = teamInSectionOrder().map((p) => p.slug);
  const anyPeople = sections.length > 0;

  return (
    <DaoShell locale={locale} messages={m} veil="paper">
      {/* §32: the approved Team ground - the studio yellow, with the paper
          grain and the canvas weave printed into it and an oxide stain in the
          upper right, so the page reads as a tinted stock rather than a flat
          fill. `--paper` is deliberately NOT used here any more. */}
      <div className="dao-page dtm" data-dao-scene="light">
        <div className="dao-grain--strong" aria-hidden="true" />
        <div className="dao-weave" aria-hidden="true" />
        <TeamDecor />

        {/* §03/§04: the contextual masthead back. /team's canonical parent is
            /studio, and it is a real link there - never history.back(), which a
            direct entry or a locale switch would answer wrongly. */}
        <div className="dtm__mast">
          <MastheadBack href={localeHref(locale, "/studio")} label={up(m.nav.studio)} />
          <span className="dtm__mastmid">{up(R.mastLabel)}</span>
          <span className="dtm__mastright">{up(m.dao.ident.city)}</span>
        </div>

        <InView className="dtm__cover" threshold={0.05}>
          <span className="dao-kicker mo-f" style={{ color: "var(--dao-red)" }}>
            {up(R.kicker)}
          </span>
          {/* §03: the page states what it is over two lines, not "Meet the team" */}
          <h1 className="dtm__title dao-side" style={{ ["--x" as string]: "-60px" }}>
            {up(R.titleLine1)}
            <em>{up(R.titleLine2)}</em>
          </h1>
          <p className="dtm__intro dao-fade" style={{ ["--d" as string]: "150ms" }}>
            {R.intro}
          </p>
        </InView>

        {anyPeople ? (
          <TeamContactSheet
            locale={locale}
            messages={teamSheetMessages(m)}
            sections={sections}
            order={order}
            provisionalRoster={!hasConfirmedTeam()}
          />
        ) : (
          /* no seats at all: the honest pre-content state, unchanged */
          <InView className="dtm__pending" threshold={0.1}>
            <span className="dtm__rule" aria-hidden="true" />
            <h2 className="dtm__pendingtitle">{R.pendingTitle}</h2>
            <p className="dtm__pendingdesc">{R.pendingDesc}</p>
            <a href={localeHref(locale, "/work")} className="dao-cta dtm__pendingcta">
              {up(R.pendingCta)} <EditorialArrow />
            </a>
            <span
              className="dtm__mark dao-mask"
              style={{ ["--m" as string]: "url(/assets/graphics/wreath.webp)" }}
              aria-hidden="true"
            />
          </InView>
        )}

        {/* §32: the closing moment. /team has a designed ending, which is why
            FINAL UX §02 gives it no footer - this is the ending, and the one
            conversion the page offers. */}
        <Reveal as="div" className="dtm__close">
          <span className="dtm__closerule" aria-hidden="true" />
          <div className="dtm__closerow">
            <p className="dtm__closeline mo-c">{R.closing}</p>
            <Link href={localeHref(locale, "/start-a-project")} className="dtm__closecta mo-h">
              {up(R.startProject)}
              <EditorialArrow weight={1.2} />
            </Link>
          </div>
        </Reveal>
      </div>
    </DaoShell>
  );
}
