"use client";

import { useEffect, useRef } from "react";

/**
 * THE END OF THE REEL.
 *
 * The showreel does not cut to the studio; the television it is playing on is
 * switched off. Darkness closes from top and bottom, the image squashes toward
 * the middle, a horizontal line of light holds for a moment, contracts to a
 * single point and goes out - and out of that darkness the paper title card
 * emerges: 8TH STATE / PRODUCTION / PRESENTS.
 *
 * Scrolling back up runs the tube in reverse: the point of light returns, the
 * beam opens, the darkness retracts and the film is simply there again. It is
 * not a replay of the title card - the way back is the set coming on, not the
 * credits running backwards.
 *
 * DRIVEN BY SCROLL, NOT BY TIME. The whole thing is one progress value read
 * from the scroll position, so it is reversible at any point: turning around
 * halfway continues the choreography already on screen rather than restarting
 * it. The numbers below are the approved ones and are not to be re-tuned.
 *
 * ADAPTED, NOT TRANSPLANTED. The approved prototype carried its own copy of the
 * yellow studio field as a final layer. Here that layer is the real
 * StudioIntro, which follows this act on the page, so the stage ends on the
 * paper card and the page scrolls on into the studio itself. Likewise the reel
 * inside the tube is the real Showreel, passed in as children: this component
 * sets CSS variables and the existing showreel CSS consumes them, so no part of
 * the showreel is duplicated or rewritten.
 */

