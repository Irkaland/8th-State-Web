import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Locale, localeHref, isLocale } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { routeAlternates } from "@/lib/route-metadata";
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
  return {
    title: m.nav.contact,
    description: m.dao.contact.note,
    // §P0: this page canonicalises to ITSELF, not to the locale home.
    alternates: routeAlternates(locale, "/contact"),
  };
}

/**
 * /contact - the final scene as a route (handoff 4c). START A PRODUCTION
 * invitation, contact facts, quick-note visual form (per approved form
 * scope), the brief CTA to /start-a-project, and the end-credits footer
 * with the four legal routes.
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);
  const c = m.dao.contact;
  const R = m.daoRoutes.contact;
  const L = m.daoRoutes.legal;

  return (
    <DaoShell locale={locale} messages={m} veil="ink">
      <div className="dao-page dao-page--ink dct" data-dao-scene="dark">
        <div className="dao-weave" aria-hidden="true" />
        {/* §07: the same dark paper the Home Contact act carries */}
        <div className="dao-grain--dark" aria-hidden="true" />
        {/* §04: the inline top override is gone - it was tuned for the old
            640px sun, and would have held the enlarged one high on this route
            while it sat lower on Home. One rule now positions both. */}
        <span className="dao-contact__sun dao-mask" aria-hidden="true" />

        <InView className="dct__grid" threshold={0.05}>
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
            <span className="dao-kicker dao-fade" style={{ color: "rgba(242,237,227,.55)" }}>
              {up(R.kicker)}
            </span>
            <h1 className="dct__title">
              <span className="dao-rise">
                <span>{c.title1}</span>
              </span>
              <span className="dao-rise">
                <span style={{ ["--d" as string]: "90ms" }}>
                  {c.title2}
                  <span style={{ color: "var(--dao-red)" }}>.</span>
                </span>
              </span>
            </h1>
            <p className="dao-contact__note dao-fade" style={{ ["--d" as string]: "200ms" }}>
              {c.note}
            </p>
            <div className="dao-contact__facts dao-fade" style={{ ["--d" as string]: "280ms" }}>
              <div className="dao-contact__fact">
                <span className="dao-contact__factlabel">{up(c.email)}</span>
                <span className="dao-contact__tbd">{c.emailTbd}</span>
              </div>
              <div className="dao-contact__fact">
                <span className="dao-contact__factlabel">{up(c.studio)}</span>
                <span style={{ color: "rgba(242,237,227,.9)" }}>{c.studioValue}</span>
              </div>
              <div className="dao-contact__fact">
                <span className="dao-contact__factlabel">{up(c.follow)}</span>
                <span className="dao-contact__tbd">{c.followTbd}</span>
              </div>
            </div>
            <div
              className="dao-fade"
              style={{
                ["--d" as string]: "360ms",
                display: "flex",
                gap: 20,
                alignItems: "center",
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {/* §19: the same blue button language as SEND - softened at rest,
                  full #2374b3 on interaction */}
              <Link
                href={localeHref(locale, "/start-a-project")}
                className="dao-chipcta dao-btnfill"
              >
                {up(R.briefCta)}
                <span
                  className="dao-chipcta__glyph dao-mask"
                  style={{ ["--m" as string]: "url(/assets/graphics/star-solid.webp)" }}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* quick note - visual state per approved form scope */}
          <form
            className="dct__quick dao-fade"
            style={{ ["--d" as string]: "300ms" }}
            onSubmit={undefined}
            aria-describedby="dct-note"
          >
            <span id="dct-note" className="dao-contact__formnote">
              {up(R.quickNote)} - {c.sendPending}
            </span>
            <div className="dao-field">
              <label htmlFor="dct-name">{up(c.name)}</label>
              <input id="dct-name" name="name" type="text" autoComplete="name" />
            </div>
            <div className="dao-field">
              <label htmlFor="dct-email">{up(c.emailField)}</label>
              <input id="dct-email" name="email" type="email" autoComplete="email" />
            </div>
            <div className="dao-field">
              <label htmlFor="dct-message">{up(R.message)}</label>
              <textarea id="dct-message" name="message" rows={3} />
            </div>
            {/* §19: was an outlined ghost button - now the same blue fill system
                as SEND, so the page has one button language rather than two */}
            <button
              type="button"
              className="dct__sendnote dao-btnfill"
              aria-disabled="true"
              title={c.sendPending}
            >
              {up(R.sendNote)}
            </button>
          </form>
        </InView>

        {/* end credits with the four legal routes */}
        <footer className="dao-credits is-in" style={{ position: "relative" }}>
          <div className="dao-credits__brand">
            <span className="dao-credits__chip">
              {/* §06: the strong paper stock - the plain grain is too smooth to
                  register on a mid-tone blue */}
              <span
                className="dao-grain--strong"
                style={{ backgroundSize: "200px" }}
                aria-hidden="true"
              />
              {/* Perf phase 3: same chip, same fix as the Home closing card -
                  see ContactAct. The 5000x5000 master was shipped whole for a
                  128px-wide chip; `sizes` names the three widths the CSS
                  actually renders. Appearance unchanged. */}
              <Image
                src="/assets/brand/8th-state-logo.png"
                alt="8th State Production"
                width={256}
                height={256}
                sizes="(max-width: 560px) 70px, (max-width: 960px) 84px, 128px"
              />
            </span>
            <span className="dao-credits__id">
              <span className="dao-credits__wordmark">8TH STATE PRODUCTION</span>
              <span className="dao-credits__line">
                {up(m.dao.ident.city)} - {up(m.dao.credits.endWord)}
              </span>
            </span>
          </div>
          <nav className="dao-credits__links" aria-label={m.nav.menu}>
            <Link href={localeHref(locale, "/work")}>{up(m.dao.credits.work)}</Link>
            <Link href={localeHref(locale, "/services")}>{up(m.dao.credits.services)}</Link>
            <Link href={localeHref(locale, "/studio")}>{up(m.dao.credits.studio)}</Link>
            <Link href={localeHref(locale, "/studio-lab")}>{up(m.dao.credits.lab)}</Link>
            <Link href={localeHref(locale, "/privacy")}>{up(L.privacy)}</Link>
            <Link href={localeHref(locale, "/cookies")}>{up(L.cookies)}</Link>
            <Link href={localeHref(locale, "/copyright")}>{up(L.copyright)}</Link>
            <Link href={localeHref(locale, "/accessibility")}>{up(L.accessibility)}</Link>
          </nav>
        </footer>
      </div>
    </DaoShell>
  );
}
