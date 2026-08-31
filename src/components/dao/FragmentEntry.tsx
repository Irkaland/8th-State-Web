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
 * at a restored offset - but it lands on top of the browser's OWN fragment
 * scroll, which has already happened by then. So `/services#photography` opened
 * from a shared link, a bookmark or a search result arrived at the top of the
 * catalogue.
 *
 * WHAT THIS IS DRIVEN BY
 * ----------------------
 * Two signals, not a timer.
 *
 *  - The ident already publishes its own completion: `IDENT_ATTR` says the
 *    sheet is on stage, `IDENT_DONE_EVENT` fires the moment it leaves. The
 *    Showreel uses the same signal to know when it may start. So placement
 *    begins when the competing entrance says it has finished, not after a
 *    guessed number of milliseconds.
 *
 *  - Settlement is read from the page itself: the anchor's own layout position
 *    and the document height have to stop changing, and the two lifecycle
 *    events that move them - web fonts swapping and the load event resolving
 *    image sizes - have to have happened. Those are facts about this page on
 *    this machine, so a slow machine and a fast one behave the same way.
 *
 * EVERY FRAGMENT NAVIGATION, NOT EVERY DOCUMENT
 * ---------------------------------------------
 * The first version ran ONCE per document, and that was the defect behind the
 * intermittent misses. `/services#photography` -> `/services#creative-direction`
 * changes only the hash, which is a SAME-DOCUMENT navigation: no reload, no new
 * module instance, no remount, so a per-document flag was already spent and the
 * second anchor was left entirely to the browser's native scroll with nothing
 * re-asserting it when layout moved underneath. Measured: four sequential
 * `#anchor` loads produced one document and one navigation entry.
 *
 * So the unit of work is the fragment navigation. `hashchange` starts a fresh
 * placement, and each placement supersedes the one before it.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 *  - It never fights the reader. The moment a real gesture arrives, the
 *    placement it interrupts is abandoned. The listeners are armed only once
 *    placement has begun, so the tap that SKIPS the ident does not cancel the
 *    landing the reader asked for by opening that URL.
 *  - It leaves Back and Forward alone. A hash change that came from history is
 *    ignored outright: whatever the browser and the router restore is what
 *    stands. Nothing here reads or writes history, and `scrollRestoration` is
 *    not touched.
 *  - It stops. Placement ends when the target is reached and the page has
 *    settled, or when the anchor is as close as the document can bring it.
 *    There is a backstop, but it is a backstop - the settle gate is what
 *    normally ends the work.
 *  - It never runs without a hash, and never for a hash that names nothing.
 */

/** How often placement re-checks while the page is still settling. */
const TICK_MS = 60;
/** Close enough to the anchor's own scroll-margin offset to call it placed. */
const TOLERANCE_PX = 4;
/** Consecutive unchanged readings that mean the layout has stopped moving. */
const STABLE_TICKS = 3;
/**
 * A backstop, not the mechanism.
 *
 * Placement normally ends because the page settled. This exists only so that a
 * pathological page - one whose height never stops changing - cannot leave a
 * 60ms timer running for the life of the document.
 */
const BACKSTOP_MS = 15000;
/** How long after a popstate a hash change is still attributable to history. */
const HISTORY_WINDOW_MS = 250;

/**
 * The anchor's position in LAYOUT, ignoring transforms.
 *
 * Deliberately not `getBoundingClientRect()`. Several capability anchors sit
 * inside a block that carries the entrance micro-shift - `.dao-fade` starts
 * 14px low and resolves to none - and a rect includes that transform. Measuring
 * the rect means chasing an animation that is still playing: it reads as "not
 * in place yet", scrolls to compensate, and nudges the page under a reader who
 * is already looking at it. `offsetTop` is the un-transformed layout position,
 * so placement is exact and the motion system is left to play out on top of it.
 */
