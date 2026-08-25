import { describe, expect, it } from "vitest";
import {
  CAPABILITY_ROLE_ALIASES,
  DAO_SERVICES,
  DAO_SERVICE_GROUPS,
  capabilitiesOfGroup,
  capabilitiesOfProject,
  capabilityById,
  capabilityWorkHref,
  isCapabilityId,
  projectHasCapability,
} from "@/content/dao-services";
import { PROJECTS, projectsSorted } from "@/content/projects";
import {
  ALL_FILTER,
  IN_DEVELOPMENT_FILTER,
  applyWorkFilter,
  capabilityHasWork,
  parseWorkFilter,
  workFilterHref,
  workFilterLabel,
} from "@/content/work-filters";
import { DAO_DISCIPLINES } from "@/content/dao-work";
import { TEAM, hasTeam } from "@/content/team";

/** The nine capabilities the taxonomy contract fixes, in order. */
const NINE = [
  ["01", "creative-direction", "Creative Direction", "creative"],
  ["02", "art-direction", "Art Direction", "creative"],
  ["03", "production-design", "Production Design", "spatial"],
  ["04", "scenography", "Scenography", "spatial"],
  ["05", "costume-design", "Costume Design", "spatial"],
  ["06", "decoration", "Decoration", "spatial"],
  ["07", "film-video-production", "Film & Video Production", "image"],
  ["08", "photography", "Photography", "image"],
  ["09", "post-production", "Post-Production", "finishing"],
] as const;

