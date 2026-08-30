"use client";

import { useCallback, useEffect, useState } from "react";
import { MastheadBack } from "./MastheadBack";
import { safeSession } from "@/lib/session-lifecycle";
import { WK_CTX_KEY, originCard, parseWorkContext, workBackHref } from "@/lib/work-context";

/**
 * The project page's "<- WORK" control (FINAL UX §01, READ side).
 *
 * SSR renders the canonical archive href, which is the right answer for a
 * direct entry and the only one the server can know. After hydration, if this
 * tab holds a context stamped by the archive, the href is upgraded to the
 * filtered archive the reader actually came from.
 *
 * The upgrade is href-only and happens in an effect, so the server render and
 * the first client render agree - no hydration mismatch - and the control works
 * with JavaScript disabled, landing on the whole archive.
 *
 * THE CONTEXT IS NOT CONSUMED HERE. The archive consumes it on arrival, which
 * is where the originating card has to be positioned. What this control does is
 * mark HOW the reader is returning: only a click here arms the card anchor, so
 * browser Back - which never runs this handler - is left entirely to native
 * history restoration, exactly as §01 requires.
 */
export function WorkBackLink({
  work,
  label,
  slug,
}: {
  /** locale-correct archive path, e.g. "/work" or "/ka/work" */
  work: string;
  label: string;
  /** the project currently on screen - decides whether the card anchor still applies */
  slug: string;
}) {
  const [href, setHref] = useState(work);

  const read = useCallback(() => {
    const store = safeSession();
    if (!store) return null;
    try {
      return { store, ctx: parseWorkContext(store.getItem(WK_CTX_KEY)) };
    } catch {
      /* private mode - the canonical archive is still a correct destination */
      return null;
    }
  }, []);

  useEffect(() => {
    const found = read();
    if (!found?.ctx) return;
    // The filter is carried whenever a context exists, including after lateral
    // prev/next movement: the reader is still inside the same filtered
    // exploration even though the card they started from is behind them.
    //
    // sessionStorage is an external store with no change event, and it cannot
    // be read during render without producing a different tree on the client
    // than the server sent. Syncing it in on mount is exactly the "subscribe to
    // an external system" case the rule is written around - it runs once per
    // project page and only ever rewrites an href.
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- external store; see above */
    setHref(workBackHref(work, found.ctx));
    // `work` changes on a locale switch, `slug` on prev/next - both change what
    // the honest destination is.
  }, [read, work, slug]);

  /**
   * Arm the card anchor, but only when the stored slug IS the project on
   * screen. After prev/next the origin card is no longer where the reader is,
   * and scrolling them to a card they did not choose would be a fabricated
   * context - so the filter goes back and the anchor does not.
   */
  const arm = () => {
    const found = read();
    if (!found?.ctx) return;
    if (!originCard(slug, found.ctx)) return;
    try {
      found.store.setItem(WK_CTX_KEY, JSON.stringify({ ...found.ctx, anchor: true }));
    } catch {
      /* the archive simply loads without repositioning */
    }
  };

  return <MastheadBack href={href} label={label} ground="dark" onClick={arm} />;
}
