import { z } from "zod";
import type { Locale } from "@/i18n/locales";

// ---- Localized text helpers -------------------------------------------------

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  ka: z.string().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export function t(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}

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
  order: z.number().int(),
  isVideo: z.boolean().default(false),
  verified: z.boolean().default(false),
});
export type Project = z.infer<typeof projectSchema>;

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