export function EndOfReel({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const w = wrap.current;
    const st = stage.current;
    if (!w || !st) return;

    // Reduced motion gets no tube at all: the variables are left at their
    // resting values, which is the plain showreel followed by the plain card.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      st.style.setProperty("--paperO", "0");
      return;
    }

    let mode: "forward" | "return" = "forward";
    let raf = 0;
    let smoothed = 0;
    let last = 0;
    let live = true;

    const set = (k: string, v: string | number) => st.style.setProperty("--" + k, String(v));
    const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

    /** CRT OFF -> darkness -> the paper card */
    const forward = (p: number) => {
      const R = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
      const collapse = ease(R(0.07, 0.27));
      set("metaO", (1 - R(0.02, 0.08)).toFixed(3));
      set("mono", (R(0.06, 0.24) * 0.5).toFixed(3));
      set("squash", (1 - collapse * 0.14).toFixed(4));
      set("barH", (collapse * 50).toFixed(2));
      set("scanO", (R(0.09, 0.2) * (1 - R(0.3, 0.4)) * 0.5).toFixed(3));
      set("beamO", (R(0.2, 0.27) * (1 - R(0.36, 0.42))).toFixed(3));
      set("beamW", (1 - ease(R(0.28, 0.4)) * 0.95).toFixed(4));
      set("glowO", (R(0.36, 0.41) * (1 - R(0.46, 0.53))).toFixed(3));
      set("glowS", (1 - R(0.42, 0.53) * 0.75).toFixed(4));
      // a brief dark breath, then the paper emerges FROM the darkness - it is
      // never wiped over the image
      set("paperO", ease(R(0.58, 0.68)).toFixed(3));
      set("starA", ease(R(0.6, 0.68)).toFixed(3));
      set("snake", ease(R(0.62, 0.8)).toFixed(4));
      set("sunA", ease(R(0.66, 0.74)).toFixed(3));
      set("birdA", ease(R(0.68, 0.76)).toFixed(3));
      set("t1", ease(R(0.7, 0.82)).toFixed(4));
      set("t2", ease(R(0.75, 0.87)).toFixed(4));
      set("t3", ease(R(0.8, 0.92)).toFixed(3));
    };

    /** the studio -> darkness -> CRT ON -> the film returns. No card replay. */
    const reverse = (p: number) => {
      const r = 1 - p;
      const R = (a: number, b: number) => Math.min(1, Math.max(0, (r - a) / (b - a)));
      // The card LEAVES with the paper and never re-typesets: everything on it
      // is tied to the same drain, so it can only ever decrease on the way
      // back. The approved prototype hard-zeroed these instead, which it could
      // afford because its own copy of the yellow studio field was covering
      // them; here the studio is the real section further down the page, so
      // zeroing them at the top of the zone would blank the card in view.
      const leave = 1 - ease(R(0, 0.2));
      set("paperO", leave.toFixed(3));
      set("t1", leave.toFixed(4));
      set("t2", leave.toFixed(4));
      set("t3", leave.toFixed(3));
      set("snake", leave.toFixed(4));
      set("sunA", leave.toFixed(3));
      set("birdA", leave.toFixed(3));
      set("starA", leave.toFixed(3));
      // darkness 0.2-0.28, then the tube comes alive
      set("glowO", (R(0.26, 0.33) * (1 - R(0.44, 0.52))).toFixed(3));
      set("glowS", (0.3 + R(0.3, 0.45) * 0.7).toFixed(4));
      set("beamO", (R(0.42, 0.5) * (1 - R(0.62, 0.74))).toFixed(3));
      set("beamW", (0.06 + ease(R(0.4, 0.56)) * 0.94).toFixed(4));
      const openUp = ease(R(0.54, 0.88));
      set("barH", (50 * (1 - openUp)).toFixed(2));
      set("squash", (0.86 + openUp * 0.14).toFixed(4));
      set("scanO", (R(0.52, 0.62) * (1 - R(0.84, 0.94)) * 0.5).toFixed(3));
      set("mono", (0.5 * (1 - ease(R(0.6, 0.92)))).toFixed(3));
      set("metaO", R(0.88, 1).toFixed(3));
    };

    /**
     * The mode flips only at the two ENDS of the zone, so turning around
     * halfway continues the choreography that is already on screen instead of
     * swapping to the other one mid-frame.
     */
    const write = (p: number) => {
      if (p > 0.985 && mode === "forward") mode = "return";
      if (p < 0.015 && mode === "return") mode = "forward";
      set("mob", window.innerWidth <= 720 ? 1 : 0);
      if (mode === "forward") forward(p);
      else reverse(p);
    };

    const progress = () => {
      const r = w.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      if (travel <= 0) return 0;
      return Math.min(1, Math.max(0, -r.top / travel));
    };

    const step = () => {
      const now = performance.now();
      const dt = last ? now - last : 16.7;
      last = now;
      const target = progress();
      // a light critically-damped follow, so a trackpad flick reads as motion
      // rather than as a jump, and so reversing is continuous
      const k = 1 - Math.pow(1 - 0.14, Math.min(dt, 400) / 16.7);
      smoothed += (target - smoothed) * k;
      if (Math.abs(target - smoothed) < 0.0004) smoothed = target;
      write(smoothed);
    };

    const loop = () => {
      if (live) step();
      raf = requestAnimationFrame(loop);
    };
    step();
    raf = requestAnimationFrame(loop);

    // the rest of the site gates its loops on intersection; this does too
    const io = new IntersectionObserver(
      ([e]) => {
        live = e ? e.isIntersecting : true;
        if (live) {
          last = 0;
          step();
        }
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(w);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div className="dao-eor" ref={wrap}>
      <div className="dao-eor__stage" ref={stage}>
        {/* LAYER 1 - the moving image. The real Showreel: it reads --squash,
            --mono and --beamO from this stage through its own CSS. */}
        <div className="dao-eor__reel">{children}</div>

        {/* LAYER 2 - the tube's darkness, closing from top and bottom */}
        <div className="dao-eor__bar dao-eor__bar--top" aria-hidden="true" />
        <div className="dao-eor__bar dao-eor__bar--bottom" aria-hidden="true" />

        {/* LAYER 3 - the horizontal light: core, bloom and hot centre.
            The waver animation lives on the CHILDREN. It animates opacity, and
            on the element that carries opacity: var(--beamO) it would override
            the variable and leave the beam faintly lit over a restored reel. */}
        <div className="dao-eor__beam" aria-hidden="true">
          <div className="dao-eor__beamcore" />
          <div className="dao-eor__beambloom" />
          <div className="dao-eor__beamhot" />
        </div>

        {/* LAYER 3b - the last light in the tube. Same rule, same reason: the
            outer element owns --glowO, the animation sits on the child. This is
            the white dot that used to survive the reverse transition. */}
        <div className="dao-eor__glow" aria-hidden="true">
          <div className="dao-eor__glowin" />
        </div>

        {/* LAYER 4 - the paper world, emerging from the darkness */}
        <div className="dao-eor__paper">
          <div className="dao-grain--strong" aria-hidden="true" />

          {/* the studio's own serpent - the same serpent-mark the burger sheet
              draws - entering from the LEFT, mirrored, and cropped by a mask
              that travels with --snake so it is drawn on rather than faded in */}
          <div className="dao-eor__snake" aria-hidden="true">
            <span className="dao-eor__snakeink" />
          </div>

          <span className="dao-eor__sun" aria-hidden="true" />
          <span className="dao-eor__bird dao-eor__bird--l" aria-hidden="true" />
          <span className="dao-eor__bird dao-eor__bird--r" aria-hidden="true" />

          <span className="dao-eor__star dao-eor__star--a" aria-hidden="true" />
          <span className="dao-eor__star dao-eor__star--b" aria-hidden="true" />
          <span className="dao-eor__star dao-eor__star--c" aria-hidden="true" />
          <span className="dao-eor__star dao-eor__star--d" aria-hidden="true" />
          <span className="dao-eor__star dao-eor__star--e" aria-hidden="true" />

          <div className="dao-eor__card">
            <span className="dao-eor__line">
              <span className="dao-eor__t1">8TH STATE</span>
            </span>
            <span className="dao-eor__line">
              <span className="dao-eor__t2">PRODUCTION</span>
            </span>
            <div className="dao-eor__t3">
              <span className="dao-eor__rule" aria-hidden="true" />
              <span className="dao-eor__presents">PRESENTS</span>
              <span className="dao-eor__rule" aria-hidden="true" />
            </div>
          </div>

          <div className="dao-eor__foot dao-eor__foot--l" aria-hidden="true">
            TBILISI, GEORGIA
          </div>
          <div className="dao-eor__foot dao-eor__foot--r" aria-hidden="true">
            MMXXVI
          </div>
        </div>
      </div>
    </div>
  );
}
