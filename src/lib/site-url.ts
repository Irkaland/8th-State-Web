/** Environment-based site URL (no hard-coded production domain). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NETLIFY ? process.env.URL : undefined) ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export const isNoindex = (): boolean => process.env.NEXT_PUBLIC_SITE_NOINDEX === "true";