describe("taxonomy contract - 4 groups, 9 capabilities", () => {
  it("has exactly four groups", () => {
    expect(DAO_SERVICE_GROUPS.map((g) => g.id)).toEqual([
      "creative",
      "spatial",
      "image",
      "finishing",
    ]);
  });

  it("has exactly the nine approved capabilities, numbered and grouped", () => {
    expect(DAO_SERVICES).toHaveLength(9);
    expect(DAO_SERVICES.map((s) => [s.n, s.id, s.name.en, s.group])).toEqual(
      NINE.map((r) => [...r]),
    );
  });

  it("gives every capability a unique canonical id", () => {
    const ids = DAO_SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(9);
    for (const id of ids) expect(isCapabilityId(id)).toBe(true);
  });

  it("gives every capability a unique number", () => {
    expect(new Set(DAO_SERVICES.map((s) => s.n)).size).toBe(9);
  });

  it("uses url-safe kebab-case ids, since they appear in ?capability=", () => {
    for (const s of DAO_SERVICES) expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("localises every capability and group in EN and KA", () => {
    for (const s of DAO_SERVICES) {
      expect(s.name.en.length).toBeGreaterThan(0);
      expect(s.name.ka.length).toBeGreaterThan(0);
      expect(s.desc.ka.length).toBeGreaterThan(0);
    }
    for (const g of DAO_SERVICE_GROUPS) {
      expect(g.name.ka.length).toBeGreaterThan(0);
      expect(g.layer.ka.length).toBeGreaterThan(0);
    }
  });

  it("assigns every capability to a real group, and every group has capabilities", () => {
    const groupIds = new Set(DAO_SERVICE_GROUPS.map((g) => g.id));
    for (const s of DAO_SERVICES) expect(groupIds.has(s.group)).toBe(true);
    for (const g of DAO_SERVICE_GROUPS) expect(capabilitiesOfGroup(g.id).length).toBeGreaterThan(0);
  });

  it("keeps groups contiguous, so one heading can precede its own rows", () => {
    // Homepage renders one heading per group by watching the group change
    // between consecutive rows - that only works if a group never reappears.
    const runs: string[] = [];
    for (const s of DAO_SERVICES) {
      if (runs[runs.length - 1] !== s.group) runs.push(s.group);
    }
    expect(new Set(runs).size).toBe(runs.length);
  });

  it("never reuses a group id as a capability id", () => {
    const capIds = new Set<string>(DAO_SERVICES.map((s) => s.id));
    for (const g of DAO_SERVICE_GROUPS) expect(capIds.has(g.id)).toBe(false);
  });

  it("keeps a capability and a same-named work category addressable apart", () => {
    // "photography" is legitimately BOTH a broad work category and a canonical
    // capability - they are different questions ("what kind of work is this?"
    // vs "which service does this demonstrate?") that happen to share a word.
    // What matters is that they can never be confused for one another, which
    // the separate query keys guarantee.
    const shared = DAO_DISCIPLINES.filter((d) => isCapabilityId(d.id)).map((d) => d.id);
    expect(shared, "photography is the known overlap").toEqual(["photography"]);
    for (const id of shared) {
      const asCategory = parseWorkFilter({ category: id });
      const asCapability = parseWorkFilter({ capability: id });
      expect(asCategory.kind).toBe("category");
      expect(asCapability.kind).toBe("capability");
      expect(asCategory).not.toEqual(asCapability);
      expect(workFilterHref(asCategory)).not.toBe(workFilterHref(asCapability));
    }
  });
});

describe("related work is capability-specific", () => {
  it("routes every capability to its own filtered archive", () => {
    for (const s of DAO_SERVICES) {
      expect(capabilityWorkHref(s.id)).toBe(`/work?capability=${s.id}`);
    }
    expect(new Set(DAO_SERVICES.map((s) => capabilityWorkHref(s.id))).size).toBe(9);
  });

  it("never routes a capability to the unfiltered archive", () => {
    // the specific regression: Art Direction used to land on bare /work
    for (const s of DAO_SERVICES) {
      const href = capabilityWorkHref(s.id);
      expect(href).not.toBe("/work");
      expect(href).not.toBe("/work?category=film-video");
    }
    expect(capabilityWorkHref("art-direction")).toBe("/work?capability=art-direction");
  });

  it("parses every capability url back to the same capability", () => {
    for (const s of DAO_SERVICES) {
      const f = parseWorkFilter({ capability: s.id });
      expect(f).toEqual({ kind: "capability", id: s.id });
      expect(workFilterHref(f)).toBe(capabilityWorkHref(s.id));
      expect(workFilterLabel(f)).toEqual(capabilityById(s.id).name);
    }
  });

  it("resolves a real result set for all nine, and never widens to everything", () => {
    for (const s of DAO_SERVICES) {
      const hits = applyWorkFilter(projectsSorted(), parseWorkFilter({ capability: s.id }));
      expect(Array.isArray(hits)).toBe(true);
      for (const p of hits) expect(projectHasCapability(p, s.id)).toBe(true);
      if (hits.length === PROJECTS.length) {
        // a filter matching the whole archive would be indistinguishable from
        // ALL. Photography is credited on 11 of 12, never all 12.
        throw new Error(`${s.id} matched every project`);
      }
    }
  });

  it("matches only on approved credited roles, never on guesswork", () => {
    const credited = new Set(
      PROJECTS.flatMap((p) => p.services.map((s) => s.en.trim().toLowerCase())),
    );
    // at least some aliases must correspond to roles that really appear
    expect(
      Object.keys(CAPABILITY_ROLE_ALIASES).filter((k) => credited.has(k)).length,
    ).toBeGreaterThan(0);
    // and every alias must resolve to a canonical capability
    for (const id of Object.values(CAPABILITY_ROLE_ALIASES)) expect(isCapabilityId(id)).toBe(true);
    for (const p of PROJECTS) {
      for (const id of capabilitiesOfProject(p)) expect(isCapabilityId(id)).toBe(true);
    }
  });

  it("credits a project only with capabilities its own role metadata names", () => {
    for (const p of PROJECTS) {
      const roles = p.services.map((s) => s.en.trim().toLowerCase());
      for (const id of capabilitiesOfProject(p)) {
        const supported = roles.some((r) => CAPABILITY_ROLE_ALIASES[r] === id);
        expect(supported, `${p.slug} claims ${id} with no credited role`).toBe(true);
      }
    }
  });

  it("returns capabilities in taxonomy order, not credit order", () => {
    const order = DAO_SERVICES.map((s) => s.id);
    for (const p of PROJECTS) {
      const got = capabilitiesOfProject(p);
      const sorted = [...got].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      expect(got).toEqual(sorted);
    }
  });
});

describe("the worked-example mark is a claim about real projects", () => {
  // It renders directly above a capability's Related Work link. Hardcoded, it
  // showed a tick over an empty archive for Scenography and Decoration and
  // suppressed itself for Costume Design, which has two credited projects.
  it("marks a capability exactly when it has credited work", () => {
    const all = projectsSorted();
    for (const s of DAO_SERVICES) {
      const hits = applyWorkFilter(all, parseWorkFilter({ capability: s.id }));
      expect(capabilityHasWork(all, s.id), s.id).toBe(hits.length > 0);
    }
  });

  it("never claims work for a capability with an empty archive", () => {
    const all = projectsSorted();
    for (const id of ["art-direction", "scenography", "decoration", "post-production"] as const) {
      expect(applyWorkFilter(all, parseWorkFilter({ capability: id }))).toHaveLength(0);
      expect(capabilityHasWork(all, id), `${id} must not claim a worked example`).toBe(false);
    }
  });

  it("does claim work for the capabilities that have it", () => {
    const all = projectsSorted();
    for (const id of [
      "creative-direction",
      "production-design",
      "costume-design",
      "film-video-production",
      "photography",
    ] as const) {
      expect(capabilityHasWork(all, id), `${id} has credited projects`).toBe(true);
    }
  });
});

describe("work filter state", () => {
  it("treats a bare /work as ALL", () => {
    expect(parseWorkFilter(undefined)).toEqual(ALL_FILTER);
    expect(parseWorkFilter({})).toEqual(ALL_FILTER);
    expect(workFilterHref(ALL_FILTER)).toBe("/work");
    expect(workFilterLabel(ALL_FILTER)).toBeNull();
  });

  it("ALL clears category, capability and status", () => {
    const href = workFilterHref(ALL_FILTER);
    expect(href).not.toContain("category=");
    expect(href).not.toContain("capability=");
    expect(href).not.toContain("status=");
    expect(applyWorkFilter(projectsSorted(), ALL_FILTER)).toHaveLength(PROJECTS.length);
  });

  it("still supports the four broad category filters", () => {
    for (const d of DAO_DISCIPLINES) {
      const f = parseWorkFilter({ category: d.id });
      expect(f).toEqual({ kind: "category", id: d.id });
      expect(workFilterHref(f)).toBe(`/work?category=${d.id}`);
      expect(Array.isArray(applyWorkFilter(projectsSorted(), f))).toBe(true);
    }
  });

  it("supports the in-development status filter", () => {
    const f = parseWorkFilter({ status: "in-development" });
    expect(f).toEqual(IN_DEVELOPMENT_FILTER);
    expect(workFilterHref(f)).toBe("/work?status=in-development");
    for (const p of applyWorkFilter(projectsSorted(), f)) {
      expect(p.status).toBe("in-development");
    }
  });

  it("gives every project an explicit status", () => {
    for (const p of PROJECTS) expect(["published", "in-development"]).toContain(p.status);
  });

  it("does not classify any existing project as in development", () => {
    // nothing in the approved content supports that claim
    expect(PROJECTS.filter((p) => p.status === "in-development")).toHaveLength(0);
  });

  it("ignores unknown or malformed filter values instead of throwing", () => {
    expect(parseWorkFilter({ capability: "not-a-capability" })).toEqual(ALL_FILTER);
    expect(parseWorkFilter({ category: "nope" })).toEqual(ALL_FILTER);
    expect(parseWorkFilter({ status: "published" })).toEqual(ALL_FILTER);
    expect(parseWorkFilter({ status: "banana" })).toEqual(ALL_FILTER);
  });

  it("resolves the most specific filter when several are present", () => {
    expect(parseWorkFilter({ capability: "photography", category: "film-video" })).toEqual({
      kind: "capability",
      id: "photography",
    });
    expect(parseWorkFilter({ status: "in-development", category: "film-video" })).toEqual(
      IN_DEVELOPMENT_FILTER,
    );
  });
});

describe("team content", () => {
  it("ships no fabricated people", () => {
    expect(TEAM).toHaveLength(0);
    expect(hasTeam()).toBe(false);
  });

  it("declares capability links against the canonical ids", () => {
    // guards a future data edit: any capability a member claims must be real
    for (const person of TEAM) {
      for (const id of person.capabilities) expect(isCapabilityId(id)).toBe(true);
    }
  });
});
