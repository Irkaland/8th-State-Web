"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { applyRouteFocus, takeFocusIntent } from "@/lib/route-focus";

/**
 * Route-change focus (FINAL UX §10) - the wiring half.
 *
 * Mounted once in the shell. Most of what it does is decline to act:
 *
 *   - the FIRST render is skipped. A hard load already starts focus at the top
 *     of the document; stealing it would break the Studio Ident's keyboard
 *     handling and the "Tab 1 = skip link" contract.
 *
 *   - a route change caused by browser Back/Forward is skipped. The browser
 *     restores focus and scroll itself on a history traversal and §10 is
 *     explicit that we do not intervene. The flag is set synchronously by the
 *     popstate event and cleared after the render it belongs to.
 *
 *   - a query-only change (the Work filter index) is not a route change here.
 *     Focus stays on the filter control the reader just used, which is where a
 *     keyboard reader wants to be to try the next one; the router still resets
 *     scroll. This is why the effect keys on the PATHNAME alone and not on
 *     useSearchParams - which would additionally force every statically
 *     rendered route through a Suspense bail-out for no benefit.
 *
 * Everything else consults the intent the navigating control declared:
 * "heading" for project prev/next, "none" for a locale switch, "main"
 * otherwise.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
      // cleared on the next task, so it only covers the render this pop causes
      window.setTimeout(() => {
        fromHistory.current = false;
      }, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      // native restoration owns this one - and any declared intent is now
      // stale, so it is dropped rather than left to fire on a later navigation
      takeFocusIntent();
      return;
    }
    applyRouteFocus(document, takeFocusIntent());
  }, [pathname]);

  return null;
}
