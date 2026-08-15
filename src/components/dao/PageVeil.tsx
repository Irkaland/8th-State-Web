"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type VeilFamily = "blue" | "red" | "green" | "ink" | "paper" | "fade" | "none";

/**
 * Route-entrance material veil (handoff 4i transition families):
 * Work / Georgia - Production blue sheet · Studio - identity red print ·
 * Studio Lab - green botanical sheet · Contact / Brief - ink frame ·
 * Services / Process - neutral paper · Legal - simple fade.
 * The sheet covers the route on arrival and tears away upward.
 * Reduced motion: crossfade (CSS).
 */
export function PageVeil({ family }: { family: VeilFamily }) {
  const [phase, setPhase] = useState<"cover" | "lift" | "gone">(
    family === "none" ? "gone" : "cover",
  );

  useEffect(() => {
    if (family === "none") return;
    // §12: the sheet holds a beat, then lifts over 820ms SCENE so outgoing
    // and incoming grounds feel connected - never a blank frame.
    const lift = window.setTimeout(() => setPhase("lift"), 120);
    const gone = window.setTimeout(() => setPhase("gone"), 1000);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(gone);
    };
  }, [family]);

  if (phase === "gone") return null;

  return (
    <div
      className={cn("dao-veil", `dao-veil--${family}`, phase === "lift" && "is-lifting")}
      aria-hidden="true"
    >
      {family !== "fade" && <div className="dao-grain--strong" />}
    </div>
  );
}
