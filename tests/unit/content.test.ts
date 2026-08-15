import { describe, it, expect } from "vitest";
import { validateContent } from "@/content/validate";
import {
  PROJECTS,
  projectsByCategory,
  featuredProjects,
  getProject,
  projectSlugs,
} from "@/content/projects";

describe("content schema validation", () => {
  it("passes schema + referential integrity", () => {
    expect(validateContent()).toEqual([]);
  });

  it("has 12 projects with unique slugs", () => {
    expect(PROJECTS).toHaveLength(12);
    expect(new Set(projectSlugs()).size).toBe(12);
  });

  it("every relatedSlug resolves", () => {
    for (const p of PROJECTS) {
      if (p.relatedSlug) expect(getProject(p.relatedSlug)).toBeDefined();
    }
  });
});

describe("category filtering", () => {
  it("returns all for 'all'", () => {
    expect(projectsByCategory("all")).toHaveLength(12);
  });

  it("filters to a single category and matches membership", () => {
    const product = projectsByCategory("product");
    expect(product.length).toBeGreaterThan(0);
    expect(product.every((p) => p.categories.includes("product"))).toBe(true);
  });

  it("returns empty for an unknown category (drives the empty state)", () => {
    expect(projectsByCategory("does-not-exist")).toHaveLength(0);
  });

  it("keeps homepage + work sharing the same source (featured ⊆ all)", () => {
    const slugs = new Set(PROJECTS.map((p) => p.slug));
    expect(featuredProjects().every((p) => slugs.has(p.slug))).toBe(true);
    expect(featuredProjects().length).toBeGreaterThanOrEqual(6);
  });

  it("returns projects in stable order", () => {
    const orders = projectsByCategory("all").map((p) => p.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
