"use client";

import { useInViewOnce } from "./hooks";

/**
 * Generic scroll-entrance wrapper: adds `is-in` once the block is inside the
 * viewport, so every V3 family within it - .mo-a ... .mo-g and the retuned
 * .dao-rise / .dao-fade / .dao-side / .dbr__deal - runs from ONE observation.
 *
 * The reveal point, the fast-scroll safety and the reduced-motion behaviour all
 * live in the shared runtime (lib/reveal.ts), not here. `threshold` is retained
 * for source compatibility and is ignored - see useInViewOnce.
 */
export function InView({
  className,
  children,
  threshold = 0.15,
  scene,
}: {
  className?: string;
  children: React.ReactNode;
  threshold?: number;
  /** Ground this block presents to the chrome (contrast system, §05/§14). */
  scene?: "light" | "dark";
}) {
  const ref = useInViewOnce<HTMLDivElement>(threshold);
  return (
    <div ref={ref} className={className} data-dao-scene={scene}>
      {children}
    </div>
  );
}
