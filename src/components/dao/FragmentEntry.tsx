"use client";

import { useEffect } from "react";
import { IDENT_ATTR, IDENT_DONE_EVENT } from "@/lib/session-lifecycle";

/**
 * Direct fragment entry - a shared `#anchor` URL lands where it says.
 *
 * THE PROBLEM
 * -----------
 * The Studio Ident opens every real document load, and to do that honestly it
 * takes the page to the top itself:
 *
 *     history.scrollRestoration = "manual";
 *     window.scrollTo({ top: 0, behavior: "instant" });
 *
 * That is deliberate and correct - a hard load must begin at the ident, never
 * at a restored offset - but it also lands on top of the browser's OWN
 * fragment scroll, which has already happened by then. So `/services#photography`
 * opened from a shared link, a bookmark or a search result arrived at the top of
 * the catalogue instead of at Photography. In-app navigation was never affected:
 * the router does its own fragment handling and no ident plays.
 *
 * THE SIGNAL
 * ----------
 * The ident already publishes exactly the lifecycle this needs, for exactly
 * this class of problem - the Showreel uses it to know when it may start
 * playing rather than guessing at a delay. `IDENT_ATTR` says the sheet is on
 * stage; `IDENT_DONE_EVENT` fires the moment it leaves. So the fragment is
 * re-applied on a real signal, not on a timer.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 *  - It runs ONCE per document load. A module flag, like the ident's own. Every
 *    later navigation - including Back and Forward - is left entirely to the
 *    browser and the router, which is what §04/D asks for. Nothing here reads
 *    or writes history, and `scrollRestoration` is not touched.
 *  - It stops the moment the reader scrolls. The listeners are armed only once
 *    placement has begun, so the wheel or tap that SKIPS the ident does not
 *    cancel the landing the reader asked for by opening that URL.
 *  - It stops as soon as the target is in place, and it is bounded in any case.
 *    It does not hold a scroll position open.
 *  - It never runs without a hash, and never for a hash that names nothing.
 */

/** One document load, one restoration - mirrors the ident's own flag. */
let restoredThisLoad = false;

/** How long the placement may keep correcting itself, at most. */
const CEILING_MS = 3000;
/** How often it re-checks while the page is still settling. */
const TICK_MS = 60;
/** Close enough to its scroll-margin offset to call it placed. */
const TOLERANCE_PX = 4;
/** Consecutive checks in place before it lets go. */
const STABLE_TICKS = 3;

export function FragmentEntry() {
  useEffect(() => {
    if (restoredThisLoad) return;
    restoredThisLoad = true;

    // The hash as the reader typed it. decodeURIComponent because an id may be
    // percent-encoded in a shared URL; getElementById takes the literal id, so
    // there is no selector to inject into.
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      id = window.location.hash.slice(1);
    }
    if (!id) return;
    // nothing to do if this page does not carry that anchor at all
    if (!document.getElementById(id)) return;

    let cancelled = false;
    let armed = false;
    let stable = 0;
    let timer = 0;
    let startedAt = 0;

    const stop = () => {
      cancelled = true;
    };
    /**
     * The reader taking over cancels the landing - but only once the landing
     * has begun. The gesture that skips the ident must not count: it is "get on
     * with it", not "stay at the top of a page I asked to enter part-way down".
     */
    const gestures = ["wheel", "touchstart", "keydown"] as const;
    const arm = () => {
      if (armed) return;
      armed = true;
      for (const g of gestures) window.addEventListener(g, stop, { passive: true });
    };
    const disarm = () => {
      for (const g of gestures) window.removeEventListener(g, stop);
    };

    const step = () => {
      if (cancelled || Date.now() - startedAt > CEILING_MS) return;
      const el = document.getElementById(id);
      if (el) {
        // block:"start" is what honours scroll-margin-top, which is where the
        // fixed chrome offset already lives - this adds no offset of its own.
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const off = el.getBoundingClientRect().top - margin;
        if (Math.abs(off) <= TOLERANCE_PX) {
          // in place - a few checks running and it lets go for good
          if (++stable >= STABLE_TICKS) return;
        } else {
          stable = 0;
          const before = Math.round(window.scrollY);
          el.scrollIntoView({ block: "start", behavior: "instant" });
          // the document cannot scroll any further: this is as close as the
          // anchor gets, and continuing would just spin against the clamp
          if (Math.round(window.scrollY) === before) return;
        }
      }
      timer = window.setTimeout(step, TICK_MS);
    };

    /**
     * Re-checking rather than placing once: web fonts swap and images resolve
     * their intrinsic size after the ident has gone, and either can move the
     * target several hundred pixels. This is a property of the page settling,
     * not a guess at how long that takes, so it behaves the same on a fast
     * machine and a loaded one.
     */
    const begin = () => {
      if (cancelled) return;
      startedAt = Date.now();
      arm();
      step();
    };

    if (document.documentElement.hasAttribute(IDENT_ATTR)) {
      window.addEventListener(IDENT_DONE_EVENT, begin, { once: true });
    } else {
      // no ident on stage (it has already finished, or never ran) - the
      // browser's own fragment scroll stands, and this only confirms it
      begin();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(IDENT_DONE_EVENT, begin);
      disarm();
    };
  }, []);

  return null;
}
