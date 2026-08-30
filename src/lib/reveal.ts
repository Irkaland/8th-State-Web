/**
 * The site's ONE reveal runtime (Text Motion V3, §18/§23/§42).
 *
 * Every scroll entrance on every route goes through the single observer in
 * this module. Before this pass there was one IntersectionObserver per InView
 * instance - dozens per page - plus a separate observer and MutationObserver
 * inside the Team sheet. They all asked the same question, at slightly
 * different thresholds, and answered it slightly differently.
 *
 * WHAT IT GUARANTEES
 * ------------------
 *  - REVEAL ONCE. An element is unobserved the moment it lands, so scrolling
 *    back up, resizing, or rotating never replays anything.
 *  - NO SCROLL HANDLER. Nothing here listens to scroll; the browser tells us.
 *  - NO MEASUREMENT. No text is measured, split, cloned or re-measured. The
 *    responsive behaviour is entirely CSS media queries.
 *  - FAST SCROLL DOES NOT QUEUE. A section first seen already deep in the
 *    viewport finishes in 180ms with no stagger, so a fast scroll never leaves
 *    a backlog of animations running behind the reader.
 *  - RETURN IS NOT ARRIVAL. After a history move, or a contextual return that
 *    repositions the page, entrances resolve instantly for a moment: coming
 *    back to where you were should feel like return, not like a fresh
 *    theatrical page entrance (§26).
 *
 * THRESHOLDS are the approved ones: ~15% on desktop, ~10% at <=768 - but they
 * are measured against the VIEWPORT, not against the observed element. That
 * distinction matters for exactly the case the approved page map creates: a
 * section can be two or three viewports tall, and an element ratio of 15% then
 * means several hundred pixels of it must be on screen before anything inside
 * it appears. Its own masthead - the first line the reader meets - would sit
 * invisible for most of a screen of scrolling, which is the failure §21 names.
 * Measuring the visible SLICE against the viewport gives an identical result
 * for ordinary blocks and the right one for tall ones.
 */

/** Set on <html> by the pre-paint script when entrances are allowed to run. */
export const MOTION_ATTR = "data-dao-motion";

/** Ratio at or above which a first sighting counts as "already scrolled past". */
const DEEP = 0.6;

/**
 * Sampling points for the observer.
 *
 * A granular list rather than the two decision points, because the decision is
 * made against the viewport: a section three screens tall has to be able to
 * report progress while its own ratio is still in single figures, or it would
 * be told about its arrival only once far more of it than we asked for is on
 * screen. Ten thresholds is a negligible cost and removes the whole class of
 * "the top of a long section appears late" defect.
 */
const STEPS = [0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.45, DEEP, 0.8];

/**
 * How long after the runtime starts a deep first sighting is still treated as a
 * normal arrival rather than a fast scroll. Everything in the first viewport is
 * observed within a frame or two of mount and IS deeply visible - without this
 * the whole opening composition of every page would snap instead of playing.
 */
const SETTLE_MS = 400;

/** Entrances resolve instantly while `performance.now()` is below this. */
let quietUntil = 0;
let startedAt = 0;
let observer: IntersectionObserver | null = null;

/**
 * Resolve the next entrances instantly instead of animating them.
 *
 * Called for a history traversal (below) and by any control that returns the
 * reader to a position they already had. The window is short and absolute
 * rather than a counter, so an unmatched call can never leave the site
 * permanently un-animated.
 */
export function quietEntrance(ms = 700): void {
  quietUntil = (typeof performance !== "undefined" ? performance.now() : 0) + ms;
}

function ensureObserver(): IntersectionObserver | null {
  if (observer) return observer;
  if (typeof IntersectionObserver === "undefined") return null;
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  // the approved reveal point, as a fraction of the VIEWPORT
  const reveal = mobile ? 0.1 : 0.15;
  startedAt = performance.now();
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        // enough of it is on screen: the approved fraction of the viewport, or
        // the whole element when it is shorter than that
        const need = Math.min(entry.boundingClientRect.height, window.innerHeight * reveal);
        if (entry.intersectionRect.height < need) continue;
        const now = performance.now();
        if (now < quietUntil) {
          el.classList.add("is-quiet");
        } else if (entry.intersectionRatio >= DEEP && now - startedAt > SETTLE_MS) {
          el.classList.add("is-fast");
        }
        el.classList.add("is-in");
        observer?.unobserve(el);
      }
    },
    { threshold: STEPS },
  );
  // A history traversal is a return, not an arrival. Registered with the
  // observer rather than at module scope so it exists only in a document that
  // actually reveals something.
  window.addEventListener("popstate", () => quietEntrance());
  return observer;
}

/**
 * Watch one element. Returns a cleanup that stops watching it.
 *
 * An element that has already been revealed is never re-registered, and if the
 * platform has no IntersectionObserver at all the element is revealed
 * immediately - a browser without it must not be a browser without content.
 */
export function observeReveal(el: HTMLElement): () => void {
  if (el.classList.contains("is-in")) return () => {};
  const io = ensureObserver();
  if (!io) {
    el.classList.add("is-in");
    return () => {};
  }
  io.observe(el);
  return () => io.unobserve(el);
}
