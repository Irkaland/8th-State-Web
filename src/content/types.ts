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
  /**
   * The file, once the studio has supplied it.
   *
   * Optional because an image POSITION and an image FILE are different
   * things. The site's compositions are designed around their slots - frame,
   * ratio, grid cell, the whitespace and the type around them - and those
   * hold whether or not a master exists yet. A slot with no `src` renders the
   * waiting mark (see MediaSlot) and keeps its geometry exactly; supplying the
   * file later is this one line and nothing else.
   *
   * `alt` stays required regardless: it records what belongs in the slot, so
   * the eventual image arrives already described.
   */
  src: z.string().startsWith("/media/").optional(),
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
 * The groups a person can belong to, in the approved display order.
 * The landing roster is one continuous grid, so these are not drawn as headings:
 * the group orders the roster - which is how hierarchy is expressed - and is
 * stated inside the person's own profile.
 */
export const teamDepartment = z.enum([
  "creative-leadership",
  "direction-production",
  "camera-coordination",
  "art-department",
  "studio-support",
]);
export type TeamDepartment = z.infer<typeof teamDepartment>;

/**
 * One post in a person's professional history.
 *
 * Structured rather than a string so EXPERIENCE can be laid out as a record -
 * role against organisation, with the period and place set as metadata - and so
 * the section works with 0, 1 or many entries without the layout assuming a
 * count. Only `role` is required; a half-known post renders the parts it has.
 */
export const teamExperienceSchema = z.object({
  role: localizedTextSchema,
  organization: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
  location: localizedTextSchema.optional(),
  description: localizedTextSchema.optional(),
});
export type TeamExperience = z.infer<typeof teamExperienceSchema>;

/**
 * The documents a person's dossier can open.
 *
 * `resume` is a real file. `biography` and `artistStatement` are ids into
 * TEAM_DOCUMENTS (content/team-documents.ts) - the studio's supplied prose,
 * drawn as a native sheet rather than shipped as a PDF binary.
 */
export const teamDocumentsSchema = z.object({
  resume: z.object({ src: z.string().startsWith("/team/resumes/") }).optional(),
  biography: z.object({ id: z.string().min(1) }).optional(),
  artistStatement: z.object({ id: z.string().min(1) }).optional(),
});
export type TeamDocuments = z.infer<typeof teamDocumentsSchema>;

/** One credited project on a person's profile - joins to the Work archive. */
export const teamCreditSchema = z.object({
  /** must be a real slug in content/projects.ts; the contract test enforces it */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** what this person did on it, in their own credit language */
  role: localizedTextSchema.optional(),
});
export type TeamCredit = z.infer<typeof teamCreditSchema>;

/**
 * A person.
 *
 * Everything after the department is optional on purpose: the profile sheet
 * renders a block only when its field carries real content, so a half-confirmed
 * person shows a shorter sheet rather than a row of labelled blanks.
 *
 * The provisional flag marks a placeholder slot - a seat the studio has said
 * exists but has not yet supplied a person for. Those render as an explicit
 * marked blank and never as a name.
 */
export const teamMemberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
  /** the URL key for ?person= - kebab-case, stable */
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  /** omitted while the seat is provisional; the UI shows a marked blank */
  name: localizedTextSchema.optional(),
  provisional: z.boolean().default(false),
  department: teamDepartment,
  role: localizedTextSchema.optional(),
  secondaryRoles: z.array(localizedTextSchema).default([]),
  portrait: mediaSchema.optional(),
  shortStatement: localizedTextSchema.optional(),
  bio: localizedTextSchema.optional(),
  /** canonical capability ids where possible, so practice and Services agree */
  expertise: z.array(z.string()).default([]),
  experience: z.array(teamExperienceSchema).default([]),
  /** only projects this person is actually credited on */
  selectedWork: z.array(teamCreditSchema).default([]),
  clients: z.array(z.string()).default([]),
  awards: z.array(localizedTextSchema).default([]),
  credits: z.array(localizedTextSchema).default([]),
  education: z.array(localizedTextSchema).default([]),
  languages: z.array(localizedTextSchema).default([]),
  location: localizedTextSchema.optional(),
  portfolioUrl: z.string().url().optional(),
  /**
   * The professional documents a person has, and nothing more.
   *
   * The dossier derives its controls from this object alone - no component
   * asks who the person is - so a person with no documents renders no document
   * controls and a person who gains one later needs no code change.
   *
   * A resume is a supplied PDF, held by path under /team/resumes and never
   * spelled at a call site. A biography or artist statement is NOT a PDF: it
   * is an id into TEAM_DOCUMENTS, where the studio's own text lives as content
   * and is drawn as a native sheet. That asymmetry is deliberate - a CV is a
   * laid-out artefact the studio owns, while long-form prose reads better,
   * responds better and weighs nothing as real markup.
   */
  documents: teamDocumentsSchema.optional(),
  instagramUrl: z.string().url().optional(),
  vimeoUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  imdbUrl: z.string().url().optional(),
  behanceUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  /** free-form so international formats survive; never invented */
  phone: z.string().min(1).optional(),
  order: z.number().int(),
  featured: z.boolean().default(false),
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
