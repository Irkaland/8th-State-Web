import { z } from "zod";
import { PROJECTS } from "./projects";
import {
  projectSchema,
  serviceSchema,
  capabilitySchema,
  processStepSchema,
  pathwaySchema,
} from "./types";
import { SERVICES } from "./services";
import { CAPABILITIES } from "./capabilities";
import { PROCESS, GEORGIA_PROCESS } from "./process";
import { PATHWAYS } from "./pathways";

export type ContentIssue = { where: string; message: string };

/**
 * Validate all structured content against its schemas plus referential integrity.
 * Returns a list of issues (empty = valid). Used by unit tests and dev-time checks.
 */
export function validateContent(): ContentIssue[] {
  const issues: ContentIssue[] = [];

  const parseAll = <T>(label: string, schema: z.ZodType<T>, items: unknown[]) => {
    items.forEach((item, i) => {
      const res = schema.safeParse(item);
      if (!res.success) {
        issues.push({
          where: `${label}[${i}]`,
          message: res.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
        });
      }
    });
  };

  parseAll("projects", projectSchema, PROJECTS);
  parseAll("services", serviceSchema, SERVICES);
  parseAll("capabilities", capabilitySchema, CAPABILITIES);
  parseAll("process", processStepSchema, PROCESS);
  parseAll("georgiaProcess", processStepSchema, GEORGIA_PROCESS);
  parseAll("pathways", pathwaySchema, PATHWAYS);

  // Referential integrity
  const slugs = new Set(PROJECTS.map((p) => p.slug));
  if (slugs.size !== PROJECTS.length)
    issues.push({ where: "projects", message: "duplicate slugs" });

  const orders = new Set(PROJECTS.map((p) => p.order));
  if (orders.size !== PROJECTS.length)
    issues.push({ where: "projects", message: "duplicate order values" });

  for (const p of PROJECTS) {
    if (p.relatedSlug && !slugs.has(p.relatedSlug)) {
      issues.push({
        where: `projects.${p.slug}`,
        message: `relatedSlug "${p.relatedSlug}" does not exist`,
      });
    }
    if (!p.categories.includes(p.primaryCategory)) {
      issues.push({ where: `projects.${p.slug}`, message: "primaryCategory not in categories" });
    }
  }

  if (PROJECTS.filter((p) => p.featured).length < 6) {
    issues.push({
      where: "projects",
      message: "expected at least 6 featured projects for the homepage",
    });
  }

  return issues;
}
