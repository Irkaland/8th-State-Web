import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages, format } from "@/i18n";
import { t } from "@/content/localized";
import { teamSorted } from "@/content/team";
import { capabilityById, isCapabilityId } from "@/content/dao-services";
import { DaoShell } from "@/components/dao/DaoShell";
import { InView } from "@/components/dao/InView";
import { up } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  return { title: m.daoRoutes.team.title, description: m.daoRoutes.team.intro };
}

/**
 * /team - the people who run and produce the work.
 *
 * Reached from the Studio narrative rather than the main navigation: it belongs
 * to "who we are", not to a ninth top-level destination.
 *
 * The roster is data-driven from content/team.ts, which is deliberately empty -
 * the repository holds no approved people content, and inventing names, roles or
 * portraits for a live production site is not something a placeholder justifies.
 * So the page renders an honest pre-content state that points at the archive,
 * and switches to the roster the moment real entries are added. No layout work
 * is needed at that point.
 *
 * Material language is the existing one: paper ground, grain, the cover/kicker
 * type scale, irregular framed portraits. No cards, no directory grid.
 */
export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const R = m.daoRoutes.team;
  const team = teamSorted();

  return (
    <DaoShell
      locale={locale}
      messages={m}
      veil="paper"
      returnTab={{ label: up(m.nav.studio), fallback: "/studio", ground: "light" }}
    >
      <div className="dao-page dao-page--paper dtm" data-dao-scene="light">
        <div className="dao-grain" aria-hidden="true" />

        <InView className="dtm__cover" threshold={0.05}>
          <span className="dao-kicker dao-fade" style={{ color: "var(--dao-red)" }}>
            {up(R.kicker)}
          </span>
          <h1 className="dao-cover__title dao-side" style={{ ["--x" as string]: "-60px" }}>
            {up(R.title)}
          </h1>
          <p className="dtm__intro dao-fade" style={{ ["--d" as string]: "150ms" }}>
            {R.intro}
          </p>
          {team.length > 0 && (
            <span className="dao-label dtm__count dao-fade" style={{ ["--d" as string]: "220ms" }}>
              {up(format(R.countLabel, { count: team.length }))}
            </span>
          )}
        </InView>

        {team.length === 0 ? (
          /* Pre-content state. Not an error and not a "coming soon" banner - it
             says what is being prepared and sends the visitor to the archive,
             which is the truthful record of who does what until the credits are
             confirmed. */
          <InView className="dtm__pending" threshold={0.1}>
            <span className="dtm__rule" aria-hidden="true" />
            <h2 className="dtm__pendingtitle">{R.pendingTitle}</h2>
            <p className="dtm__pendingdesc">{R.pendingDesc}</p>
            <Link href={localeHref(locale, "/work")} className="dao-cta dtm__pendingcta">
              {up(R.pendingCta)} <span aria-hidden="true">→</span>
            </Link>
            <span
              className="dtm__mark dao-mask"
              style={{ ["--m" as string]: "url(/assets/graphics/wreath.webp)" }}
              aria-hidden="true"
            />
          </InView>
        ) : (
          <InView className="dtm__roster" threshold={0.06}>
            {team.map((person, i) => (
              <article
                key={person.id}
                className="dtm__person dao-fade"
                style={{ ["--d" as string]: `${i * 80}ms` }}
              >
                <div className="dtm__portrait">
                  {person.portrait ? (
                    <Image
                      src={person.portrait.src}
                      alt={t(person.portrait.alt, locale)}
                      fill
                      sizes="(max-width: 720px) 80vw, 320px"
                      className="object-cover"
                    />
                  ) : (
                    /* no portrait yet: the frame stays, initials stand in */
                    <span className="dtm__initials" aria-hidden="true">
                      {person.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="dtm__body">
                  <h2 className="dtm__name">{person.name}</h2>
                  <span className="dtm__role">{up(t(person.role, locale))}</span>
                  {person.bio && <p className="dtm__bio">{t(person.bio, locale)}</p>}
                  {person.capabilities.length > 0 && (
                    <span className="dtm__caps">
                      {person.capabilities
                        .filter(isCapabilityId)
                        .map((id) => t(capabilityById(id).name, locale))
                        .join(" · ")}
                    </span>
                  )}
                  {person.link && (
                    <a
                      className="dao-textlink dtm__link"
                      href={person.link}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {person.link.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </InView>
        )}
      </div>
    </DaoShell>
  );
}
