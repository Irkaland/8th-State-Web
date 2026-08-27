"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./hooks";

/**
 * The /studio manifesto decoration: midground presence that moves 15% slower
 * than scroll (handoff 4a) - never decoration for its own sake. Static under
 * reduced motion.
 *
 * SUPERSEDES StudioSwallow, which drew one 900px bird filling the right half of
 * the cover. At that size the mark was both a backdrop rather than placed
 * artwork, and drawn far past its own resolution. Three brandbook marks stand in
 * its place at three clearly different sizes, spaced apart and off any shared
 * axis; the parallax is unchanged, and applies to the group as one object, so
 * there is still exactly one scroll listener and one transform per frame.
 */
export function StudioDecor() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.transform = `translateY(${window.scrollY * 0.15}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <span ref={ref} className="dst__decor" aria-hidden="true">
      <span className="dst__decor--birds dao-mask" />
      <span className="dst__decor--stem dao-mask" />
      <span className="dst__decor--flourish dao-mask" />
    </span>
  );
}
