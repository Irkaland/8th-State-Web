"use client";

import { Fragment, useEffect, useRef } from "react";
import { up } from "@/lib/cn";

/**
 * Studio Lab Glacier ticker row (§08/§09). Words are separated by the
 * brand four-point star asset instead of the ✳ character - U+2733 renders
 * as an emoji or a missing glyph on several mobile font stacks. Two
 * identical halves make the -50% translate loop seamless.
 *
 * §06/§07 (final pass): the 36s CSS transform loop remains the driver at
 * every viewport width, but mobile compositors can silently stall the
 * animation after a resize, an orientation change or a bfcache restore.
 * A lightweight watchdog samples the computed transform twice (400ms
 * apart) after mount and after those events; if the row is physically
 * frozen it restarts the CSS animation once, and if the compositor still
 * refuses, it drives the identical translate3d loop from rAF. There is no
 * continuous polling while the loop is healthy, and reduced motion keeps
 * the row static (the watchdog stays inert).
 */
const CYCLE_MS = 36_000;
const SAMPLE_GAP_MS = 400;

export function LabTickerRow({ words }: { words: string[] }) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    let raf = 0;
    let disposed = false;
    let fallback = false;

    // Last-resort driver: the same seamless -50% loop, compositor-friendly
    // translate3d, only engaged when the CSS animation is proven frozen.
    const drive = (now: number) => {
      const p = (now % CYCLE_MS) / CYCLE_MS;
      row.style.transform = `translate3d(${(-p * 50).toFixed(4)}%, 0, 0)`;
      raf = requestAnimationFrame(drive);
    };

    const restartCss = () => {
      row.style.animation = "none";
      void row.offsetWidth; // reflow so the animation genuinely restarts
      row.style.animation = "";
    };

    const verify = (attempt: number) => {
      if (disposed || fallback || reduced.matches) return;
      if (document.visibilityState !== "visible") return;
      const before = getComputedStyle(row).transform;
      timer = window.setTimeout(() => {
        if (disposed || fallback || reduced.matches) return;
        const after = getComputedStyle(row).transform;
        if (after !== before) return; // physically moving - nothing to do
        if (attempt === 0) {
          restartCss();
          verify(1);
        } else {
          fallback = true;
          row.style.animation = "none";
          raf = requestAnimationFrame(drive);
        }
      }, SAMPLE_GAP_MS);
    };

    const recheck = () => {
      if (fallback) return;
      window.clearTimeout(timer);
      verify(0);
    };

    verify(0);
    window.addEventListener("resize", recheck);
    window.addEventListener("orientationchange", recheck);
    window.addEventListener("pageshow", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recheck);
      window.removeEventListener("orientationchange", recheck);
      window.removeEventListener("pageshow", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  const half = (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {up(w)}
          <span className="dao-lab__tickstar dao-mask" aria-hidden="true" />
        </Fragment>
      ))}
    </>
  );
  return (
    <div className="dao-lab__tickerrow" ref={rowRef}>
      <span>{half}</span>
      <span>{half}</span>
    </div>
  );
}
