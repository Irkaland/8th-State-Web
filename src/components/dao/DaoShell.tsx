import type { Messages } from "@/i18n";
import { chromeMessages, identMessages } from "@/i18n/slices";
import type { Locale } from "@/i18n/locales";
import { DaoChrome } from "./DaoChrome";
import { PageVeil, type VeilFamily } from "./PageVeil";
import { ReturnTab } from "./ReturnTab";
import { SessionResume } from "./SessionResume";
import { StudioIdent } from "./StudioIdent";

/**
 * Shared shell for every route: the Studio Ident (plays on every hard load
 * on any route per v7 contract #6, never on internal navigation), the
 * persistent chrome, the route's material entrance veil and the contextual
 * return tab (v7 contract #1).
 */
export function DaoShell({
  locale,
  messages,
  veil,
  returnTab,
  children,
}: {
  locale: Locale;
  messages: Messages;
  veil: VeilFamily;
  returnTab?: { label: string; parent: string; ground?: "dark" | "light" };
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
      {returnTab && (
        <ReturnTab
          locale={locale}
          label={returnTab.label}
          parent={returnTab.parent}
          ground={returnTab.ground}
        />
      )}
      <main id="main">{children}</main>
    </div>
  );
}
