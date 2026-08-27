/**
 * Which elements can ACTUALLY take focus right now.
 *
 * §P0: the burger sheet's focus trap used to collect
 * `a[href], button:not([disabled])` and filter on `el.offsetParent !== null`.
 * That filter is not a visibility test and, critically, says nothing about
 * `inert`: an element inside an `inert` container still reports a non-null
 * `offsetParent`, so the five collapsed Work category links survived the filter
 * and became trap candidates.
 *
 * Because the trap calls `preventDefault()` on Tab and then drives focus itself,
 * and because `.focus()` on an inert element is a silent no-op, the result was
 * that Tab was swallowed and focus never moved off the WORK link - the site's
 * only global navigation was keyboard-inoperable in its default state on every
 * route. Shift+Tab happened to work, because the element before WORK is the
 * category toggle, which is not inert.
 *
 * The predicate below asks the real question instead of a proxy for it, so the
 * same bug cannot come back through a different collapsed region. It is
 * deliberately a shared helper rather than a WORK-shaped exception: any future
 * `inert`, `hidden`, `disabled` or zero-box control is excluded by
 * construction.
 */

/** Selector for things that are focusable in principle, before state is considered. */
const CANDIDATE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[tabindex]",
].join(",");

/**
 * Is this element inside an `inert` subtree (or inert itself)?
 *
 * Checked via the attribute rather than the `inert` IDL property: React renders
 * `inert` as an attribute, `closest()` walks shadow-less ancestors exactly the
 * way inertness inherits, and the attribute form works on engines that have not
 * yet reflected the property. An empty `inert=""` is still inert, so presence -
 * not value - is what matters.
 */
function isInert(el: Element): boolean {
  return el.closest("[inert]") !== null;
}

/** Explicitly or implicitly disabled, including the ARIA form. */
function isDisabled(el: HTMLElement): boolean {
  if ((el as HTMLElement & { disabled?: boolean }).disabled === true) return true;
  if (el.getAttribute("aria-disabled") === "true") return true;
  // a fieldset disables its descendants without setting their own attribute
  return el.closest("fieldset[disabled]") !== null;
}

/**
 * Does the element render at all?
 *
 * Deliberately an ancestor walk for `display` rather than a box measurement.
 * `getClientRects().length === 0` looks like the obvious test and is the wrong
 * one twice over: it is stricter than browsers actually are - a zero-width but
 * displayed control IS focusable - and it cannot be exercised under jsdom, which
 * performs no layout and reports every element as boxless. A predicate this
 * load-bearing has to be testable.
 *
 * `display: none` does not inherit into a child's computed style, so the chain
 * has to be walked. `visibility` and `content-visibility` DO resolve through
 * inheritance, so reading them off the element itself is sufficient.
 *
 * `opacity: 0` is deliberately NOT treated as unfocusable: the chrome fades its
 * controls to zero opacity when idle while keeping them operable for keyboard
 * users, and excluding them would empty the trap exactly when a keyboard visitor
 * needs it most.
 */
function isRendered(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.visibility === "collapse") return false;
  if (cs.contentVisibility === "hidden") return false;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).display === "none") return false;
  }
  return true;
}

/** Removed from the tab order by the author. */
function isNegativeTabIndex(el: HTMLElement): boolean {
  const attr = el.getAttribute("tabindex");
  if (attr === null) return false;
  const n = Number.parseInt(attr, 10);
  return Number.isFinite(n) && n < 0;
}

/**
 * Can `el` take focus at this moment?
 *
 * Exported so tests can assert the predicate directly rather than only through
 * the behaviour it produces.
 */
export function isFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (isNegativeTabIndex(el)) return false;
  if (isDisabled(el)) return false;
  if (isInert(el)) return false;
  return isRendered(el);
}

/**
 * Every focusable descendant of `root`, in DOM order.
 *
 * DOM order is the tab order the trap must reproduce; nothing here reorders or
 * de-duplicates, so a caller can concatenate several roots and keep the
 * sequence it intends.
 */
export function focusableWithin(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)).filter(isFocusable);
}

export { CANDIDATE_SELECTOR };
