"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ReelMessages } from "@/i18n/slices";
import { IDENT_ATTR, IDENT_DONE_EVENT } from "@/lib/session-lifecycle";
import { up } from "@/lib/cn";

/**
 * Act 01 - Master Showreel. A cinematic moving hero: the master at
 * /media/showreel.mp4 starts by itself (muted, inline, looping), with the
 * optimized first-frame poster covering the stage until playback is
 * actually confirmed advancing.
 *
 * IT LOOPS, SO IT CAN BE STOPPED (WCAG 2.2.2).
 *
 * Content that moves by itself for more than five seconds has to offer a
 * mechanism to pause it, and a looping reel never ends on its own. The control
 * is a text control in the reel's own meta strip, in the same register as the
 * authorship line beside it - not a media chrome overlay, which would be a
 * second visual language on the site's most composed frame. It appears only
 * once playback is genuinely confirmed, so it never offers to pause a still.
 *
 * Reduced motion is handled separately and more strongly: the reel is never
 * started at all, and the poster stands - so there is nothing to pause and no
 * control is drawn.
 */
const REEL_SRC = "/media/showreel.mp4";
// The poster is the reel's own first frame - the pre-play stage reads as the
// real footage, never the legacy red placeholder composition.
const REEL_POSTER = "/media/showreel-poster.jpg";

/** bounded timed retries once the reel is genuinely eligible to play */
const RETRY_MS = 250;
const MAX_TRIES = 12;

export function Showreel({ reel, hasReel }: { reel: ReelMessages; hasReel: boolean }) {
  const m = reel;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  /**
   * Whether the reader has paused it.
   *
   * Separate from `playing`, which means "real playback was ever confirmed" and
   * is what retires the poster. Pausing must not bring the poster back over a
   * frame the reader chose to stop on.
   */
  const [paused, setPaused] = useState(false);
  /**
   * The reader asked for it to stop.
   *
   * A ref as well as state, because the autoplay lifecycle below reads it from
   * inside long-lived listeners: the reel's own "pause" handler exists to
   * recover from a browser-initiated pause (backgrounding, an audio-session
   * interruption) by trying again, and without this it would immediately undo a
   * deliberate one - which would make the control useless and WCAG 2.2.2
   * unmet in practice while appearing to be met.
   */
  const userPaused = useRef(false);

  // Autoplay lifecycle (§10-§12). muted + playsInline satisfies the
  // Safari/Chrome autoplay policy with no user gesture, but two things went
  // wrong before and both had to be fixed:
  //
  //   1. attempts were spent while the reel was NOT eligible. The Studio Ident
  //      is a fixed sheet over the whole viewport for ~3.5s; mobile WebKit and
  //      Chrome refuse (or immediately re-pause) autoplay for a video that is
  //      covered or off-screen. Every early attempt was rejected, the budget
  //      ran out, and the reel sat on frame one.
  //   2. retries were driven ONLY by readiness events. On a refresh the media
  //      is already buffered, so loadedmetadata/loadeddata/canplay have all
  //      fired before the listeners attach - no event ever arrives again, so a
  //      rejected first play() is never retried. That is why a later re-render
  //      (a locale switch) sometimes "fixed" it: a fresh element happened to
  //      attempt at an eligible moment.
  //
  // So: wait until the reel is ELIGIBLE (ident gone, element intersecting,
  // page visible), then attempt on a bounded timer as well as on readiness
  // events, and treat `playing` as the only proof. Reduced-motion visitors
  // keep the still poster - the same "ambient motion stops" contract as the
  // ticker and the contact sun.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasReel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let confirmed = false;
    let tries = 0;
    let timer: number | undefined;
    let onScreen = false;

    // WebKit consults the muted content attribute as well as the property.
    v.defaultMuted = true;
    v.muted = true;

    const identGone = () => !document.documentElement.hasAttribute(IDENT_ATTR);
    const eligible = () =>
      !disposed && identGone() && onScreen && document.visibilityState === "visible";

    const clear = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };

    const attempt = () => {
      clear();
      if (disposed || confirmed) return;
      // not eligible yet: cost nothing, wait to be re-armed
      if (!eligible()) return;
      if (tries >= MAX_TRIES) return;
      tries += 1;
      v.muted = true;
      // Rejections are expected while the element settles; the bounded timer
      // re-arms rather than relying on an event that may never come again.
      void v.play().catch(() => {});
      if (!confirmed) timer = window.setTimeout(attempt, RETRY_MS);
    };

    /** something changed that may have made the reel eligible - try again */
    const rearm = () => {
      if (disposed || confirmed) return;
      // a genuine change of circumstance refreshes the budget, so a reel that
      // was ineligible for its whole first window still gets a fair chance
      tries = 0;
      attempt();
    };

    const readiness = ["loadedmetadata", "loadeddata", "canplay"] as const;
    const onPlaying = () => {
      confirmed = true;
      clear();
      for (const e of readiness) v.removeEventListener(e, attempt);
      if (!disposed) setPlaying(true);
    };
    // iOS pauses media when the tab is hidden; resume on return.
    const onVisibility = () => {
      if (document.visibilityState === "visible") rearm();
    };
    // If the browser pauses it again after we confirmed (backgrounding, an
    // audio-session interruption), one more bounded round is allowed.
    const onPause = () => {
      if (disposed || !confirmed) return;
      // the reader stopped it on purpose - leave it stopped
      if (userPaused.current) return;
      if (document.visibilityState !== "visible") return;
      confirmed = false;
      tries = 0;
      for (const e of readiness) v.addEventListener(e, attempt);
      attempt();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const now = entry?.isIntersecting ?? false;
        if (now === onScreen) return;
        onScreen = now;
        if (onScreen) rearm();
      },
      { threshold: 0.1 },
    );
    io.observe(v);

    // keep the control's label in step with the element, however it got there
    const syncPaused = () => {
      if (!disposed) setPaused(v.paused);
    };

    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    v.addEventListener("pause", syncPaused);
    v.addEventListener("play", syncPaused);
    for (const e of readiness) v.addEventListener(e, attempt);
    document.addEventListener("visibilitychange", onVisibility);
    // the ident tells us the moment it leaves the stage
    window.addEventListener(IDENT_DONE_EVENT, rearm);
    attempt();

    return () => {
      disposed = true;
      clear();
      io.disconnect();
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("pause", syncPaused);
      v.removeEventListener("play", syncPaused);
      for (const e of readiness) v.removeEventListener(e, attempt);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(IDENT_DONE_EVENT, rearm);
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

      {/* §16: studio authorship rather than technical specs - same strip,
          same typography, same position */}
      <div className="dao-reel__meta dao-label">
        <span>{m.authored}</span>
        {/* WCAG 2.2.2: the reel loops, so it must be stoppable. Rendered only
            once real playback is confirmed - there is nothing to pause before
            that, and under reduced motion there never will be. */}
        {playing && (
          <button
            type="button"
            className="dao-reel__toggle mo-h"
            aria-label={paused ? m.play : m.pause}
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) {
                userPaused.current = false;
                void v.play();
              } else {
                userPaused.current = true;
                v.pause();
              }
            }}
          >
            {paused ? up(m.play) : up(m.pause)}
          </button>
        )}
      </div>
    </section>
  );
}
