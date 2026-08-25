import type { TeamMember } from "./types";

/**
 * The people who run and produce the work.
 *
 * INTENTIONALLY EMPTY. Audited on this pass: the repository holds no approved
 * team content - no names, roles, biographies, portraits or contact details.
 * The only person-shaped data in the codebase is `credits[].name` on projects,
 * which is literally the string "Name Surname" carrying `provisional: true`.
 *
 * So the route, the layout, the schema and the translations are all in place and
 * the page renders a deliberate pre-content state. Adding real people is a data
 * edit here and requires no further code:
 *
 *   export const TEAM: TeamMember[] = [
 *     {
 *       id: "some-person",
 *       name: "Real Name",
 *       role: { en: "Executive Producer", ka: "..." },
 *       bio: { en: "...", ka: "..." },
 *       portrait: { src: "/media/team/some-person.jpg", alt: { en: "...", ka: "..." } },
 *       capabilities: ["production-design"],
 *       order: 1,
 *     },
 *   ];
 *
 * The page switches from the pre-content state to the roster automatically as
 * soon as this array is non-empty.
 */
export const TEAM: TeamMember[] = [];

/** Team in display order. */
export function teamSorted(): TeamMember[] {
  return [...TEAM].sort((a, b) => a.order - b.order);
}

/** Whether approved people data exists yet. */
export function hasTeam(): boolean {
  return TEAM.length > 0;
}
