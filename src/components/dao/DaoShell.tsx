import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { DaoChrome } from "./DaoChrome";
import { PageVeil, type VeilFamily } from "./PageVeil";
import { ReturnTab } from "./ReturnTab";
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
  returnTab?: { label: string; fallback: string; ground?: "dark" | "light" };
  children: React.ReactNode;
}) {
  return (
    <div className="dao">
      <StudioIdent messages={messages} />
      <PageVeil family={veil} />
      <DaoChrome locale={locale} messages={messages} />
      {returnTab && (
        <ReturnTab
          locale={locale}
          label={returnTab.label}
          fallback={returnTab.fallback}
          ground={returnTab.ground}
        />
      )}
      <main id="main">{children}</main>
    </div>
  );
}
