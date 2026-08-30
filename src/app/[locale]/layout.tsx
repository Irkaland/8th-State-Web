import type { Metadata } from "next";
import { preload } from "react-dom";
import { notFound } from "next/navigation";
import { Caveat, Noto_Sans_Georgian } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import { LOCALES, type Locale, isLocale, LOCALE_HTML_LANG } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { getSiteUrl, isNoindex } from "@/lib/site-url";
import { routeAlternates } from "@/lib/route-metadata";

// perf phase 2A: Space Grotesk, Instrument Sans and Space Mono are removed -
// runtime FontFaceSet evidence showed none of their faces ever rendered a
// glyph (their only consumers were the deleted legacy token layer and the
// skip link, which now uses the system monospace stack). Noto Sans Georgian
// stays: it is the live Georgian fallback behind Optika / ALK Sanet.
// Perf phase 3: still declared, still the fallback behind ALK Sanet - only no
// longer PRELOADED. Its 41.5 KB file was fetched eagerly on every route in both
// locales, and runtime evidence says it never renders: across /, /ka, /ka/studio
// and /ka/work, document.fonts reports adevas / optika / glacier / sanet as
// `loaded` and Noto Sans Georgian never among them, because ALK Sanet covers the
// Georgian text. Dropping the preload keeps the @font-face and the fallback role
// exactly as they are; the file is now fetched only if a glyph actually needs it.
// Font family, weights, roles and display:swap are untouched.
const georgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--f-georgian",
  display: "swap",
  preload: false,
});

// The Lab handoff calls for Caveat 500 for its handwritten annotations only -
// the §02 note on /studio-lab and the line under each course program. It is
// never preloaded: it renders a few decorative words, well below the fold, and
// carries no content a reader depends on.
const caveat = Caveat({
  subsets: ["latin"],
  weight: "500",
  variable: "--f-caveat",
  display: "swap",
  preload: false,
});

// Approved brand fonts (Digital Art Object handoff): Adevas display,
// Optika UI/body, Glacier numerals/chapters, ALK Sanet Georgian companions.
// §P4: the three single-style faces now DECLARE the weight they actually
// contain. Each file carries exactly one weight (OS/2 usWeightClass 400), and
// an @font-face with no font-weight descriptor was being emitted, so the CSS
// said nothing about what the file holds. Adevas and Glacier are Latin-only;
// ALK Sanet is the Georgian face and the one this matters for - see the
// font-synthesis rule in dao.css.
const adevas = localFont({
  src: "../../fonts/Adevas-Regular.woff2",
  weight: "400",
  variable: "--f-adevas",
  display: "swap",
});
const optika = localFont({
  src: [
    { path: "../../fonts/Optika-Regular.woff2", weight: "400" },
    { path: "../../fonts/Optika-Medium.woff2", weight: "500" },
    { path: "../../fonts/Optika-SemiBold.woff2", weight: "600" },
  ],
  variable: "--f-optika",
  display: "swap",
});
const glacier = localFont({
  src: "../../fonts/Glacier-Regular.woff2",
  weight: "400",
  variable: "--f-glacier",
  display: "swap",
});
// §P4: `adjustFontFallback` is off for ALK Sanet alone. next/font was emitting a
// `sanet Fallback` face - local("Arial") at size-adjust 114.49%, ascent 63.67%,
// descent 1.62% - immediately after `sanet` in the stack, so it intercepted
// every character ALK Sanet does not contain before the rest of the stack was
// ever consulted. ALK Sanet holds 128 codepoints and no typographic
// punctuation, so the middots, ellipses and quotes inside Georgian copy were
// rendering in oversized Arial. With the auto-fallback gone, the Georgian role
// tokens in dao.css name their own fallback and those characters resolve to
// Optika, which is the brand's own Latin face.
const sanet = localFont({
  src: "../../fonts/ALK-Sanet-Regular.woff2",
  weight: "400",
  variable: "--f-sanet",
  display: "swap",
  adjustFontFallback: false,
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  const siteUrl = getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: m.meta.defaultTitle, template: m.meta.titleTemplate },
    description: m.meta.description,
    // §P0: the locale HOME's own alternates. This is the layout default, so it
    // is only ever the answer for "/" and "/ka" - every other route declares
    // its own via routeAlternates(), because Next replaces `alternates`
    // wholesale rather than merging it field by field. Leaving this as the
    // site-wide default is what made every page canonicalise to the homepage.
    alternates: routeAlternates(locale, "/"),
    robots: isNoindex() ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: "8th State Production",
      locale: locale === "ka" ? "ka_GE" : "en_US",
      title: m.meta.defaultTitle,
      description: m.meta.description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "8th State Production" }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const m = getMessages(locale);

  // Perf phase 2B: the two brand textures that paint the biggest first-view
  // surfaces are CSS background-images, so the preload scanner cannot see
  // them - measured ~430ms discovery delay on /work, where the weave IS the
  // LCP element. These hints (hoisted into <head> during SSR) start both
  // fetches with the document instead of after stylesheet parsing. URLs
  // match the CSS references in dao.css exactly, so the browser reuses the
  // request - no double download. Visuals untouched.
  preload("/assets/textures/canvas-weave.webp", { as: "image" });
  preload("/assets/textures/paper-grain-strong.webp", { as: "image" });
  // The Studio Ident unfolds the official serpent mark in place on the first
  // frame, so a late decode would read as "the image took time to load"
  // rather than choreography. Both files are CSS background/mask images,
  // invisible to the preload scanner for the same reason as the textures
  // above. The celestial sun is also the global navigation mark, so the one
  // hint covers the ident's two suns and the chrome chip together.
  preload("/assets/brand/serpent-infinity.webp", { as: "image" });
  // Perf phase 3: these two are consumed as CSS `mask-image` (--m), and a mask
  // fetch is made in CORS mode, where the three above are `background-image`
  // and fetched no-CORS. Without a matching crossorigin the preload could not
  // be reused - Chrome logged "the request credentials mode does not match",
  // discarded it, and fetched each file a SECOND time. Two wasted preloads and
  // two duplicate downloads on every route in both locales. The hint now
  // matches how the asset is actually requested.
  preload("/assets/brand/celestial-sun.webp", { as: "image", crossOrigin: "anonymous" });
  preload("/assets/graphics/sun.webp", { as: "image", crossOrigin: "anonymous" });

  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      data-scroll-behavior="smooth"
      className={`${georgian.variable} ${adevas.variable} ${optika.variable} ${glacier.variable} ${sanet.variable} ${caveat.variable}`}
    >
      <body>
        {/* Text Motion V3 §24/§41 - the reveal runtime's own switch, set before
            first paint.

            Every hidden pre-state in dao-motion.css is scoped to this
            attribute, so two things are true by construction. With scripting
            off, unavailable or broken, the attribute never lands and the page
            renders in its FINAL state - no heading is ever left at opacity 0
            waiting for a class that is not coming. And when the reader asks for
            reduced motion the attribute is withheld, so they get final states
            with no transition at all rather than a shortened one.

            It is inline and synchronous on purpose: an attribute set after
            hydration would show the settled page and then animate it. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)' +
              'document.documentElement.setAttribute("data-dao-motion","")}catch(e){}',
          }}
        />
        <a href="#main" className="skip-link">
          {m.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
