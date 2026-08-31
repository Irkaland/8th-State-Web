/**
 * Route-change focus policy (FINAL UX §10).
 *
 * There is deliberately NO blanket "focus the H1 after every navigation"
 * handler. A blanket rule is wrong in three of the six cases the site actually
 * has, and the two worst are the ones that matter most: browser Back/Forward,
 * where the browser has its own correct restoration to perform, and a locale
 * switch, where the reader has not moved at all and must not be thrown to the
 * top of the document.
 *
 * EVERYTHING HERE IS MODULE STATE, NOT COMPONENT STATE.
 *
 * That is not a stylistic choice. The App Router replaces the page subtree on
 * navigation, and a param-only move - /work/a to /work/b - gives the same
 * component a new cache node, so the shell REMOUNTS. Anything remembered in a
 * ref ("have I rendered before?", "did a popstate just happen?") is therefore
 * reset by the very navigation it exists to describe: the first-render guard
 * would suppress every route change, and the popstate flag would be gone before
 * the component that reads it exists. Module scope lives as long as the
 * document, which is the correct lifetime for both questions.
 */

export type FocusIntent =
  /** ordinary internal navigation - focus <main> */
  | "main"
  /** project prev/next - focus the new project's H1 */
  | "heading"
  /** the reader has not conceptually moved (locale switch) - move nothing */
  | "none";

let pending: FocusIntent | null = null;
let declaredAt = -Infinity;

/**
 * How long a declared intent stays valid.
 *
 * The intent EXPIRES rather than being consumed by the first reader, and that
 * is deliberate. During a navigation the outgoing shell and the incoming one
 * can both observe the new pathname, so a consume-on-read intent is taken by
 * whichever effect happens to run first and the other - usually the one that
 * belongs to the page now on screen - is left with the default. That is exactly
 * how project prev/next ended up focusing <main> instead of the new title.
 *
 * Applying the same intent twice is harmless: it focuses the same element. The
 * window is short enough that it cannot leak into a later, unrelated
 * navigation, and both outcomes are inside <main> in any case.
 */
const INTENT_TTL_MS = 1500;

/** Declare what the navigation this control is about to start should focus. */
export function setFocusIntent(intent: FocusIntent): void {
  pending = intent;
  declaredAt = typeof performance !== "undefined" ? performance.now() : 0;
}

/** The declared intent while it is still current, otherwise the default. */
export function takeFocusIntent(): FocusIntent {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (pending === null || now - declaredAt > INTENT_TTL_MS) {
    pending = null;
    return "main";
  }
  return pending;
}

/** Drop a declared intent that a history traversal has made stale. */
export function clearFocusIntent(): void {
  pending = null;
}

/* ------------------------------------------------------- history ------- */

let lastPopAt = -Infinity;
let popListening = false;

/**
 * Start watching for history traversals.
 *
 * Installed once per document, from the shell. A popstate is recorded as a
 * timestamp rather than a flag because the render it belongs to happens on a
 * later task: a flag would have to be cleared by something, and whatever
 * cleared it would race the render it was meant to cover.
 */
export function watchHistoryNavigation(): void {
  if (popListening || typeof window === "undefined") return;
  popListening = true;
  window.addEventListener("popstate", () => {
    lastPopAt = performance.now();
  });
}

/**
 * Did the route change we are looking at come from Back/Forward?
 *
 * The window is generous on purpose. Being wrong in this direction costs
 * nothing - the browser's own restoration simply stands - while being wrong the
 * other way overrides it, which §10 forbids.
 */
export function cameFromHistory(withinMs = 1200): boolean {
  return performance.now() - lastPopAt < withinMs;
}

/* ---------------------------------------------------- first paint ------ */

let booted = false;

/**
 * True exactly once per document, for the route it was loaded on.
 *
 * A hard load already starts focus at the top of the document, and stealing it
 * would break the Studio Ident's keyboard handling and the "Tab 1 = skip link"
 * contract. Every LATER route change is a real navigation, including one that
 * remounts the shell.
 */
export function isFirstPaint(): boolean {
  if (booted) return false;
  booted = true;
  return true;
}

/* --------------------------------------------------------- apply ------- */

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
  if (!had) {
    // Removing the attribute while the element still HAS focus blurs it - the
    // element stops being focusable, so the browser drops the focus to <body>,
    // which is how "focus the new title" ended up focusing nothing at all. The
    // attribute is cleaned up when focus leaves instead, so the document never
    // keeps a non-interactive heading in anyone's tab order.
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  return target;
}
