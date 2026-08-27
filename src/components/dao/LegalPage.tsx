import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { DaoShell } from "./DaoShell";
import { up } from "@/lib/cn";

export type LegalRoute = "privacy" | "cookies" | "copyright" | "accessibility";

/**
 * One shared Legal template renders all four flat routes (handoff 4g).
 * Quiet interpretation, same universe: readability wins over expression -
 * 14px Optika, 1.85 line height, 640px measure, faint page grain only.
 * Simple fade entrance. No Terms of Use (excluded by D-13.6).
 */
export function LegalPage({
  locale,
  messages,
  route,
  title,
  sections,
}: {
  locale: Locale;
  messages: Messages;
  route: LegalRoute;
  title: string;
  sections: { heading: string; body: string[] }[];
}) {
  const L = messages.daoRoutes.legal;
  const tabs: { id: LegalRoute; label: string }[] = [
    { id: "privacy", label: L.privacy },
    { id: "cookies", label: L.cookies },
    { id: "copyright", label: L.copyright },
    { id: "accessibility", label: L.accessibility },
  ];

  return (
    <DaoShell
      locale={locale}
      messages={messages}
      veil="fade"
      returnTab={{ label: up(messages.daoRoutes.returnTab.back), parent: "/", ground: "light" }}
    >
      <div className="dao-page dlg" data-dao-scene="light">
        <div className="dao-grain" style={{ opacity: 0.32 }} aria-hidden="true" />

        <nav className="dlg__tabs" aria-label={L.onThisPage} style={{ position: "relative" }}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={localeHref(locale, `/${tab.id}`)}
              className="dlg__tab"
              aria-current={tab.id === route ? "page" : undefined}
            >
              {up(tab.label)}
              <span className="dao-strike" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <h1 className="dlg__title">{title}</h1>
        <div className="dlg__updated">
          {up(L.lastUpdated)} - {up(messages.daoRoutes.contentRequired)}
        </div>

        <div className="dlg__bodygrid">
          <div className="dlg__body">
            {sections.map((s, i) => (
              <section key={i} id={`section-${i + 1}`}>
                <h2>
                  {i + 1}. {s.heading}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} style={{ marginTop: 10 }}>
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <aside className="dlg__toc">
            <span className="dao-kicker" style={{ color: "var(--dao-brown)", fontSize: 9 }}>
              {up(L.onThisPage)}
            </span>
            {sections.map((s, i) => (
              <a key={i} href={`#section-${i + 1}`}>
                {i + 1}. {s.heading}
              </a>
            ))}
          </aside>
        </div>

        <footer className="dlg__foot">
          <span>{up(L.footerLine)}</span>
          <span>
            <Link
              href={localeHref("en", `/${route}`)}
              aria-current={locale === "en" ? "true" : undefined}
              style={{ color: locale === "en" ? "var(--dao-ink)" : undefined }}
            >
              EN
            </Link>{" "}
            /{" "}
            <Link
              href={localeHref("ka", `/${route}`)}
              aria-current={locale === "ka" ? "true" : undefined}
              style={{ color: locale === "ka" ? "var(--dao-ink)" : undefined }}
            >
              KA
            </Link>
          </span>
        </footer>
      </div>
    </DaoShell>
  );
}
