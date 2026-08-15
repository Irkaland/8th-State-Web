"use client";

import { useRef, useState } from "react";
import type { Messages } from "@/i18n";

/**
 * Act 01 - Master Showreel. Structurally ready for the final master asset:
 * drop the file at /media/showreel.mp4 (+ poster /media/showreel-poster.jpg)
 * and it plays; until then the poster field carries the scene (no substitute
 * external footage, per the handoff).
 */
const REEL_SRC = "/media/showreel.mp4";
const REEL_POSTER = "/media/hero-red.jpg";

export function Showreel({ messages, hasReel }: { messages: Messages; hasReel: boolean }) {
  const m = messages.dao.reel;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = () => {
    const v = videoRef.current;
    if (!v || failed || !hasReel) return;
    v.muted = true;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setFailed(true));
  };

  return (
    <section
      className="dao-reel"
      data-dao-scene="dark"
      data-dao-idle-zone
      aria-label={m.act}
      id="reel"
    >
      <div className="dao-reel__media">
        <video
          ref={videoRef}
          poster={REEL_POSTER}
          preload="metadata"
          playsInline
          muted
          loop
          onError={() => setFailed(true)}
          aria-label={m.title}
        >
          {hasReel && <source src={REEL_SRC} type="video/mp4" />}
        </video>
      </div>
      <div className="dao-reel__scrim" aria-hidden="true" />
      {/* red torn boundary handed down from the ident */}
      <div
        className="dao-tear dao-tear--top"
        style={{ background: "var(--dao-red)" }}
        aria-hidden="true"
      />

      {!playing && (
        <button type="button" className="dao-reel__play" onClick={play} aria-label={m.play}>
          <span className="dao-reel__rosette dao-mask" aria-hidden="true" />
          <span className="dao-reel__playlabel">{m.play}</span>
        </button>
      )}

      <div className="dao-reel__meta dao-label">
        <span>{m.title}</span>
        <span>{m.duration}</span>
        <span>{m.format}</span>
      </div>
    </section>
  );
}
