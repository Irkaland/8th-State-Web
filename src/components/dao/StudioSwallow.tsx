"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./hooks";

/**
 * The /studio manifesto swallow: midground presence that moves 15% slower
 * than scroll (handoff 4a) - never decoration. Static under reduced motion.
 */
export function StudioSwallow() {
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

  return <span ref={ref} className="dst__swallow dao-mask" aria-hidden="true" />;
}
