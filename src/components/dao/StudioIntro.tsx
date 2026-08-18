"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { up } from "@/lib/cn";
import { useInViewOnce, usePrefersReducedMotion } from "./hooks";

/**
 * Act 02 - Studio Introduction, v7 orbit v2 (contract #7, states O1-O4).
 * The orbital population is brandbook-only (§05): service names on paper
 * chips, production codes in Glacier and brand glyphs (moon, sun, swallow,
 * curled serpent mark, spiral, star, rosette) - no project imagery here.
 * Scroll maps to rotation (-20°..+20°) AND scale (1.4 -> 1.0) with 0.08
 * lerp; fragments counter-rotate to stay legible; past 70% they recede to
 * 45% opacity and drift 20px outward while the central statement takes
 * focus. Settled scene keeps only an ambient 0.2°/s drift. Scroll is never
 * hijacked. Mobile keeps the 2b constellation band. Reduced motion:
 * static ring at scale 1, statement fades.
 */
export function StudioIntro({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.dao.intro;
  const sectionRef = useInViewOnce<HTMLElement>(0.2);
  const orbitRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    let rot = 0;
    let scale = 1.4;
    let foc = 0;
    let targetRot = -20;
    let targetScale = 1.4;
    let targetFoc = 0;
    let progress = 0;
    let running = false;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      // O4: settled scene keeps only a slow ambient drift (~0.2°/s sine)
      const ambient = progress > 0.96 ? Math.sin((now - start) / 5000) * 1.2 : 0;
      rot += (targetRot + ambient - rot) * 0.08;
      scale += (targetScale - scale) * 0.08;
      foc += (targetFoc - foc) * 0.08;
      const orbit = orbitRef.current;
      if (orbit) {
        orbit.style.setProperty("--spin", `${rot.toFixed(3)}deg`);
        orbit.style.setProperty("--oscale", scale.toFixed(4));
      }
      section.style.setProperty("--drift", `${(rot / 20) * 12}px`);
      // §04: the central statement moves into focus (small travel + scale
      // development) as the orbit hands the scene over to it.
      section.style.setProperty("--tfoc", foc.toFixed(4));
      // §Perf phase 2B convergence gate: keep scheduling frames only while
      // the lerp is still visibly travelling, or while the O4 ambient drift
      // owns the settled scene (progress > 0.96 - the sine keeps the target
      // moving there, exactly as approved). Once converged below that
      // threshold the loop goes idle; onScroll re-arms it on the next input.
      // Thresholds are sub-visual: 0.01deg rotation, 0.001 scale, 0.005 focus.
      const converged =
        Math.abs(targetRot + ambient - rot) <= 0.01 &&
        Math.abs(targetScale - scale) <= 0.001 &&
        Math.abs(targetFoc - foc) <= 0.005;
      if (running && (progress > 0.96 || !converged)) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      progress = p;
      targetRot = -20 + p * 40;
      targetScale = 1.4 - Math.min(1, p * 1.6) * 0.4;
      targetFoc = Math.min(1, Math.max(0, (p - 0.16) / 0.42));
      section.classList.toggle("is-focused", p > 0.42);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      running = entry?.isIntersecting ?? false;
      if (running) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        if (!raf) raf = requestAnimationFrame(tick);
      } else {
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(section);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, sectionRef]);

  const statementGroups = splitGroups(m.statement, 3);

  return (
    <section
      ref={sectionRef}
      className="dao-intro"
      data-dao-scene="light"
      id="studio"
      aria-label={m.act}
    >
      <div className="dao-grain" aria-hidden="true" />
      <div className="dao-label dao-intro__corner dao-intro__corner--tl">{m.act}</div>

      {/* dashed orbit path + fragment ring (desktop / tablet) */}
      <div className="dao-intro__ring" aria-hidden="true" />
      <div
        className="dao-intro__orbit"
        ref={orbitRef}
        style={{ transform: "rotate(var(--spin, 0deg)) scale(var(--oscale, 1))" }}
        aria-hidden="true"
      >
        {/* §05: the orbital population is brandbook-only - no project
            imagery in this section. Glyphs, chips and codes compose the
            ring. */}
        <Sat a={0}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/moon.webp)",
              width: 46,
              height: 46,
              background: "var(--dao-ink)",
              opacity: 0.85,
            }}
          />
        </Sat>
        <Sat a={36}>
          <span className="dao-intro__code">PRJ-01 · 24 FPS</span>
        </Sat>
        <Sat a={64}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/sun.webp)",
              width: 52,
              height: 52,
              background: "var(--dao-gold)",
            }}
          />
        </Sat>
        <Sat a={96}>
          <span
            className="dao-intro__chip"
            style={{ background: "var(--dao-yellow)", color: "var(--dao-ink)" }}
          >
            {up(m.chipPhotography)}
          </span>
        </Sat>
        <Sat a={134}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/swallow.webp)",
              width: 66,
              height: 66,
              background: "var(--dao-blue)",
            }}
          />
        </Sat>
        {/* §08: the official curled serpent brand mark (the asset behind the
            global snake + 8TH STATE chip) replaces the former white paper
            scrap between the swallow and the Studio Lab chip - ink on the
            cream ground (the approved light-ground treatment), quiet, with
            the same orbit motion as its neighbours */}
        <Sat a={166}>
          <span className="dao-intro__serpent dao-mask" />
        </Sat>
        <Sat a={196}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/spiral.webp)",
              width: 38,
              height: 38,
              background: "var(--dao-brown)",
            }}
          />
        </Sat>
        <Sat a={216}>
          <span
            className="dao-intro__chip"
            style={{ background: "var(--dao-green)", color: "var(--dao-ink)" }}
          >
            {up(m.chipLab)}
          </span>
        </Sat>
        <Sat a={244}>
          <span className="dao-intro__code">2026</span>
        </Sat>
        <Sat a={268}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/rosette.webp)",
              width: 56,
              height: 56,
              background: "var(--dao-red)",
              opacity: 0.9,
            }}
          />
        </Sat>
        <Sat a={296}>
          <span
            className="dao-mask"
            style={{
              ["--m" as string]: "url(/assets/graphics/star.webp)",
              width: 42,
              height: 42,
              background: "var(--dao-red)",
            }}
          />
        </Sat>
        <Sat a={326}>
          <span
            className="dao-intro__chip"
            style={{ background: "#d3cdc5", color: "var(--dao-ink)" }}
          >
            {up(m.chipFilm)}
          </span>
        </Sat>
      </div>

      {/* 390 - constellation band (2b) kept: ±12px scroll drift */}
      <div className="dao-intro__constellation" aria-hidden="true">
        <div className="dao-intro__ring--m" />
        <div className="dao-intro__ring--m dao-intro__ring--m2" />
        <span
          className="dao-intro__chip"
          style={{
            position: "absolute",
            left: 24,
            top: 92,
            background: "var(--dao-yellow)",
            color: "var(--dao-ink)",
            transform: "translateY(var(--drift, 0px))",
          }}
        >
          {up(m.chipPhotography)}
        </span>
        <span
          className="dao-mask"
          style={{
            ["--m" as string]: "url(/assets/graphics/swallow.webp)",
            right: 36,
            top: 66,
            width: 44,
            height: 44,
            background: "var(--dao-blue)",
            transform: "translateY(calc(var(--drift, 0px) * -1))",
          }}
        />
        <span
          className="dao-mask"
          style={{
            ["--m" as string]: "url(/assets/graphics/sun.webp)",
            right: 70,
            top: 150,
            width: 28,
            height: 28,
            background: "var(--dao-gold)",
            transform: "translateY(var(--drift, 0px))",
          }}
        />
        <span
          className="dao-mask"
          style={{
            ["--m" as string]: "url(/assets/graphics/star.webp)",
            left: 30,
            bottom: 120,
            width: 22,
            height: 22,
            background: "var(--dao-red)",
            transform: "translateY(calc(var(--drift, 0px) * -1))",
          }}
        />
        <span
          className="dao-intro__code"
          style={{
            position: "absolute",
            right: 24,
            bottom: 86,
            transform: "translateY(var(--drift, 0px))",
          }}
        >
          PRJ-01 · 24 FPS
        </span>
      </div>

      {/* central statement - printed logo mark (locked placement) + masked rise */}
      <div className="dao-intro__center">
        <Image
          src="/assets/brand/8th-state-logo-mark.png"
          alt="8th State Production mark"
          width={312}
          height={312}
          className="dao-intro__logomark"
          style={{ height: "auto" }}
        />
        <p className="dao-intro__statement">
          {statementGroups.map((group, i) => (
            <span key={i} className="dao-rise">
              <span style={{ ["--d" as string]: `${i * 120}ms` }}>{group}</span>
            </span>
          ))}
        </p>
        <div className="dao-intro__rule dao-fade" style={{ ["--d" as string]: "350ms" }}>
          <span className="dao-intro__stroke dao-mask--cover" aria-hidden="true" />
          {/* client-side Link, never a raw <a>: a raw anchor forces a full
              document load, which replays the Studio Ident (§03/§10) */}
          <Link href={localeHref(locale, "/studio")} className="dao-intro__cta">
            {up(m.cta)} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Sat({ a, children }: { a: number; children: React.ReactNode }) {
  return (
    <div className="dao-intro__sat" style={{ ["--a" as string]: `${a}deg` }}>
      <div>{children}</div>
    </div>
  );
}

/** Split a statement into n word groups for the masked line rise. */
function splitGroups(text: string, n: number): string[] {
  const words = text.split(" ");
  const per = Math.ceil(words.length / n);
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += per) {
    groups.push(words.slice(i, i + per).join(" ") + " ");
  }
  return groups;
}
