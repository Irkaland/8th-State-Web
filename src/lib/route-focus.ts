/**
 * Route-change focus policy (FINAL UX §10) - the shared, testable half.
 *
 * There is deliberately NO blanket "focus the H1 after every navigation"
 * handler. A blanket rule is wrong in three of the six cases the site actually
 * has, and the two worst are the ones that matter most: browser Back/Forward,
 * where the browser has its own correct restoration to perform, and a locale
 * switch, where the reader has not moved at all and must not be thrown to the
 * top of the document.
 *
 * The intent for the NEXT navigation is recorded by the control that starts it
 * (a module-scope value, one document, one tab), and consumed once by the shell
 * when the route actually changes. Anything that does not declare an intent
 * gets the default.
 */

export type FocusIntent =
  /** ordinary internal navigation - focus <main> */
  | "main"
  /** project prev/next - focus the new project's H1 */
  | "heading"
  /** the reader has not conceptually moved (locale switch) - move nothing */
  | "none";

let pending: FocusIntent | null = null;

/** Declare what the navigation this control is about to start should focus. */
export function setFocusIntent(intent: FocusIntent): void {
  pending = intent;
}

/** Read and clear the declared intent, defaulting to ordinary navigation. */
export function takeFocusIntent(): FocusIntent {
  const v = pending ?? "main";
  pending = null;
  return v;
}

/**
 * Move focus for a completed route change.
 *
 * `preventScroll` throughout: the router has already positioned the document
 * (top for a fresh route, the restored offset for a history move) and a
 * scrolling .focus() would undo it.
 */
export function applyRouteFocus(doc: Document, intent: FocusIntent): HTMLElement | null {
  if (intent === "none") return null;
  const main = doc.getElementById("main");
  const target = intent === "heading" ? (main?.querySelector<HTMLElement>("h1") ?? main) : main;
  if (!target) return null;
  // <main> already carries tabindex="-1" from the shell; a heading does not,
  // and giving it one permanently would put it in nobody's way but is still
  // state we do not need to keep.
  const had = target.hasAttribute("tabindex");
  if (!had) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  if (!had) target.removeAttribute("tabindex");
  return target;
}
