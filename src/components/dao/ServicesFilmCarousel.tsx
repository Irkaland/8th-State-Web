"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "./hooks";

type MediaSet = { name: string; frames: { src: string; fr: string }[] };

/**
 * /services Group III - Film & Video / Photography frame carousel (v7 5e
 * E4). Three frames rotate positions every 6s (and on click): the dominant
 * frame slides to a side slot as the next scales up - the same track
 * physics as the Selected Work carousel, integrated into the editorial
 * layout. No dots, no generic carousel chrome. The active service name
 * controls which media set cycles. Uses current real imagery only.
 * Reduced motion: static dominant arrangement, simple 240ms crossfade.
 */
export function ServicesFilmCarousel({
  filmLabel,
  photoLabel,
}: {
  filmLabel: string;
  photoLabel: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [setIdx, setSetIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [paused, setPaused] = useState(false);
  const busy = useRef(0);

  const sets: MediaSet[] = [
    {
      name: filmLabel,
      frames: [
        { src: "/media/volvo-film.jpg", fr: "FR 01" },
        { src: "/media/aom-film-still.jpg", fr: "FR 02" },
        { src: "/media/leghvi-culture.jpg", fr: "FR 03" },
      ],
    },
    {
      name: photoLabel,
      frames: [
        { src: "/media/aom-gallery-1.jpg", fr: "PH 01" },
        { src: "/media/berlin-editorial.jpg", fr: "PH 02" },
        { src: "/media/office-editorial.jpg", fr: "PH 03" },
      ],
    },
  ];
  const frames = sets[setIdx].frames;

  const advance = useCallback((dir: 1 | -1 = 1) => {
    const now = performance.now();
    if (now - busy.current < 750) return;
    busy.current = now;
    setPos((p) => (p + dir + 3) % 3);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => {
      if (!paused && !document.hidden) advance(1);
    }, 6000);
    return () => window.clearInterval(t);
  }, [advance, paused, reduced]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="dsv__g3names">
        {sets.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className={cn("dsv__name", i === setIdx && "is-active")}
            aria-pressed={i === setIdx}
            onClick={() => {
              setSetIdx(i);
              setPos(0);
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className={cn("dsv__filmtrack", reduced && "dsv__filmtrack--reduced")}>
        {frames.map((f, i) => {
          // slot: 0 = dominant centre, 1 = right secondary, 2 = left secondary
          const slot = (i - pos + 3) % 3;
          return (
            <button
              key={f.src}
              type="button"
              className={cn("dsv__filmframe", slot === 0 && "is-dominant")}
              data-slot={slot}
              aria-label={f.fr}
              onClick={() => slot !== 0 && advance(slot === 1 ? 1 : -1)}
            >
              <Image
                src={f.src}
                alt=""
                fill
                sizes="(max-width:720px) 90vw, 40vw"
                className="object-cover"
              />
              <span className="dsv__fr">{f.fr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
