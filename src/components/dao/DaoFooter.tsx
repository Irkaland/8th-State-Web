import Link from "next/link";
import type { Messages } from "@/i18n";
import { type Locale, localeHref } from "@/i18n/locales";
import { cn, up } from "@/lib/cn";

/**
 * The slim credits footer (FINAL UX §02).
 *
 * NOT a site-wide template. Eight route families get it - Work, Project,
 * Services, Georgia Production, Process, Studio Lab, Course and the legal
 * pages - because they are informational or archival and need a global exit
 * that their own content does not provide.
 *
 * Six routes deliberately do NOT get it, and each already ends on something
 * stronger than a template would be: Home and Contact carry the full end
 * credits, Studio closes on its ink "make something with us", Team closes on
 * its own moment plus START A PROJECT, Start a Project is a conversion page
 * that must not offer exit ramps, and the 404 has a dedicated recovery set.
 *
 * It is a wordmark, four destinations and the legal row - the smallest thing
 * that answers "where am I and how do I leave". The wordmark is NOT a home link
 * on routes that already show the brand mark in the chrome; one home
 * affordance per viewport (§08).
 */
export function DaoFooter({
  locale,
  messages,
  ground = "light",
  textured = false,
}: {
  locale: Locale;
  messages: Messages;
  /** which ground the footer is printed on */
  ground?: "light" | "dark";
  /**
   * Print the footer's light ground on the site's paper stock.
   *
   * Opt-in per route rather than on by default, because this footer is shared
   * by eight route families and turning the material on for all of them is a
   * change to seven pages nobody asked about. /services asks for it: the whole
   * dossier is paper, and a flat off-white band under it was the one surface
   * on that page that read as screen rather than stock.
   */
  textured?: boolean;
}) {
  const c = messages.dao.credits;
  const L = messages.daoRoutes.legal;

  return (
    <footer
      className={cn(
        "dao-slimfoot",
        ground === "dark" && "dao-slimfoot--paper",
        textured && "dao-slimfoot--stock",
      )}
    >
      {/* .dao-slimfoot is its own stacking context (position + z-index), so the
          multiply stays inside the footer and never reaches the page above it */}
      {textured && ground === "light" ? (
        <span className="dao-grain--strong" aria-hidden="true" />
      ) : null}
      <span className="dao-slimfoot__rule" aria-hidden="true" />
      <div className="dao-slimfoot__row">
        {/* the brand mark in the chrome is the home link on every route, so this
            wordmark is a mark of authorship rather than a second one (§08) */}
        <span className="dao-slimfoot__wordmark">8TH STATE PRODUCTION</span>
        <nav className="dao-slimfoot__nav" aria-label={c.endOfReel}>
          <Link href={localeHref(locale, "/work")}>{up(c.work)}</Link>
          <Link href={localeHref(locale, "/services")}>{up(c.services)}</Link>
          <Link href={localeHref(locale, "/studio")}>{up(c.studio)}</Link>
          <Link href={localeHref(locale, "/studio-lab")}>{up(c.lab)}</Link>
        </nav>
      </div>
      <nav className="dao-slimfoot__legal" aria-label={up(c.legal)}>
        <span className="dao-slimfoot__city">{up(messages.dao.ident.city)}</span>
        <Link href={localeHref(locale, "/privacy")}>{up(L.privacy)}</Link>
        <Link href={localeHref(locale, "/cookies")}>{up(L.cookies)}</Link>
        <Link href={localeHref(locale, "/copyright")}>{up(L.copyright)}</Link>
        <Link href={localeHref(locale, "/accessibility")}>{up(L.accessibility)}</Link>
      </nav>
    </footer>
  );
}
