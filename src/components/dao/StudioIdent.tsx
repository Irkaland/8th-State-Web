"use client";

import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/cn";
import {
  SERPENT_DASHARRAY,
  SERPENT_DASH_HIDDEN,
  SERPENT_DRAW_PATH,
  SERPENT_DRAW_STROKE,
  SERPENT_VIEWBOX,
} from "./serpent-draw-path";

/**
 * Studio Ident - the official 8th State brand mark, assembled on screen.
 *
 * Composition (brand pass §02-§04): the approved serpent/infinity lockup on
 * the approved intro green (#126149), carrying the same paper material as
 * before - grain, weave and ink splash are untouched, only the ground colour
 * changed. Three layers, all derived from the official artwork
 * (public/assets/brand/8th-state-logo-mark.png, see
 * scripts/extract-brand-mark.mjs): the RED serpent, the WHITE celestial sun
 * in its left loop and the BLACK celestial sun in its right loop. Nothing
 * sits below PRODUCTION and the ident carries no corner metadata.
 *
 * Choreography, one coordinated ident rather than three animations: the
 * serpent holds its final approved geometry from frame one and is DRAWN ALONG
 * ITS OWN BODY, tail first and head last (0-1600ms) - it never travels. While
 * the body is being drawn the white sun descends from above (260-1310ms) and
 * the black sun rises from below (380-1460ms), so both have settled into their
 * loops shortly before the head closes; typography reveals directionally
 * (~0.55s). The mark completes at ~1.6s and the finished composition holds
 * until ~2.45s - the same total timeline the earlier idents ran - then the
 * sheet leaves the stage over ~1050ms.
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

      <div className="dao-ident__center">
        <div className="dao-ident__markwrap" aria-hidden="true">
          {/* The authentic artwork sits at its final position and size from
              frame one and never moves. All that animates is the mask stroke:
              it runs along the serpent's own centreline (recovered from the
              artwork by scripts/make-serpent-draw-path.mjs, ordered tail ->
              head) and stroke-dashoffset walks the reveal front down it, so
              the body is drawn along its real curves and loops and the head
              closes last. At full reveal the mask exposes 100% of the
              artwork, so the finished mark is the approved static one. */}
          <svg
            className="dao-ident__serpentdraw"
            viewBox={`0 0 ${SERPENT_VIEWBOX.width} ${SERPENT_VIEWBOX.height}`}
            style={{
              ["--dao-serpent-dash" as string]: SERPENT_DASHARRAY,
              ["--dao-serpent-hidden" as string]: String(SERPENT_DASH_HIDDEN),
            }}
            focusable="false"
          >
            <defs>
              <mask
                id="dao-ident-serpent-draw"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={SERPENT_VIEWBOX.width}
                height={SERPENT_VIEWBOX.height}
              >
                <path
                  className="dao-ident__serpentink"
                  d={SERPENT_DRAW_PATH}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={SERPENT_DRAW_STROKE}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
              </mask>
            </defs>
            <image
              className="dao-ident__serpent"
              href="/assets/brand/serpent-infinity.webp"
              x="0"
              y="0"
              width={SERPENT_VIEWBOX.width}
              height={SERPENT_VIEWBOX.height}
              mask="url(#dao-ident-serpent-draw)"
            />
          </svg>
          {/* the two celestial suns land inside their own serpent loops:
              white descends from above on the left, black rises from below
              on the right - exactly the official lockup's relationship */}
          <div className="dao-ident__sun dao-ident__sun--white dao-mask" />
          <div className="dao-ident__sun dao-ident__sun--black dao-mask" />
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
    </div>
  );
}
