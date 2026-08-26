import type { LocalizedText, TeamDepartment, TeamMember } from "./types";

/**
 * The departments, in the approved display order.
 *
 * All seven are declared so the architecture is ready, but the page renders a
 * section only when that department actually has members - an empty heading is
 * never drawn.
 */
export const TEAM_DEPARTMENTS: { id: TeamDepartment; name: LocalizedText }[] = [
  { id: "production", name: { en: "Production", ka: "პროდაქშენი" } },
  { id: "direction", name: { en: "Direction", ka: "რეჟისურა" } },
  { id: "creative", name: { en: "Creative", ka: "კრეატივი" } },
  { id: "photography", name: { en: "Photography", ka: "ფოტოგრაფია" } },
  { id: "art-department", name: { en: "Art Department", ka: "სამხატვრო განყოფილება" } },
  { id: "post-production", name: { en: "Post-Production", ka: "პოსტ-პროდაქშენი" } },
  { id: "studio-lab", name: { en: "Studio Lab", ka: "სტუდიო ლაბი" } },
];

/**
 * The roster.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT
 * ---------------------------------
 * No approved people content exists in this repository. Audited again on this
 * pass: there are still no real names, roles, biographies, portraits, statements,
 * clients, credits, awards, education or contact details anywhere in the codebase.
 * The only person-shaped data is `credits[].name` on projects, which is literally
 * the string "Name Surname" carrying provisional: true.
 *
 * The approved design asks for the contact sheet to be built rather than left as
 * a pre-content notice, so the entries below are PROVISIONAL SLOTS: seats in two
 * departments, each carrying `provisional: true` and NO name. The UI renders them
 * as an explicit marked blank - "[ NAME PENDING ]" - so a visitor cannot read one
 * as a person. The page also states, above the roster, that the roster itself is
 * unconfirmed, so the number of slots is not readable as a headcount claim.
 *
 * Every optional field is genuinely absent rather than filled with sample copy,
 * which is what makes the conditional profile sheet observable: the sheet shows
 * exactly the blocks that have content, and for a provisional slot that is very
 * few. In particular `selectedWork` is empty on every slot - a project is never
 * attached to a person without a confirmed credit.
 *
 * Filling this in is a data edit and needs no code change:
 *
 *   {
 *     id: "some-person",
 *     slug: "some-person",
 *     name: "Real Name",
 *     provisional: false,
 *     department: "production",
 *     role: { en: "Executive Producer", ka: "..." },
 *     shortStatement: { en: "...", ka: "..." },
 *     selectedWork: [{ slug: "aom-summer-collection" }],
 *     order: 1,
 *   }
 *
 * A slot flips from marked blank to a full profile the moment `name` is set and
 * `provisional` is false.
 */
export const TEAM: TeamMember[] = [
  {
    id: "production-01",
    slug: "production-01",
    provisional: true,
    department: "production",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 1,
    featured: false,
  },
  {
    id: "production-02",
    slug: "production-02",
    provisional: true,
    department: "production",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 2,
    featured: false,
  },
  {
    id: "production-03",
    slug: "production-03",
    provisional: true,
    department: "production",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 3,
    featured: false,
  },
  {
    id: "direction-01",
    slug: "direction-01",
    provisional: true,
    department: "direction",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 4,
    featured: false,
  },
  {
    id: "direction-02",
    slug: "direction-02",
    provisional: true,
    department: "direction",
    secondaryRoles: [],
    expertise: [],
    experience: [],
    selectedWork: [],
    clients: [],
    awards: [],
    credits: [],
    education: [],
    languages: [],
    order: 5,
    featured: false,
  },
];

/** Team in display order. */
export function teamSorted(): TeamMember[] {
  return [...TEAM].sort((a, b) => a.order - b.order);
}

/** Whether any people data exists yet, provisional or not. */
export function hasTeam(): boolean {
  return TEAM.length > 0;
}

/** Whether any CONFIRMED person exists - drives the provisional roster notice. */
export function hasConfirmedTeam(): boolean {
  return TEAM.some((p) => !p.provisional && !!p.name);
}

/**
 * The roster grouped by department, in the approved order, with empty
 * departments dropped entirely - a heading is never drawn without members.
 */
export function teamByDepartment(): {
  id: TeamDepartment;
  name: LocalizedText;
  people: TeamMember[];
}[] {
  const sorted = teamSorted();
  return TEAM_DEPARTMENTS.map((d) => ({
    ...d,
    people: sorted.filter((p) => p.department === d.id),
  })).filter((d) => d.people.length > 0);
}

/** Flat roster in the order the sections render it - drives prev/next. */
export function teamInSectionOrder(): TeamMember[] {
  return teamByDepartment().flatMap((d) => d.people);
}

/** A person by their URL slug. */
export function teamMemberBySlug(slug: string): TeamMember | undefined {
  return TEAM.find((p) => p.slug === slug);
}
