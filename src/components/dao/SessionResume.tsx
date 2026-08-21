"use client";

import { useEffect } from "react";
import {
  HIDDEN_AT_KEY,
  RESTART_AFTER_MS,
  readHiddenAt,
  safeSession,
  shouldRestartFromIntro,
} from "@/lib/session-lifecycle";

/**
 * §15: long-background resume.
 *
 * A short app switch resumes the page exactly where it was. A LONG absence
 * re-enters the site from the Studio Ident, because by then the page is a
 * stale artefact rather than a live session - mobile browsers freeze or
 * discard backgrounded tabs, media buffers are dropped, and the reel would
 * come back paused anyway.
 *
 * Mechanics, deliberately conservative:
 *   - on `hidden` (or pagehide) stamp the time into sessionStorage
 *   - on `visible` read it back; only if the gap crosses the threshold do we
 *     re-enter, and the stamp is cleared FIRST so a failed or slow navigation
 *     can never produce a second reload. That is what keeps this from looping
 *   - re-entry is a real document load of the locale home, which is exactly
 *     what replays the ident (its module-scope flag resets per page load)
 *   - sessionStorage, not localStorage: the policy is per-tab, so a second tab
 *     cannot drag this one back to the intro
 */
export function SessionResume({ home }: { home: string }) {
  useEffect(() => {
    const store = safeSession();
    if (!store) return;

    const stamp = () => {
      try {
        store.setItem(HIDDEN_AT_KEY, String(Date.now()));
      } catch {
        /* private mode - the feature simply does not arm */
      }
    };

    const check = () => {
      const hiddenAt = readHiddenAt(store);
      if (!shouldRestartFromIntro(hiddenAt, Date.now(), RESTART_AFTER_MS)) return;
      // clear before navigating: if the reload is slow, cancelled or fails,
      // the next visibility change must not fire a second one
      try {
        store.removeItem(HIDDEN_AT_KEY);
      } catch {
        /* ignore */
      }
      // a real document load - the ident plays, the session starts over
      window.location.assign(home);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stamp();
      else check();
    };

    // pagehide covers the iOS case where visibilitychange is not delivered
    // before the tab is frozen
    window.addEventListener("pagehide", stamp);
    document.addEventListener("visibilitychange", onVisibility);
    // a tab restored from the back/forward cache never fires `visible`
    const onResume = () => check();
    window.addEventListener("pageshow", onResume);

    // returning to a tab that was already hidden when this mounted
    if (document.visibilityState === "visible") check();

    return () => {
      window.removeEventListener("pagehide", stamp);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onResume);
    };
  }, [home]);

  return null;
}