function layoutTop(el: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export function FragmentEntry() {
  useEffect(() => {
    /** cancels whatever placement is currently running, if any */
    let abandon: (() => void) | null = null;

    /** set while a hash change is attributable to Back/Forward */
    let historyAt = 0;
    const onPopState = () => {
      historyAt = Date.now();
    };

    const place = (id: string) => {
      // a new fragment supersedes the one before it
      abandon?.();

      let cancelled = false;
      let stable = 0;
      let lastKey = "";
      let timer = 0;
      const startedAt = Date.now();

      // the two lifecycle events that move an anchor after first paint
      let fontsReady = false;
      let loaded = document.readyState === "complete";
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts) {
        void fonts.ready.then(() => {
          fontsReady = true;
        });
      } else {
        fontsReady = true;
      }
      const onLoad = () => {
        loaded = true;
      };
      if (!loaded) window.addEventListener("load", onLoad, { once: true });

      const stop = () => {
        cancelled = true;
      };
      const gestures = ["wheel", "touchstart", "keydown"] as const;
      for (const g of gestures) window.addEventListener(g, stop, { passive: true });

      const done = () => {
        cancelled = true;
        window.clearTimeout(timer);
        window.removeEventListener("load", onLoad);
        for (const g of gestures) window.removeEventListener(g, stop);
        if (abandon === done) abandon = null;
      };
      abandon = done;

      const step = () => {
        if (cancelled) return;
        if (Date.now() - startedAt > BACKSTOP_MS) return done();

        const el = document.getElementById(id);
        if (!el) return done();

        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        // where the anchor asks to be, as far as the document can actually go
        const target = Math.max(
          0,
          Math.min(Math.round(layoutTop(el) - margin), Math.max(0, limit)),
        );

        // geometry is "settled" when the answer itself stops moving
        const key = `${target}:${document.documentElement.scrollHeight}:${window.innerHeight}`;
        stable = key === lastKey ? stable + 1 : 0;
        lastKey = key;

        const off = Math.round(window.scrollY) - target;
        if (Math.abs(off) > TOLERANCE_PX) {
          window.scrollTo({ top: target, behavior: "instant" });
        } else if (stable >= STABLE_TICKS && fontsReady && loaded) {
          // in place, the layout has stopped moving, and the two things that
          // would still move it have already happened - nothing left to wait for
          return done();
        }

        timer = window.setTimeout(step, TICK_MS);
      };

      step();
    };

    /** the hash as the reader typed it, or "" */
    const currentId = () => {
      try {
        return decodeURIComponent(window.location.hash.slice(1));
      } catch {
        // a malformed escape is not ours to repair - take it literally
        return window.location.hash.slice(1);
      }
    };

    const onHashChange = () => {
      // Back and Forward are the browser's, not ours
      if (Date.now() - historyAt < HISTORY_WINDOW_MS) return;
      const id = currentId();
      if (!id || !document.getElementById(id)) return;
      place(id);
    };

    /**
     * Telling a fragment navigation from a history traversal.
     *
     * The Navigation API answers this exactly - `navigationType` is "push" or
     * "replace" when the reader asks for an anchor and "traverse" when the
     * browser is walking history - so where it exists that is the signal, and
     * traversals are left strictly alone.
     *
     * Where it does not exist, `hashchange` plus a popstate window is the
     * spec-correct reading: a link or an address-bar fragment fires hashchange
     * ALONE, and only a traversal is preceded by popstate. That heuristic is
     * exactly what it looks like - a heuristic - which is why it is the
     * fallback rather than the mechanism. (It is also why it cannot be the only
     * path: driven through CDP, a same-document `goto` fires popstate too, so
     * the fallback alone would refuse every anchor under test.)
     */
    const navigation = (
      window as unknown as {
        navigation?: EventTarget;
      }
    ).navigation;

    const onNavigate = (e: Event) => {
      const ev = e as Event & {
        navigationType?: string;
        hashChange?: boolean;
        destination?: { url: string };
      };
      if (ev.navigationType === "traverse") return;
      if (!ev.hashChange || !ev.destination) return;
      let id = "";
      try {
        id = decodeURIComponent(new URL(ev.destination.url).hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      // the event fires BEFORE the browser has moved, so let the navigation
      // land first and confirm it from there
      window.setTimeout(() => {
        if (document.getElementById(id)) place(id);
      }, 0);
    };

    if (navigation) {
      navigation.addEventListener("navigate", onNavigate);
    } else {
      window.addEventListener("popstate", onPopState);
      window.addEventListener("hashchange", onHashChange);
    }
    const teardown = () => {
      navigation?.removeEventListener("navigate", onNavigate);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
    };

    // and the fragment this document opened with
    const first = currentId();
    if (first && document.getElementById(first)) {
      if (document.documentElement.hasAttribute(IDENT_ATTR)) {
        // the ident is on stage and will take the page to the top itself;
        // placement begins when it says it has left
        const begin = () => place(first);
        window.addEventListener(IDENT_DONE_EVENT, begin, { once: true });
        return () => {
          window.removeEventListener(IDENT_DONE_EVENT, begin);
          teardown();
          abandon?.();
        };
      }
      // no ident on stage - the browser's own fragment scroll stands, and this
      // only holds it against the page settling underneath
      place(first);
    }

    return () => {
      teardown();
      abandon?.();
    };
  }, []);

  return null;
}
