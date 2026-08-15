import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { localeHref, LOCALES } from "@/i18n/locales";
import { projectSlugs } from "@/content/projects";

// Public, indexable paths per the v6 route registry (legal routes omitted).
const PUBLIC_PATHS = [
  "/",
  "/work",
  "/services",
  "/studio",
  "/studio-lab",
  "/process",
  "/georgia-production",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths = [...PUBLIC_PATHS, ...projectSlugs().map((s) => `/work/${s}`)];

  return paths.map((path) => {
    const languages: Record<string, string> = {};
    for (const l of LOCALES) languages[l] = `${base}${localeHref(l, path)}`;
    return {
      url: `${base}${localeHref("en", path)}`,
      lastModified: new Date("2026-07-18"),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages },
    };
  });
}
