"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { cn, up } from "@/lib/cn";
import { useInViewOnce, usePrefersReducedMotion } from "./hooks";

export type DaoWorkProject = {
  slug: string;
  title: string;
  category: string;
  role: string;
  client: string;
  year: string;
  cover: string;
  alt: string;
};

const COMMIT_DEBOUNCE = 750;
const TRACK_MS = 720;
const AUTO_MS = 5000;

/**
 * Act 03 - Selected Work, v7 continuous carousel (contract #8, states
 * S1-S7). All frames live on one physical track: centre at scale 1 / 0°,
 * neighbours at scale .72 / ±14° rotateY / 50% opacity; the blue paper
 * sheet is parented to the active frame and travels with it. Direction-
 * aware: NEXT exits left / enters right, PREVIOUS mirrors - for auto-
 * advance (5s), clicks, keyboard, trackpad and touch alike. Drag follows
 * the finger 1:1; commit at 60px or flick velocity; horizontal intent
 * needs |Δx| > 1.5·|Δy| so vertical scroll is never hijacked.
 * Reduced motion: 240ms crossfade + 12px metadata slide, auto-advance off.
 */
export function SelectedWork({
  locale,
  messages,
  projects,
}: {
  locale: Locale;
  messages: Messages;
  projects: DaoWorkProject[];
}) {
  const m = messages.dao.work;
  const sectionRef = useInViewOnce<HTMLElement>(0.15);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [settled, setSettled] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const lastCommit = useRef(0);
  const touch = useRef<{ x: number; y: number; t: number; horizontal: boolean | null } | null>(
    null,
  );
  const wheelAcc = useRef(0);

  const count = projects.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      const now = performance.now();
      if (now - lastCommit.current < COMMIT_DEBOUNCE || count < 2) return;
      lastCommit.current = now;
      setDragX(null);
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  // Counter chip updates at the settled state (S6).
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(index), reduced ? 240 : TRACK_MS);
    return () => window.clearTimeout(t);
  }, [index, reduced]);

  // Auto-advance: every 5s -> NEXT. Pauses on hover/focus in the act, active
  // drag, open menu, hidden tab. Resets after any manual commit. Off under
  // reduced motion unless the user navigates manually first (kept off).
  useEffect(() => {
    if (reduced || count < 2) return;
    let timer: number | undefined;
    const tick = () => {
      const blocked =
        paused ||
        dragX !== null ||
        document.hidden ||
        document.documentElement.hasAttribute("data-dao-nav-open");
      if (!blocked) go(1);
      timer = window.setTimeout(tick, AUTO_MS);
    };
    timer = window.setTimeout(tick, AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [go, paused, dragX, reduced, count, index]);

  // Trackpad / wheel: horizontal-dominant gestures switch projects.
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5) return;
    wheelAcc.current += e.deltaX;
    if (Math.abs(wheelAcc.current) >= 40) {
      const dir = wheelAcc.current > 0 ? 1 : -1;
      wheelAcc.current = 0;
      go(dir as 1 | -1);
    }
  };

  // Touch drag follows the finger 1:1 (S4).
  const onTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    if (!t0) return;
    touch.current = { x: t0.clientX, y: t0.clientY, t: performance.now(), horizontal: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    const t0 = e.touches[0];
    if (!s || !t0) return;
    const dx = t0.clientX - s.x;
    const dy = t0.clientY - s.y;
    if (s.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      s.horizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
    }
    if (s.horizontal) setDragX(dx);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s || !s.horizontal) return;
    const t0 = e.changedTouches[0];
    const dx = (t0?.clientX ?? s.x) - s.x;
    const dt = Math.max(1, performance.now() - s.t);
    const velocity = Math.abs(dx) / dt;
    if (Math.abs(dx) >= 60 || velocity > 0.5) {
      lastCommit.current = 0; // a completed gesture always commits
      go(dx < 0 ? 1 : -1);
    } else {
      setDragX(null); // spring back
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  if (count === 0) return null;
  const active = projects[index];
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  // Signed shortest track offset for each frame.
  const relOf = (i: number) => {
    let rel = (i - index) % count;
    if (rel > count / 2) rel -= count;
    if (rel < -count / 2) rel += count;
    return rel;
  };

  return (
    <section
      ref={sectionRef}
      className={cn("dao-work", reduced && "dao-work--reduced")}
      data-dao-scene="dark"
      id="work"
      aria-label={m.act}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="dao-weave" aria-hidden="true" />
      <div className="dao-work__serpent dao-mask" aria-hidden="true" />

      <div className="dao-work__head">
        <h2 className="dao-work__title">{up(m.title)}</h2>
        <span
          className="dao-work__counter"
          aria-label={`${m.counterLabel}: ${pad(settled)} / ${pad(count - 1)}`}
        >
          <span className="dao-grain" aria-hidden="true" />
          {pad(settled)} / {pad(count - 1)}
        </span>
      </div>

      {/* one physical track (S1) - keyboard-operable carousel group */}
      <div
        className="dao-work__stage"
        role="group"
        aria-roledescription="carousel"
        aria-label={m.title}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="sr-only" aria-live="polite">
          {pad(index)} / {pad(count - 1)} - {active.title}
        </span>
        {projects.map((p, i) => {
          const rel = relOf(i);
          const hidden = Math.abs(rel) > 1;
          const drag = dragX ?? 0;
          const transform = reduced
            ? undefined
            : `translateX(calc(${rel} * var(--dao-track-shift) + ${drag}px)) scale(${
                rel === 0 ? 1 : 0.72
              }) rotateY(${rel === 0 ? 0 : rel > 0 ? -14 : 14}deg)`;
          return (
            <div
              key={p.slug}
              id={`dao-work-opt-${i}`}
              data-active={i === index || undefined}
              className={cn(
                "dao-work__item",
                rel === 0 && "is-active",
                hidden && "is-offstage",
                dragX !== null && "is-dragging",
              )}
              style={{ transform, zIndex: rel === 0 ? 3 : hidden ? 1 : 2 }}
            >
              {/* the blue chapter sheet travels with its frame */}
              <div className="dao-work__sheet" aria-hidden="true">
                <div className="dao-grain--strong" />
                <div className="dao-weave" />
              </div>
              <div className="dao-work__frame">
                <Image
                  src={p.cover}
                  alt={rel === 0 ? p.alt : ""}
                  fill
                  sizes="(max-width: 720px) 90vw, 820px"
                  unoptimized={p.cover === "/media/aom-cover.jpg"}
                  className="object-cover"
                />
                <span className="dao-work__badge">{up(m.caseStudy)}</span>
                {rel === 0 ? (
                  <Link
                    href={localeHref(locale, `/work/${p.slug}`)}
                    className="dao-work__stagelink"
                    aria-label={`${m.goTo}: ${p.title}`}
                  />
                ) : (
                  <button
                    type="button"
                    className="dao-work__stagelink"
                    aria-label={`${rel > 0 ? m.next : m.prev}: ${p.title}`}
                    tabIndex={hidden ? -1 : 0}
                    onClick={() => go(rel > 0 ? 1 : -1)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* metadata travels in sync; title mask-swaps mid-transition */}
      <div className="dao-work__caption" key={active.slug}>
        <Link href={localeHref(locale, `/work/${active.slug}`)} className="dao-work__name">
          {active.title}
          <span className="dao-strike" aria-hidden="true" />
        </Link>
        <div className="dao-work__meta">
          <span>{active.category}</span>
          <span className="dao-work__role">
            <span className="dao-work__tick" aria-hidden="true" />
            {up(m.role)} - {active.role}
          </span>
          <span>
            {up(m.client)} - {active.client}
          </span>
          <span>
            {up(m.year)} - {active.year}
          </span>
        </div>
      </div>

      {/* progress strokes fill as the 5s timer runs */}
      <div className="dao-work__progress" role="group" aria-label={m.counterLabel}>
        {projects.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            aria-label={`${m.goTo}: ${p.title}`}
            aria-current={i === index}
            className={cn("dao-work__prog", i === index && "is-active")}
            onClick={() => {
              if (i === index) return;
              lastCommit.current = 0;
              go(relOf(i) > 0 || (relOf(i) === 0 && i > index) ? 1 : -1);
            }}
          >
            {i === index && !reduced && (
              <span
                key={`${index}-${paused}`}
                className="dao-work__progfill"
                style={{ animationPlayState: paused ? "paused" : "running" }}
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      <Link href={localeHref(locale, "/work")} className="dao-work__all">
        {up(m.all)} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
