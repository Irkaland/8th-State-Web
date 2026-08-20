"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Messages } from "@/i18n";
import { type Locale, localeHref, switchLocalePath } from "@/i18n/locales";
import { useInViewOnce } from "./hooks";
import { up } from "@/lib/cn";

/**
 * Act 06 - Contact, the final scene + end credits. Invitation rises by word
 * group; info and fields fade up; the faint sun turns slowly. The enquiry
 * form is a visual state only until form scope is approved (handoff 2j) -
 * SEND explains that enquiries are not yet connected.
 */
export function ContactAct({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.contact;
  const c = messages.dao.credits;
  const pathname = usePathname() || "/";
  const sectionRef = useInViewOnce<HTMLElement>(0.15);

  return (
    <section
      ref={sectionRef}
      className="dao-contact"
      data-dao-scene="dark"
      id="contact"
      aria-label={m.act}
    >
      <div className="dao-weave" aria-hidden="true" />
      <span className="dao-contact__sun dao-mask" aria-hidden="true" />

      <div className="dao-label dao-contact__label">{m.act}</div>

      <div className="dao-contact__grid">
        <div className="dao-contact__left">
          <h2 className="dao-contact__invite">
            <span className="dao-rise">
              <span>{m.title1}</span>
            </span>
            <span className="dao-rise">
              <span style={{ ["--d" as string]: "90ms" }}>
                {m.title2}
                <span className="dao-dot">.</span>
              </span>
            </span>
          </h2>
          <p className="dao-contact__note dao-fade" style={{ ["--d" as string]: "200ms" }}>
            {m.note}
          </p>
          <div className="dao-contact__facts dao-fade" style={{ ["--d" as string]: "280ms" }}>
            <div className="dao-contact__fact">
              <span className="dao-contact__factlabel">{up(m.email)}</span>
              <span className="dao-contact__tbd">{m.emailTbd}</span>
            </div>
            <div className="dao-contact__fact">
              <span className="dao-contact__factlabel">{up(m.studio)}</span>
              <span style={{ color: "rgba(242,237,227,.85)" }}>{m.studioValue}</span>
            </div>
            <div className="dao-contact__fact">
              <span className="dao-contact__factlabel">{up(m.follow)}</span>
              <span className="dao-contact__tbd">{m.followTbd}</span>
            </div>
          </div>
        </div>

        {/* Enquiry - visual state only until form scope is approved (2j). */}
        <form
          className="dao-contact__form dao-fade"
          style={{ ["--d" as string]: "340ms" }}
          onSubmit={(e) => e.preventDefault()}
          aria-describedby="dao-form-note"
        >
          <span id="dao-form-note" className="dao-contact__formnote">
            {up(m.enquiry)} - {m.sendPending}
          </span>
          <div className="dao-field">
            <label htmlFor="dao-name">{up(m.name)}</label>
            <input id="dao-name" name="name" type="text" autoComplete="name" />
          </div>
          <div className="dao-field">
            <label htmlFor="dao-email">{up(m.emailField)}</label>
            <input id="dao-email" name="email" type="email" autoComplete="email" />
          </div>
          <div className="dao-field">
            <label htmlFor="dao-what">{up(m.what)}</label>
            <textarea id="dao-what" name="message" rows={2} />
          </div>
          <button
            type="submit"
            className="dao-contact__send"
            aria-disabled="true"
            title={m.sendPending}
          >
            {up(m.send)}
            <span className="dao-contact__star dao-mask" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* end credits - the closing production card (v7 #13) */}
      <footer className="dao-credits">
        {/* the closing production card is also a way home (§12) */}
        <Link
          href={localeHref(locale, "/")}
          className="dao-credits__brand"
          aria-label="8th State Production"
        >
          <span className="dao-credits__chip">
            <span className="dao-grain" style={{ backgroundSize: "200px" }} aria-hidden="true" />
            <Image
              src="/assets/brand/8th-state-logo.png"
              alt="8th State Production"
              width={256}
              height={256}
            />
          </span>
          <span className="dao-credits__id">
            <span className="dao-credits__wordmark">8TH STATE PRODUCTION</span>
            <span className="dao-credits__line">
              {up(messages.dao.ident.city)} - {up(c.endWord)}
            </span>
          </span>
        </Link>
        <div className="dao-credits__symbols" aria-hidden="true">
          <span
            className="dao-mask"
            style={{ ["--m" as string]: "url(/assets/graphics/sun.webp)" }}
          />
          <span
            className="dao-mask"
            style={{ ["--m" as string]: "url(/assets/graphics/moon.webp)", width: 18, height: 18 }}
          />
          <span
            className="dao-mask"
            style={{ ["--m" as string]: "url(/assets/graphics/star.webp)" }}
          />
          <span
            className="dao-mask"
            style={{ ["--m" as string]: "url(/assets/graphics/rosette.webp)" }}
          />
        </div>
        <nav className="dao-credits__links" aria-label={c.endOfReel}>
          <Link href={localeHref(locale, "/work")}>{up(c.work)}</Link>
          <Link href={localeHref(locale, "/services")}>{up(c.services)}</Link>
          <Link href={localeHref(locale, "/studio")}>{up(c.studio)}</Link>
          <Link href={localeHref(locale, "/studio-lab")}>{up(c.lab)}</Link>
          <Link href={localeHref(locale, "/contact")}>{up(messages.dao.nav.contact)}</Link>
          <Link href={localeHref(locale, "/privacy")}>{up(c.legal)}</Link>
          <span className="dao-lang" style={{ gap: 14 }}>
            <Link
              href={switchLocalePath(pathname, "en")}
              aria-current={locale === "en" ? "true" : undefined}
            >
              EN
            </Link>
            <Link
              href={switchLocalePath(pathname, "ka")}
              aria-current={locale === "ka" ? "true" : undefined}
            >
              KA
            </Link>
          </span>
        </nav>
      </footer>
    </section>
  );
}
