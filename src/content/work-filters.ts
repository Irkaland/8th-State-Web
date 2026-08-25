import type { LocalizedText, Project, ProjectStatus } from "./types";
import { type DaoDiscipline, disciplineOf, disciplineLabel, isDiscipline } from "./dao-work";
import {
  type CapabilityId,
  capabilityById,
  isCapabilityId,
  projectHasCapability,
} from "./dao-services";

/**
 * The Work archive's filter state, as one value.
 *
 * Four things are deliberately kept apart, because they answer different
 * questions and the brief's taxonomy contract depends on not conflating them:
 *
 *   category    one of four broad work DISCIPLINES (film-video, photography,
 *               production-spatial, studio-lab) - "what kind of work is this?"
 *   capability  one of nine canonical CAPABILITIES - "which service does this
 *               project demonstrate?" This is what Services' Related Work links
 *               use, because four broad categories cannot express Scenography or
 *               Post-Production.
 *   status      published / in-development - "is this finished?" A status is not
 *               a discipline, which is why it is ?status= and not a fifth
 *               category, even though the UI lists it fifth.
 *   group       the four taxonomy groups. Never a Work filter - it only
 *               organises capabilities on Homepage and /services.
 *
 * Exactly one filter is ever active. When more than one query parameter is
 * present the most specific wins - capability, then status, then category - so a
 * link can always be reasoned about from its URL.
 */
export type WorkFilter =
  | { kind: "all" }
  | { kind: "category"; id: DaoDiscipline }
  | { kind: "capability"; id: CapabilityId }
  | { kind: "status"; id: ProjectStatus };

export const ALL_FILTER: WorkFilter = { kind: "all" };

export type WorkSearchParams = {
  category?: string;
  capability?: string;
  status?: string;
};

/** Read the filter out of the query string. Unknown values fall back to ALL. */
export function parseWorkFilter(sp: WorkSearchParams | undefined): WorkFilter {
  if (!sp) return ALL_FILTER;
  if (sp.capability && isCapabilityId(sp.capability)) {
    return { kind: "capability", id: sp.capability };
  }
  // only in-development is addressable: ?status=published would just be ALL
  if (sp.status === "in-development") return { kind: "status", id: "in-development" };
  if (sp.category && isDiscipline(sp.category)) return { kind: "category", id: sp.category };
  return ALL_FILTER;
}

/** The canonical URL for a filter, locale-independent. */
export function workFilterHref(f: WorkFilter): string {
  switch (f.kind) {
    case "category":
      return `/work?category=${f.id}`;
    case "capability":
      return `/work?capability=${f.id}`;
    case "status":
      return `/work?status=${f.id}`;
    default:
      // ALL clears category, capability and status by carrying no query at all
      return "/work";
  }
}

export function applyWorkFilter(projects: Project[], f: WorkFilter): Project[] {
  switch (f.kind) {
    case "category":
      return projects.filter((p) => disciplineOf(p) === f.id);
    case "capability":
      return projects.filter((p) => projectHasCapability(p, f.id));
    case "status":
      return projects.filter((p) => p.status === f.id);
    default:
      return projects;
  }
}

/**
 * Does this capability have at least one explicitly credited project?
 *
 * The Services page marks a capability with "worked example", and that mark is a
 * claim about the portfolio, so it has to be read from the same data the Related
 * Work link filters on. While it was hardcoded the two disagreed: Scenography and
 * Decoration claimed a worked example with zero credited projects, and Costume
 * Design suppressed the mark while having two. Deriving it means the claim and the
 * filtered archive can never contradict each other, and it stays correct on its
 * own as projects are credited.
 */
export function capabilityHasWork(projects: Project[], id: CapabilityId): boolean {
  return projects.some((p) => projectHasCapability(p, id));
}

/** One credited project, offered as a capability's worked example. */
export type CapabilityPreview = {
  slug: string;
  title: string;
  cover: Project["cover"];
};

/**
 * A still to stand for a capability - taken ONLY from a project that capability
 * is actually credited on.
 *
 * The homepage used to pair each capability with a hand-picked file. Six of the
 * nine pairings did not hold: Art Direction showed a project credited only with
 * Photography, Post-Production showed a film still from a project it was never
 * credited on, and one file belonged to no project at all. That was tolerable
 * while the still was decorative (aria-hidden, empty alt, claiming nothing), but
 * §02 turns it into a route INTO the archive, and at that point it becomes a
 * claim - a photograph plus "related work" over an archive that answers with
 * nothing. So the still is read from the credit data instead.
 *
 * A capability with no credited projects returns null. It still routes to its own
 * filter and still lands on its own honest empty state; it just does not borrow
 * another project's photograph to look furnished.
 *
 * `spread` only decides WHICH credited project is shown when there are several,
 * so neighbouring rows do not all show the same cover. Every candidate is equally
 * true, and the choice is deterministic - the server and the client must agree.
 */
export function capabilityPreview(
  projects: Project[],
  id: CapabilityId,
  spread = 0,
): CapabilityPreview | null {
  const credited = projects.filter((p) => projectHasCapability(p, id));
  if (credited.length === 0) return null;
  const p = credited[Math.abs(spread) % credited.length];
  return { slug: p.slug, title: p.title, cover: p.cover };
}

/**
 * A human label for the active filter, used by the contextual chip so a visitor
 * arriving from a Related Work link can see why the archive is narrowed.
 */
export function workFilterLabel(f: WorkFilter): LocalizedText | null {
  switch (f.kind) {
    case "category":
      return disciplineLabel(f.id);
    case "capability":
      return capabilityById(f.id).name;
    case "status":
      return IN_DEVELOPMENT_LABEL;
    default:
      return null;
  }
}

/** Shown as the fifth entry in the Work filter index. */
export const IN_DEVELOPMENT_LABEL: LocalizedText = {
  en: "Projects in Development",
  ka: "პროექტები მუშავდება",
};

export const IN_DEVELOPMENT_FILTER: WorkFilter = { kind: "status", id: "in-development" };
