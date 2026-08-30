"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { observeReveal } from "@/lib/reveal";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when the user prefers reduced motion. SSR-safe (defaults false). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * Adds `is-in` to the element the first time it enters the viewport.
 *
 * Text Motion V3 §23/§42: this used to create ONE IntersectionObserver PER
 * CALL - dozens per page, each asking the same question at a slightly
 * different threshold. It now registers with the site's single shared
 * observer, which also carries the approved thresholds (15% desktop, 10% at
 * <=768), the fast-scroll safety and the "a return is not an arrival" rule.
 *
 * The old `threshold` argument is kept in the signature so that the call sites
 * do not all have to change in the same commit, but it is deliberately no
 * longer honoured: a single reveal policy is the point. It is accepted and
 * ignored.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  // accepted so existing call sites keep compiling; the shared runtime owns
  // the reveal point now, and one policy is the whole point of the change
  void threshold;
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el);
  }, []);
  return ref;
}
