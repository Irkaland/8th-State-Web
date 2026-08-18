"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Messages } from "@/i18n";

/**
 * Act 01 - Master Showreel. A cinematic moving hero: the master at
 * /media/showreel.mp4 starts by itself (muted, inline, looping) as soon as
 * it can paint, with the optimized poster covering the stage until the
 * first frames are actually rendering.
 */
const REEL_SRC = "/media/showreel.mp4";
// §09: the poster is the reel's own first frame - the pre-play stage reads
// as the real footage, never the legacy red placeholder composition.
const REEL_POSTER = "/media/showreel-poster.jpg";

export function Showreel({ messages, hasReel }: { messages: Messages; hasReel: boolean }) {
  const m = messages.dao.reel;
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const [playing, setPlaying] = useState(false);

  // §01 autoplay - muted + playsInline satisfies Safari/Chrome autoplay
  // policy without user interaction. Exactly one play() attempt is made,
  // once the element reports it can paint frames. Reduced-motion visitors
  // keep the still poster instead - the same "ambient motion stops"
  // contract as the ticker and the contact sun.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasReel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const start = () => {
      if (cancelled || started.current) return;
      started.current = true;
      v.muted = true;
      v.play()
        .then(() => {
          if (!cancelled) setPlaying(true);
        })
        .catch(() => {
          // Autoplay refused or the source failed - the poster simply
          // stays as the hero. No retry loop.
        });
    };
    if (v.readyState >= 3) start();
    else v.addEventListener("canplay", start, { once: true });
    return () => {
      cancelled = true;
      v.removeEventListener("canplay", start);
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
            optimized responsive image instead of the raw 2400×3600 poster
            attribute - .dao-reel__media img carries the exact same
            absolute/inset/cover rules as the video, so the crop and
            composition are identical. It leaves the stage the moment
            playback starts, exactly like a native poster. */}
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
