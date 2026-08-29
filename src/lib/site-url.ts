/**
 * The site's canonical origin - ONE source of truth for every absolute URL the
 * app emits (metadataBase, canonical, hreflang, Open Graph, robots, sitemap).
 *
 * §P0: this used to fall back to http://localhost:3000 in production. It only
 * showed on the one route that is rendered on demand (/work): Netlify sets
 * `URL` and `NETLIFY` during the BUILD, so statically generated pages baked the
 * right origin in, but a request-time render in a Netlify function sees neither
 * variable and dropped to the dev fallback. Production therefore published
 * `canonical="http://localhost:3000"` and an og:image on localhost for /work
 * and /ka/work.
 *
 * The precedence below fixes that without introducing a second competing
 * origin:
 *
 *   1. NEXT_PUBLIC_SITE_URL   explicit, and the ONLY thing that should be set
 *                             per environment. Covers preview deploys, custom
 *                             domains and anything self-hosted. Inlined at
 *                             build time, so it is available at request time
 *                             too - which is precisely why the Netlify-only
 *                             variables below cannot be relied on alone.
 *   2. Netlify's own vars     URL / DEPLOY_PRIME_URL, for a deploy that has not
 *                             been configured with (1) yet. Build-time only.
 *   3. PRODUCTION_ORIGIN      the last-resort answer for a production build.
 *                             Never a localhost URL, so a missing environment
 *                             variable can no longer publish a dev address to
 *                             the public internet.
 *   4. localhost              development and test only.
 *
 * Setting NEXT_PUBLIC_SITE_URL in the Netlify environment makes steps 2-4 moot
 * and remains the recommended configuration; step 3 exists so that forgetting
 * to do so is a cosmetic problem rather than an SEO one.
 */

/**
 * The deployed production origin. Declared once, here, and nowhere else in the
 * codebase - no page, component or script may hardcode an origin of its own.
 */
const PRODUCTION_ORIGIN = "https://8th-state-production.netlify.app";

const DEV_ORIGIN = "http://localhost:3000";

/**
 * §P7: the platform's own idea of the PRODUCTION origin, for a deploy that has
 * not been given NEXT_PUBLIC_SITE_URL yet.
 *
 * Netlify's URL / DEPLOY_PRIME_URL were already here. Vercel is the stated
 * final platform, so its equivalent is read too - and deliberately only
 * `VERCEL_PROJECT_PRODUCTION_URL`, which is the project's production domain
 * even when the code is running in a preview deployment. `VERCEL_URL` is NOT
 * consulted: it is the per-deployment hostname, so trusting it would let every
 * preview publish itself as its own canonical, which is the one thing §13
 * rules out. Vercel gives a bare host, so the scheme is added here.
 *
 * This is not a deployment migration and adds nothing platform-specific to the
 * app: it is the same "ask the host what it is called" rule the file already
 * applied, extended so that moving hosts cannot silently leave production
 * canonicalising at the old one.
 */
function platformOrigin(): string | undefined {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return undefined;
}

function firstConfigured(): string | undefined {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    platformOrigin(),
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    // an empty or whitespace-only variable is "unset", not an origin
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Environment-based site origin, never trailing-slashed. */
export function getSiteUrl(): string {
  const raw = firstConfigured() ?? (isProductionBuild() ? PRODUCTION_ORIGIN : DEV_ORIGIN);
  return raw.replace(/\/$/, "");
}

/** True for a production build, where a localhost origin is never correct. */
function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

export const isNoindex = (): boolean => process.env.NEXT_PUBLIC_SITE_NOINDEX === "true";

export { PRODUCTION_ORIGIN, DEV_ORIGIN };
