"use client";

import { useInViewOnce } from "./hooks";

/**
 * Generic scroll-entrance wrapper: adds `is-in` once ~15% visible so
 * .dao-rise / .dao-fade / .dao-side / .dbr__deal children run their
 * approved entrances (once, never replayed on scroll-up).
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
