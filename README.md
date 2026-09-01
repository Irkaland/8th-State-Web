# 8th State Production - Interactive Demo

A high-fidelity, responsive, bilingual (English / Georgian) **demo website** for **8th State Production**, an independent visual production studio in Tbilisi, Georgia.

> **This is a stakeholder-facing demonstration, not the final production release.** It has no backend, database, CMS, CRM, authentication, or email delivery. The "Start a Project" form is **simulated entirely in the browser** - nothing you submit leaves your device. See [Known limitations](#known-limitations).

Built from two approved design references (the functional **Wireframe** and the visual **UI Mockup**, preserved unchanged in `_design-reference/` and as the original `.zip` files in the repo root).

---

## Demo scope

Included and functional:

- Complete responsive homepage (sticky/transparent header, mobile menu, hero, studio statement, selected work grid, featured case study, services accordion, capabilities, audience pathways, process, Georgia preview, creative-partnerships note, dark final CTA, footer).
- English at `/`, Georgian at `/ka`, with a language switcher that preserves the current route + query.
- Data-driven `/work` index with single-select category filters, live result count, clear filter, empty state, URL sync and browser Back/Forward.
- A fully populated editorial case study at `/work/aom-summer-collection` (and a working template for all 12 projects).
- A dedicated `/georgia-production` page.
- A five-step **Start a Project** brief with validation, an accessible error summary, progress, back-without-data-loss, query prefill, a time-limited local draft, a simulated submission with a demo reference number, a success state, and a print/PDF copy of the brief.
- `/privacy`, `/credits`, and a localized 404.
- Accessibility (WCAG 2.2 AA targeted), reduced-motion support, SEO metadata, sitemap, robots, and an OG image.

Intentionally **not** included (this phase): Supabase/DB, CMS/admin, CRM, real email, permanent file storage, payments, auth, production analytics, a real credentials deck, and production deployment. The code is structured so these can be added later without rebuilding the visual application.

---

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript (strict)**
- **Tailwind CSS v4** with CSS custom properties for design tokens
- Hand-rolled, zero-dependency **i18n** (locale routing via `src/proxy.ts`; dictionaries in `src/i18n/messages/`)
- **Zod** + **React Hook Form** for the brief
- `next/image` for all media
- **ESLint** (flat config) + **Prettier**
- **Vitest** (unit) · **Playwright** + **@axe-core/playwright** (e2e + accessibility)

Node.js **20.9+** required (Next 16). No Vercel-only assumptions; Netlify-preview compatible.

---

## Local setup

```bash
npm install
npm run dev          # http://localhost:3000
```

Production preview:

```bash
npm run build
npm run start
```

### Commands

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Dev server (Turbopack)                                        |
| `npm run build`                   | Production build                                              |
| `npm run start`                   | Serve the production build                                    |
| `npm run lint`                    | ESLint                                                        |
| `npm run typecheck`               | `tsc --noEmit`                                                |
| `npm run format` / `format:check` | Prettier write / check                                        |
| `npm run test`                    | Vitest unit tests                                             |
| `npm run test:e2e`                | Playwright e2e + axe (`npm run test:e2e:install` first, once) |

Utility scripts: `node scripts/make-og.mjs` (rebuild `public/og.png`).

---

## Folder structure

```
src/
  proxy.ts                 # Locale routing (EN unprefixed, KA under /ka)
  app/
    [locale]/              # Root layout + all pages (no top-level app/layout - Next i18n pattern)
      layout.tsx           # <html>, fonts, header, footer
      page.tsx             # Homepage (S1-S13)
      work/page.tsx        # Work index (+ WorkExplorer client filtering)
      work/[slug]/page.tsx # Case-study template
      georgia-production/  # Georgia page
      start-a-project/     # Brief flow
      privacy/ credits/ not-found.tsx
    globals.css            # Design tokens + component classes
    icon.svg robots.ts sitemap.ts
  components/              # Header, Footer, Logo, cards, media, brief/*, home/*
  content/                # Typed content layer (projects, services, taxonomy, site config, flags…)
  i18n/                   # locales.ts + messages/{en,ka}.ts
  lib/                    # brief-schema, draft, reference, helpers
public/media/             # Showreel master + its poster (no photography ships yet)
tests/unit/  tests/e2e/   # Vitest + Playwright
_design-reference/        # Extracted Wireframe + UI Mockup (reference only)
```

---

## Route map

| EN                    | KA                          | Page                                 |
| --------------------- | --------------------------- | ------------------------------------ |
| `/`                   | `/ka`                       | Homepage                             |
| `/work`               | `/ka/work`                  | Work index (filter via `?category=`) |
| `/work/[slug]`        | `/ka/work/[slug]`           | Case study (12 slugs)                |
| `/georgia-production` | `/ka/georgia-production`    | Georgia Production                   |
| `/start-a-project`    | `/ka/start-a-project`       | Brief flow (`?type=` prefill)        |
| `/privacy` `/credits` | `/ka/privacy` `/ka/credits` | Legal / credits                      |
| 404                   | 404                         | Localized not-found                  |

`/robots.txt`, `/sitemap.xml`, `/icon.svg`, `/og.png` are generated.

### Refresh / hard-load contract

A **real document load** (first visit, browser refresh, address-bar entry) of any deep route is redirected by `src/proxy.ts` to its locale home (`/` or `/ka`): the Studio Ident plays, then the homepage opens at the top of the Master Showreel (`history.scrollRestoration` is forced to `manual`; the scroll reset happens behind the Ident, so there is no visible jump). Internal client-side navigations and prefetches are RSC fetches (they carry the `rsc` header) and are never redirected - the Ident never replays on them. Policy: `src/lib/hard-load.ts` (unit-tested).

Automated suites that must render a deep route directly send the `x-dao-hard-load: allow` header (set globally in `playwright.config.ts`); the dedicated refresh tests drop it to behave like a real browser.

---

## Editing content

Everything user-facing lives in a typed content layer - no CMS needed for the demo.

- **UI copy / labels / prose:** `src/i18n/messages/en.ts` and `ka.ts` (same shape; TypeScript enforces parity).
- **Projects:** `src/content/projects.ts` (single source shared by homepage + Work + case study). Each project has bilingual text fields (`LocalizedText = { en, ka }`), media, services, deliverables, credits, and flags like `featured`, `titleProvisional`, `isVideo`.
- **Services / capabilities / process / pathways / Georgia scope:** `src/content/*.ts`.
- **Categories / filters:** `src/content/taxonomy.ts`.
- **Contact details + feature flags:** `src/content/site.ts` (only _confirmed_ contact values render; unconfirmed ones are gated).
- **Brief options** (project types, services, deliverables, budgets): `src/content/brief-options.ts`.

Content is schema-validated (Zod) by `src/content/validate.ts`, exercised in `tests/unit/content.test.ts`.

### Localization

EN is the default (unprefixed). KA lives under `/ka` via `src/proxy.ts` (a rewrite for EN, passthrough for KA). Add strings to **both** `en.ts` and `ka.ts` - the `Messages` type will fail the build if a key is missing. The language switcher (`LanguageSwitcher.tsx`) maps the current path to its equivalent in the other locale and preserves query params.

### Filling an image slot

**No photography ships.** Every image position on the site is an empty slot: the frame, its aspect ratio, its grid cell and the type around it are the approved composition and are held whether or not a file exists. `Media.src` is optional, and a slot with no `src` renders `MediaSlot` (`src/components/dao/MediaSlot.tsx`) - the site's own paper stock under one small `Image pending` mark, in the same language the TEAM sheet uses for a portrait it does not have yet.

To fill one: drop the master into `public/media/` and add its `src` to the matching entry in the content layer (`projects.ts`, `what-we-make.ts`, `pathways.ts`, `team.ts`). That single key is the whole change - no layout, CSS or component edit, because the slot was already the right size in the right place. Nothing is hotlinked.

### Adding a case study

1. Add a project object to `PROJECTS` in `src/content/projects.ts` (unique `slug`, `order`, bilingual fields, media, `relatedSlug`).
2. Optional: drop its imagery into `public/media/` and give each media entry a `src`. Without one the project's frames render as empty slots and the archive still lays out correctly.
3. That's it - it appears on `/work` automatically, gets a static route at `/work/[slug]`, and (if `featured: true`) shows on the homepage grid.

---

## Simulated form behavior

The brief **never sends data anywhere.** On submit it validates all fields, shows a realistic loading state, prevents duplicate submission, generates a clearly demo-scoped reference (`8SP-YYYY-NNNN`, labeled "Demo reference"), shows the success state, clears the local draft, and offers a print/PDF copy. A draft is autosaved to `localStorage` with a 7-day expiry (metadata only - **file bytes are never stored or uploaded**) and cleared on success. This is documented to the user on the success screen and in `/privacy`.

To wire a real backend later, replace the simulated `onValid` handler in `src/components/brief/BriefForm.tsx` with a server action / API route; the Zod schema (`src/lib/brief-schema.ts`) is already the contract.

---

## Netlify preview preparation

- No Vercel-only APIs are used. Deploy with the official Next.js runtime (`@netlify/plugin-nextjs`).
- Set `NEXT_PUBLIC_SITE_URL` to the preview URL (used for canonical/OG/sitemap). See `.env.example`.
- Set `NEXT_PUBLIC_SITE_NOINDEX=true` on previews to emit `noindex` (robots + `X-Robots-Tag`).
- Node 20.9+.
- Do **not** deploy without the studio's explicit approval.

---

## Known limitations

- Form submission, the credentials request, and file "uploads" are **simulated** (no backend).
- Project names, clients, and credits are **provisional placeholders** (tracked in `DEMO_CONTENT_TODO.md`).
- **No photography ships.** Every image position renders as an empty editorial slot awaiting the studio's own masters; only the Showreel and its poster are real media.
- Contact email/phone and response-time commitment are unconfirmed and therefore **not shown**.
- The brand mark is a documented temporary SVG/CSS approximation of the existing identity.

---

## Next production phase

Add a CMS + content backend, real submission (server action / email or CRM), the final logo/vector and studio master imagery, confirmed contact details and business facts, and a production deployment. The visual application and content contracts here are built to accept those without a rebuild. See `DEMO_HANDOFF_CHECKLIST.md`.
