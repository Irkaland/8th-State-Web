import type { Metadata } from "next";
import { preload } from "react-dom";
import { notFound } from "next/navigation";
import { Noto_Sans_Georgian } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import { LOCALES, type Locale, isLocale, LOCALE_HTML_LANG } from "@/i18n/locales";
import { getMessages } from "@/i18n";
import { getSiteUrl, isNoindex } from "@/lib/site-url";

// perf phase 2A: Space Grotesk, Instrument Sans and Space Mono are removed -
// runtime FontFaceSet evidence showed none of their faces ever rendered a
// glyph (their only consumers were the deleted legacy token layer and the
// skip link, which now uses the system monospace stack). Noto Sans Georgian
// stays: it is the live Georgian fallback behind Optika / ALK Sanet.
const georgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--f-georgian",
  display: "swap",
});

// Approved brand fonts (Digital Art Object handoff): Adevas display,
// Optika UI/body, Glacier numerals/chapters, ALK Sanet Georgian companions.
const adevas = localFont({
  src: "../../fonts/Adevas-Regular.woff2",
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
  variable: "--f-glacier",
  display: "swap",
});
const sanet = localFont({
  src: "../../fonts/ALK-Sanet-Regular.woff2",
  variable: "--f-sanet",
  display: "swap",
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
    alternates: {
      canonical: locale === "en" ? "/" : "/ka",
      languages: { en: "/", ka: "/ka", "x-default": "/" },
    },
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
  preload("/assets/brand/celestial-sun.webp", { as: "image" });
  preload("/assets/graphics/sun.webp", { as: "image" });

  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      data-scroll-behavior="smooth"
      className={`${georgian.variable} ${adevas.variable} ${optika.variable} ${glacier.variable} ${sanet.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          {m.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
