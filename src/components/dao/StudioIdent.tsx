"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/cn";

/**
 * Studio Ident - locked composition; refined choreography (motion pass §01):
 * the serpent crawls in from the side (0s), the sun descends from above
 * (~0.2s), the moon rises from below (~0.35s), typography reveals
 * directionally (~0.55s) and the official logo label prints in (~0.85s).
 * The composition settles by ~1.5s and HOLDS - total visible experience is
 * ≥2.4s - then the sheet leaves the stage over ~1050ms.
 *
 * Playback (v7 contract #6, deterministic): plays on every real hard load /
 * refresh on any route (module-scope flag = one browser page load), never
 * replays on internal navigation, and any input skips immediately.
 * Reduced motion: static composition, short fades only.
 */
let identPlayedThisLoad = false;

const EXIT_MS = 1100;
const HOLD_UNTIL_MS = 2450;

export function StudioIdent({ messages }: { messages: Messages }) {
  const m = messages.dao.ident;
  // Lazy initial state: on internal client-side navigation the ident mounts
  // already "gone" - it must never paint, not even for one frame (§01).
  // On a real document load the module flag is fresh and the ident holds.
  const [phase, setPhase] = useState<"hold" | "drawn" | "leaving" | "gone">(() =>
    identPlayedThisLoad ? "gone" : "hold",
  );
  const leftRef = useRef(false);

  useEffect(() => {
    if (identPlayedThisLoad) {
      // already played on this document load - the lazy initial state
      // mounted this instance as "gone", nothing to run
      leftRef.current = true;
      return;
    }
    identPlayedThisLoad = true;

    // §02/§15: a real document load always begins at the top - the browser
    // must never restore the previous scroll position. The reset happens
    // behind the ident sheet, so there is no visible jump after render.
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });

    const leave = () => {
      if (leftRef.current) return;
      leftRef.current = true;
      setPhase("leaving");
      window.setTimeout(() => setPhase("gone"), EXIT_MS);
    };

    // Choreography starts on the next frame; the completed composition holds
    // on screen until ~2.45s before the exit begins.
    const draw = window.setTimeout(() => setPhase("drawn"), 60);
    const auto = window.setTimeout(leave, HOLD_UNTIL_MS);

    // Any input skips immediately.
    const opts = { passive: true } as const;
    window.addEventListener("wheel", leave, opts);
    window.addEventListener("touchstart", leave, opts);
    window.addEventListener("keydown", leave);
    window.addEventListener("pointerdown", leave);

    return () => {
      window.clearTimeout(draw);
      window.clearTimeout(auto);
      window.removeEventListener("wheel", leave);
      window.removeEventListener("touchstart", leave);
      window.removeEventListener("keydown", leave);
      window.removeEventListener("pointerdown", leave);
    };
  }, []);

  // Lock page scroll while the ident holds the screen.
  useEffect(() => {
    if (phase === "hold" || phase === "drawn") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [phase]);

  if (phase === "gone") return null;

  const active = phase === "drawn" || phase === "leaving";

  return (
    <div
      className={cn("dao-ident", active && "is-drawn is-in", phase === "leaving" && "is-leaving")}
      aria-label={m.act}
    >
      <div className="dao-grain--strong" aria-hidden="true" />
      <div className="dao-weave" aria-hidden="true" />
      <div className="dao-ident__splash dao-mask" aria-hidden="true" />

      <div className="dao-label dao-ident__corner dao-ident__corner--tl">{m.act}</div>
      <div className="dao-label dao-ident__corner dao-ident__corner--tr">{m.sound}</div>

      <div className="dao-ident__center">
        <div className="dao-ident__markwrap" aria-hidden="true">
          {/* the mark never moves - the wrapper carries the torn reveal
              contour, the serpent itself is fixed at final size (dao.css) */}
          <div className="dao-ident__serpentreveal">
            <div className="dao-ident__serpent dao-mask" />
          </div>
          <div className="dao-ident__sun dao-mask" />
          <div className="dao-ident__moon dao-mask" />
        </div>
        <div className="dao-ident__words">
          <span className="dao-rise">
            <span className="dao-ident__title" style={{ ["--d" as string]: "600ms" }}>
              {m.title}
            </span>
          </span>
          <span className="dao-rise">
            <span className="dao-ident__sub" style={{ ["--d" as string]: "740ms" }}>
              {m.sub}
            </span>
          </span>
        </div>
      </div>

      {/* official full logo on its printed paper label (§02) - the approved
          treatment for the black wordmark on saturated grounds. Delivered
          through the image pipeline at its rendered size (clamp 64-92px,
          dao.css) with DPR-aware srcset - same artwork, same alpha, same
          proportions; priority keeps the label print-in on schedule. */}
      <div className="dao-ident__logolabel" aria-hidden="true">
        <Image
          src="/assets/brand/8th-state-logo.png"
          alt=""
          width={92}
          height={92}
          sizes="92px"
          quality={90}
          priority
        />
      </div>
    </div>
  );
}
