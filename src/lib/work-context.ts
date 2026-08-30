/**
 * WORK <-> PROJECT return context (FINAL UX §01).
 *
 * There are two return paths off a project page and they are deliberately NOT
 * the same thing:
 *
 *   Browser Back    native history. It restores the URL (and therefore the
 *                   filter) and the scroll position on its own. Nothing in this
 *                   file touches it - no scrollTo on popstate, no replaceState
 *                   on filter changes.
 *
 *   "<- WORK"       the site's own contextual control. It carries context
 *                   through ONE sessionStorage key with exactly two fields.
 *
 * WHY SO LITTLE IS STORED
 * -----------------------
 * `search` is the archive's whole filter state, and it is locale-free, so it
 * survives a mid-journey EN/KA switch untouched. `slug` says which card the
 * reader left from, which is enough to bring that card back into view.
 *
 * `scrollY` is deliberately NOT stored. A pixel offset is only meaningful for
 * the exact viewport, font metrics, image loading state and filter result the
 * reader happened to have; restoring it after a rotate, a locale switch or a
 * newly published project lands somewhere arbitrary. The card anchor answers
 * the same question ("where was I?") in terms that stay true.
 *
 * LIFETIME is the tab session. The key is CONSUMED on read: a return journey
 * uses it once and the next arrival at /work is a fresh, contextless one.
 */

export const WK_CTX_KEY = "wk-ctx";

export type WorkContext = {
  /** the archive's query string at the moment the project was opened, e.g. "?category=photography" */
  search: string;
  /** the slug of the card that was clicked */
  slug: string;
};

/** Narrow unknown JSON to a WorkContext, or null. Never throws. */
export function parseWorkContext(raw: string | null): WorkContext | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const { search, slug } = v as Record<string, unknown>;
    if (typeof search !== "string" || typeof slug !== "string" || slug === "") return null;
    // a stored search must look like a query string or be empty - anything else
    // is not ours and is not going to be pasted into an href
    if (search !== "" && !search.startsWith("?")) return null;
    return { search, slug };
  } catch {
    return null;
  }
}

/**
 * The href the project's "<- WORK" control should point at.
 *
 * `work` is the locale-correct archive path ("/work" or "/ka/work"). The filter
 * is carried whenever a context exists at all - including after prev/next
 * traversal, where the reader is still inside the same filtered exploration.
 * The originating-card anchor is a separate, stricter question (see
 * `originCard`): it is only honest when the context names the project the
 * reader is actually looking at.
 */
export function workBackHref(work: string, ctx: WorkContext | null): string {
  if (!ctx || ctx.search === "") return work;
  return `${work}${ctx.search}`;
}

/**
 * The card /work should bring back into view, or null.
 *
 * Only when the stored slug IS the project being left. After lateral prev/next
 * movement the reader's origin card is no longer the project on screen, and
 * pretending otherwise would scroll them to a card they never chose - so the
 * filter is kept and the anchor is dropped.
 */
export function originCard(currentSlug: string, ctx: WorkContext | null): string | null {
  return ctx && ctx.slug === currentSlug ? ctx.slug : null;
}
