import type { Messages } from "./messages/en";

/**
 * The client localization boundary.
 *
 * §P3 root cause: every client component took the whole `Messages` object. React
 * deduplicates the shared reference, so it was serialized exactly ONCE per RSC
 * payload rather than once per component - but once was already too much. The
 * dictionary is 21,030 B in EN and 44,870 B in KA, which was 50-80% of every
 * route's payload, and it entered through `DaoShell` -> `StudioIdent` +
 * `DaoChrome`, the two client components present on EVERY route. That is why
 * /privacy and /start-a-project - which render almost none of it - still paid
 * for all 497 strings, including the legacy `home.finalCta`, `brief.hints` and
 * `caseStudy.*` groups no page renders at all.
 *
 * The fix is a smaller data boundary, not a new framework. There are no
 * per-route dictionary files, no provider, no code generation and no second copy
 * of any string: `messages/en.ts` and `messages/ka.ts` remain the single source
 * of truth, server components still read the full dictionary freely (it never
 * crosses the wire), and only these named slices are handed to client
 * components.
 *
 * Every slice type is DERIVED from `Messages`, so the existing parity guarantee
 * carries through untouched: `Messages = typeof en` and `const ka: Messages`
 * means a key missing from Georgian still fails the build, and a slice cannot
 * reference a key that does not exist in both locales.
 *
 * Adding a string to a client component means widening its slice here - one
 * deliberate, reviewable edit - rather than silently shipping 497 strings.
 */

/* ---------------------------------------------------------------- global --- */

/**
 * The chrome is on every route, so this slice sets the floor for every payload.
 * Deliberately the smallest thing that keeps navigation working: the burger's
 * own labels plus the two switcher announcements and the nav landmark names.
 */
export type ChromeMessages = {
  nav: Messages["dao"]["nav"];
  menu: string;
  primary: string;
  switchToEnglish: string;
  switchToGeorgian: string;
};

export const chromeMessages = (m: Messages): ChromeMessages => ({
  nav: m.dao.nav,
  menu: m.nav.menu,
  primary: m.nav.primary,
  switchToEnglish: m.common.switchToEnglish,
  switchToGeorgian: m.common.switchToGeorgian,
});

/** The Studio Ident, also on every route. Four strings. */
export type IdentMessages = Messages["dao"]["ident"];
export const identMessages = (m: Messages): IdentMessages => m.dao.ident;

/* ------------------------------------------------------------------ home --- */

export type ReelMessages = Messages["dao"]["reel"];
export const reelMessages = (m: Messages): ReelMessages => m.dao.reel;

export type IntroMessages = Messages["dao"]["intro"];
export const introMessages = (m: Messages): IntroMessages => m.dao.intro;

export type SelectedWorkMessages = Messages["dao"]["work"];
export const selectedWorkMessages = (m: Messages): SelectedWorkMessages => m.dao.work;

/* The What We Make dossier is a SERVER component - five links, no state, every
   responsive decision a media query - so it needs no slice at all. The
   ServicesActMessages slice retired with the client act it fed. */

export type StudioLabMessages = Messages["dao"]["lab"];
export const studioLabMessages = (m: Messages): StudioLabMessages => m.dao.lab;

/** Contact carries the closing credits, so it needs the city and the nav label. */
export type ContactActMessages = {
  contact: Messages["dao"]["contact"];
  credits: Messages["dao"]["credits"];
  city: string;
  contactNav: string;
};
export const contactActMessages = (m: Messages): ContactActMessages => ({
  contact: m.dao.contact,
  credits: m.dao.credits,
  city: m.dao.ident.city,
  contactNav: m.dao.nav.contact,
});

/* ---------------------------------------------------------- route-scoped --- */

export type WorkArchiveMessages = Messages["daoRoutes"]["work"];
export const workArchiveMessages = (m: Messages): WorkArchiveMessages => m.daoRoutes.work;

export type TeamSheetMessages = Messages["daoRoutes"]["team"];
export const teamSheetMessages = (m: Messages): TeamSheetMessages => m.daoRoutes.team;

/** The Lab field notes render the shared "Content required" marker alongside. */
export type LabMessages = {
  lab: Messages["daoRoutes"]["lab"];
  contentRequired: string;
};
export const labMessages = (m: Messages): LabMessages => ({
  lab: m.daoRoutes.lab,
  contentRequired: m.daoRoutes.contentRequired,
});

/** The brief plus its confirmation sheet, which lives in a different namespace. */
export type BriefMessages = {
  brief: Messages["daoRoutes"]["brief"];
  success: Messages["brief"]["success"];
};
export const briefMessages = (m: Messages): BriefMessages => ({
  brief: m.daoRoutes.brief,
  success: m.brief.success,
});
