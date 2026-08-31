"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyRouteFocus,
  cameFromHistory,
  clearFocusIntent,
  isFirstPaint,
  takeFocusIntent,
  watchHistoryNavigation,
} from "@/lib/route-focus";

/**
 * Route-change focus (FINAL UX §10) - the wiring.
 *
 * Mounted once in the shell. Most of what it does is decline to act:
 *
 *   - the document's FIRST paint is skipped. A hard load already starts focus
 *     at the top; stealing it would break the Studio Ident's keyboard handling
 *     and the "Tab 1 = skip link" contract.
 *
 *   - a route change caused by browser Back/Forward is skipped. The browser
 *     restores focus and scroll itself on a history traversal and §10 is
 *     explicit that we do not intervene.
 *
 *   - a query-only change (the Work filter index) is not a route change here.
 *     Focus stays on the filter control the reader just used, which is where a
 *     keyboard reader wants to be to try the next one; the router still resets
 *     scroll. This is why the effect keys on the PATHNAME alone and not on
 *     useSearchParams - which would additionally force every statically
 *     rendered route through a Suspense bail-out for no benefit.
 *
 * Both "have we painted before?" and "did a popstate just happen?" live in the
 * module, not in a ref, because the App Router REMOUNTS this component on
 * navigation - a param-only move from /work/a to /work/b builds a new cache
 * node for the segment. Held in refs, the first-render guard suppressed every
 * route change and the popstate flag was destroyed by the navigation it
 * described. See lib/route-focus.ts.
 *
 * Everything that survives those three refusals consults the intent the
 * navigating control declared: "heading" for project prev/next, "none" for a
 * locale switch, "main" otherwise.
 */
export function RouteFocus() {
  const pathname = usePathname();

  useEffect(() => {
    watchHistoryNavigation();
  }, []);

  useEffect(() => {
    if (isFirstPaint()) return;
    if (cameFromHistory()) {
      // native restoration owns this one - and any declared intent is now
      // stale, so it is dropped rather than left to fire on a later navigation
      clearFocusIntent();
      return;
    }
    applyRouteFocus(document, takeFocusIntent());
  }, [pathname]);

  return null;
}
