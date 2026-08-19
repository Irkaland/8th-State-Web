"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Messages } from "@/i18n";

/**
 * Act 01 - Master Showreel. A cinematic moving hero: the master at
 * /media/showreel.mp4 starts by itself (muted, inline, looping), with the
 * optimized first-frame poster covering the stage until playback is
 * actually confirmed advancing.
 */
const REEL_SRC = "/media/showreel.mp4";
// The poster is the reel's own first frame - the pre-play stage reads as the
// real footage, never the legacy red placeholder composition.
const REEL_POSTER = "/media/showreel-poster.jpg";

export function Showreel({ messages, hasReel }: { messages: Messages; hasReel: boolean }) {
  const m = messages.dao.reel;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Autoplay lifecycle. muted + playsInline satisfies the Safari/Chrome
  // autoplay policy with no user gesture, but readiness must NOT gate the
  // first attempt: with preload="metadata" iOS Safari settles at
  // readyState 1 and never fires `canplay` on its own, so a canplay-gated
  // play() call never runs and the reel sits frozen on its first frame.
  // Instead: attempt immediately, let readiness events re-arm a bounded
  // number of retries, and treat the `playing` event as the only proof of
  // real playback. Reduced-motion visitors keep the still poster - the same
  // "ambient motion stops" contract as the ticker and the contact sun.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasReel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let confirmed = false;
    let tries = 0;
    const MAX_TRIES = 4;

    // WebKit consults the muted content attribute as well as the property.
    v.defaultMuted = true;
    v.muted = true;

    const attempt = () => {
      if (disposed || !v.paused) return;
      if (!confirmed) {
        if (tries >= MAX_TRIES) return;
        tries += 1;
      }
      v.muted = true;
      // Rejections are expected while the element is still settling; the
      // next readiness or visibility event re-arms the attempt.
      void v.play().catch(() => {});
    };

    const readiness = ["loadedmetadata", "loadeddata", "canplay"] as const;
    const onPlaying = () => {
      confirmed = true;
      // proof of advancing playback - stop the readiness retries and hand
      // the stage over from the poster
      for (const e of readiness) v.removeEventListener(e, attempt);
      if (!disposed) setPlaying(true);
    };
    // iOS pauses media when the tab is hidden; resume on return.
    const onVisibility = () => {
      if (document.visibilityState === "visible") attempt();
    };

    v.addEventListener("playing", onPlaying);
    for (const e of readiness) v.addEventListener(e, attempt);
    document.addEventListener("visibilitychange", onVisibility);
    attempt();

    return () => {
      disposed = true;
      v.removeEventListener("playing", onPlaying);
      for (const e of readiness) v.removeEventListener(e, attempt);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasReel]);

  return (
    <section
      className="dao-reel"
      data-dao-scene="dark"
      data-dao-idle-zone
      aria-label={m.act}
      id="reel"
    >
      <div className="dao-reel__media">
        <video ref={videoRef} preload="metadata" playsInline muted loop aria-label={m.title}>
          {hasReel && <source src={REEL_SRC} type="video/mp4" />}
        </video>
        {/* §Perf Phase 1: the poster frame is layered over the video as an
            optimized responsive image instead of the raw poster attribute -
            .dao-reel__media img carries the exact same absolute/inset/cover
            rules as the video, so the crop and composition are identical. It
            leaves the stage only once `playing` has confirmed real playback,
            so the visitor never sees poster -> frozen/black. */}
        {!playing && (
          <Image
            src={REEL_POSTER}
            alt=""
            fill
            sizes="100vw"
            quality={82}
            className="object-cover"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="dao-reel__scrim" aria-hidden="true" />

      <div className="dao-reel__meta dao-label">
        <span>{m.title}</span>
        <span>{m.duration}</span>
        <span>{m.format}</span>
      </div>
    </section>
  );
}
