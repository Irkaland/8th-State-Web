import { z } from "zod";
import { PROJECT_TYPE_IDS, SHOOT_TYPE_IDS, BUDGET_IDS } from "@/content/brief-options";

// Localized validation messages are injected at runtime; the schema uses stable message KEYS
// so the form can render the right locale string.
export const V = {
  required: "required",
  email: "email",
  minName: "minName",
  projectType: "projectType",
  consent: "consent",
} as const;

const fileMetaSchema = z.object({ name: z.string(), size: z.number() });
export type FileMeta = z.infer<typeof fileMetaSchema>;

export const briefSchema = z.object({
  // Step 1
  fullName: z.string().trim().min(2, V.minName),
  company: z.string().trim().optional().default(""),
  email: z.string().trim().min(1, V.required).email(V.email),
  phone: z.string().trim().optional().default(""),
  countryCity: z.string().trim().min(1, V.required),
  // Step 2
  projectType: z.enum(PROJECT_TYPE_IDS as [string, ...string[]], { message: V.projectType }),
  requiredServices: z.array(z.string()).default([]),
  description: z.string().trim().min(10, V.required),
  audience: z.string().trim().optional().default(""),
  references: z.string().trim().optional().default(""),
  // Step 3
  preferredDate: z.string().trim().optional().default(""),
  deadline: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  shootType: z.enum(SHOOT_TYPE_IDS as [string, ...string[]]).default("both"),
  productionDays: z.string().trim().optional().default(""),
  budget: z.enum(BUDGET_IDS as [string, ...string[]]).default("undefined"),
  // Step 4
  deliverables: z.array(z.string()).default([]),
  channels: z.string().trim().optional().default(""),
  formats: z.string().trim().optional().default(""),
  files: z.array(fileMetaSchema).default([]),
  notes: z.string().trim().optional().default(""),
  referral: z.string().trim().optional().default(""),
  // Step 5
  consent: z.boolean().refine((v) => v === true, { message: V.consent }),
});

export type BriefValues = z.infer<typeof briefSchema>;

// Default values (consent starts false → will fail the literal(true) on submit).
export const briefDefaults: BriefValues = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  countryCity: "",
  projectType: "" as BriefValues["projectType"],
  requiredServices: [],
  description: "",
  audience: "",
  references: "",
  preferredDate: "",
  deadline: "",
  location: "",
  shootType: "both",
  productionDays: "",
  budget: "undefined",
  deliverables: [],
  channels: "",
  formats: "",
  files: [],
  notes: "",
  referral: "",
  consent: false,
};

// Which fields belong to each step (drives per-step validation + error mapping).
export const STEP_FIELDS: Array<Array<keyof BriefValues>> = [
  ["fullName", "company", "email", "phone", "countryCity"],
  ["projectType", "requiredServices", "description", "audience", "references"],
  ["preferredDate", "deadline", "location", "shootType", "productionDays", "budget"],
  ["deliverables", "channels", "formats", "files", "notes", "referral"],
  ["consent"],
];

export const TOTAL_STEPS = STEP_FIELDS.length;
