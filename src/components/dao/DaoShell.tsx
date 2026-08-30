import type { Messages } from "@/i18n";
import { chromeMessages, identMessages } from "@/i18n/slices";
import type { Locale } from "@/i18n/locales";
import { DaoChrome } from "./DaoChrome";
import { DaoFooter } from "./DaoFooter";
import { PageVeil, type VeilFamily } from "./PageVeil";
import { RouteFocus } from "./RouteFocus";
import { SessionResume } from "./SessionResume";
import { StudioIdent } from "./StudioIdent";

/**
 * Shared shell for every route: the Studio Ident (plays on every hard load on
 * any route per v7 contract #6, never on internal navigation), the persistent
 * chrome, the route's material entrance veil, and - on the routes that need one
 * - the slim credits footer.
 *
 * FINAL UX §03: the contextual RETURN TAB is gone. It duplicated the brand mark
 * on top-level routes, was hidden below 720px, and gave the site a second
 * navigation vocabulary. Routes that have a contextual parent now print a
 * masthead back INSIDE their own composition (see MastheadBack), which is
 * visible at every width and dressed in the page's own material.
 *
 * FINAL UX §02: `footer` is opt-in per route rather than a template. Home,
 * Studio, Team, Start a Project, Contact and the 404 each end on something
 * designed and deliberately receive none.
 */
export function DaoShell({
  locale,
  messages,
  veil,
  footer = false,
  footerGround = "light",
  children,
}: {
  locale: Locale;
  messages: Messages;
  veil: VeilFamily;
  /** §02: the eight informational/archival route families opt in */
  footer?: boolean;
  footerGround?: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <div className="dao">
      {/* §15: a long absence re-enters the site from the ident */}
      <SessionResume home={locale === "en" ? "/" : `/${locale}`} />
      {/* §P3: DaoShell is a Server Component, so `messages` here never crosses
          the wire - but these two children are client components on EVERY
          route, and handing them the whole dictionary is what put all 497
          strings into every payload. They now receive only their own slices,
          which sets the localization floor for the entire site. */}
      <StudioIdent ident={identMessages(messages)} />
      <PageVeil family={veil} />
      <DaoChrome locale={locale} messages={chromeMessages(messages)} />
      {/* §10: differentiated route-change focus, in one place */}
      <RouteFocus />
      {/* §12: the skip link (rendered in the root layout) targets this element,
          so it has to be able to hold focus. tabindex="-1" makes it
          programmatically focusable without adding it to the tab order. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      {footer && <DaoFooter locale={locale} messages={messages} ground={footerGround} />}
    </div>
  );
}
