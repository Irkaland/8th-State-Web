import type { MetadataRoute } from "next";
import { getSiteUrl, isNoindex } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  if (isNoindex()) {
    // Preview deployments can opt out of indexing via NEXT_PUBLIC_SITE_NOINDEX=true.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
