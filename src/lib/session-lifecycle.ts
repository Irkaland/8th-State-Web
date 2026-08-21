/**
 * Session lifecycle helpers shared by the Studio Ident, the Showreel and the
 * global chrome. Pure where possible so the policy is unit-testable.
 */

/** Set on <html> while the Studio Ident is covering the screen. */
export const IDENT_ATTR = "data-dao-ident";

/** Fired on `window` the moment the ident leaves the stage. */
export const IDENT_DONE_EVENT = "dao:ident-done";

/**
 * sessionStorage key holding the timestamp (ms) at which the page was last
 * hidden. sessionStorage rather than localStorage: the policy is per-tab, and
 * a second tab must not drag this one back to the intro.
 */
export const HIDDEN_AT_KEY = "dao:hidden-at";

/** sessionStorage flag: the burger sheet was open when the locale changed. */
export const NAV_OPEN_KEY = "dao:nav-open";

/**
 * How long the page must stay hidden before returning to it re-enters the
 * site from the Studio Ident (§15).
 *
 * 30 minutes. The reasoning, rather than a round number for its own sake:
 * the ident is a ~3.5s branded entrance that must never feel like a penalty
 * for switching apps, so the threshold has to sit far above real-world task
 * switching (answering a message, checking a map - seconds to a couple of
 * minutes) and above a phone's screen-lock idle. It also has to sit at or
 * below the point where the page is a stale artefact rather than a session:
 * mobile Safari and Chrome routinely discard or freeze backgrounded tabs
 * within tens of minutes, media buffers are dropped, and the reel would come
 * back paused anyway. 30 minutes is comfortably outside the first band and at
 * the start of the second, so a returning visitor gets a deliberate re-entry
 * rather than a half-dead page.
 */
export const RESTART_AFTER_MS = 30 * 60 * 1000;

/**
 * Should returning to a page that was hidden at `hiddenAt` re-enter from the
 * intro? Guards against a missing/garbage stamp and against clock skew
 * (a negative elapsed time is never a long absence).
 */
export function shouldRestartFromIntro(
  hiddenAt: number | null,
  now: number,
  threshold: number = RESTART_AFTER_MS,
): boolean {
  if (hiddenAt === null || !Number.isFinite(hiddenAt)) return false;
  const elapsed = now - hiddenAt;
  if (elapsed < 0) return false;
  return elapsed >= threshold;
}

/** Read the stored hidden timestamp, or null when absent/unusable. */
export function readHiddenAt(store: Pick<Storage, "getItem"> | null): number | null {
  if (!store) return null;
  try {
    const raw = store.getItem(HIDDEN_AT_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Safe sessionStorage accessor - private mode and SSR both return null. */
export function safeSession(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}
