import { z } from "zod";
import type { LocalizedText } from "./localized";

// ---- Localized text ----------------------------------------------------------
// The LocalizedText type and the t() helper live in ./localized (schema-free)
// so client components never pull the zod runtime into their bundle (perf
// phase 2A). This schema stays aligned with the type via the z.ZodType bound.

export const localizedTextSchema: z.ZodType<LocalizedText> = z.object({
  en: z.string().min(1),
  ka: z.string().min(1),
});
export type { LocalizedText } from "./localized";

// ---- Media ------------------------------------------------------------------

export const mediaKind = z.enum(["image", "video", "detail", "bts"]);

export const mediaSchema = z.object({
  src: z.string().startsWith("/media/"),
  alt: localizedTextSchema,
  kind: mediaKind.optional(),
  caption: localizedTextSchema.optional(),
  badge: localizedTextSchema.optional(),
});
export type Media = z.infer<typeof mediaSchema>;

// ---- Categories -------------------------------------------------------------

export const categoryId = z.enum([
  "campaigns",
  "product",
  "fashion",
  "food-lifestyle",
  "film-culture",
]);
export type CategoryId = z.infer<typeof categoryId>;

export const categorySchema = z.object({
  id: categoryId,
  label: localizedTextSchema,
});
export type Category = z.infer<typeof categorySchema>;

// ---- Projects ---------------------------------------------------------------

export const creditSchema = z.object({
  role: localizedTextSchema,
  name: z.string().min(1),
  provisional: z.boolean().default(true),
});
export type Credit = z.infer<typeof creditSchema>;

/**
 * Editorial lifecycle of a project. Deliberately two values: "published" is
 * everything currently in the archive, "in-development" is work that exists but
 * is not finished or not yet releasable.
 *
 * A STATUS is not a category and not a capability. It answers "is this
 * finished?", which is why the Work filter for it is ?status=in-development
 * rather than another entry in the discipline taxonomy.
 *
 * No project in the repository is marked in-development: nothing in the
 * approved content says any of the twelve is unfinished, and inventing that
 * would misrepresent the archive. The filter is wired and tested and currently
 * returns an intentional empty state.
 */
export const projectStatus = z.enum(["published", "in-development"]);
export type ProjectStatus = z.infer<typeof projectStatus>;

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  titleProvisional: z.boolean().default(true),
  client: z.string().min(1),
  year: z.string().min(1),
  location: localizedTextSchema,
  categories: z.array(categoryId).min(1),
  primaryCategory: categoryId,
  categoryLabel: localizedTextSchema,
  services: z.array(localizedTextSchema).min(1),
  deliverables: z.array(localizedTextSchema).min(1),
  studioRole: localizedTextSchema,
  summary: localizedTextSchema,
  creativeIdea: localizedTextSchema,
  productionApproach: localizedTextSchema,
  usage: localizedTextSchema.optional(),
  cover: mediaSchema,
  hero: mediaSchema.optional(),
  gallery: z.array(mediaSchema).default([]),
  bts: z.array(mediaSchema).default([]),
  credits: z.array(creditSchema).default([]),
  relatedSlug: z.string().optional(),
  featured: z.boolean().default(false),
  status: projectStatus.default("published"),
  order: z.number().int(),
  isVideo: z.boolean().default(false),
  verified: z.boolean().default(false),
});
export type Project = z.infer<typeof projectSchema>;

// ---- Team -------------------------------------------------------------------

/**
 * One person who runs and produces the work.
 *
 * The repository contains NO approved people data - the only person-shaped
 * content anywhere is `credits[].name: "Name Surname"` with provisional: true,
 * an explicit placeholder. So this schema exists and the page is built, but
 * TEAM is deliberately empty: inventing names, titles, biographies or portraits
 * would put fabricated claims about real staff on a live production site.
 *
 * Everything a real entry will need is here, so adding people later is a data
 * edit and nothing more:
 *   name          not localised - a person's name is their name
 *   role          localised job title
 *   bio           localised short bio, optional until copy is approved
 *   portrait      optional: absent renders the typographic placeholder frame
 *   capabilities  optional link to the canonical capability taxonomy
 *   link          optional single external link (site/profile)
 *   order         explicit sort, same convention as projects
 */
export const teamMemberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
  name: z.string().min(1),
  role: localizedTextSchema,
  bio: localizedTextSchema.optional(),
  portrait: mediaSchema.optional(),
  capabilities: z.array(z.string()).default([]),
  link: z.string().url().optional(),
  order: z.number().int(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

// ---- Structured lists -------------------------------------------------------

export const serviceSchema = z.object({
  n: z.string(),
  name: localizedTextSchema,
  items: z.array(localizedTextSchema).min(1),
});
export type Service = z.infer<typeof serviceSchema>;

export const capabilitySchema = z.object({
  title: localizedTextSchema,
  desc: localizedTextSchema,
});
export type Capability = z.infer<typeof capabilitySchema>;

export const processStepSchema = z.object({
  n: z.string(),
  title: localizedTextSchema,
  desc: localizedTextSchema,
});
export type ProcessStep = z.infer<typeof processStepSchema>;

export const pathwaySchema = z.object({
  letter: z.string(),
  title: localizedTextSchema,
  desc: localizedTextSchema,
  tags: localizedTextSchema,
  cta: localizedTextSchema,
  href: z.string(),
});
export type Pathway = z.infer<typeof pathwaySchema>;
