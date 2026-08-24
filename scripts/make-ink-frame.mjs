/**
 * Generates the burger hover-preview's hand-drawn ink frame
 * (public/assets/graphics/ink-frame.svg).
 *
 * Replaces the torn cream strip that used to sit across the top of the preview
 * (`.dao-nav__preview::before`, a paper-coloured torn-edge mask). The brief
 * calls for a thin, slightly imperfect, handmade frame in brand red instead -
 * the character of the drawn card frames in the brandbook - and explicitly not
 * a clean 1px rectangle or a SaaS card border.
 *
 * Technique is the same one `make-ink-ring.mjs` uses, for the same reason: a
 * single closed path per pen run, walking the outer contour forward and the
 * inner contour back, so the enclosed area IS the stroke and its weight can
 * vary along the run. A stroked `rect` has one width everywhere and a
 * border-radius joins its corners perfectly; neither reads as a pen.
 *
 * Three layers of low-frequency noise drive the gesture:
 *   - centreline wobble  the rectangle is a little out of true, the way a
 *                        hand-ruled one is
 *   - weight wobble      the nib loads and runs dry along each run
 *   - corner overshoot   each side is its own run and carries a little past
 *                        the corner, so the corners CROSS instead of joining -
 *                        the clearest signal a person drew it
 * The four sides are drawn independently, the way a hand rules a box, which is
 * also what leaves the small natural breaks at the corners.
 *
 * The viewBox is 300x190 because that is the preview's own aspect: its box is
 * `min(300px, 22vw)` by `min(190px, 14vw)`, so the ratio is ~1.57 at every
 * viewport and a single fixed-aspect mask scales without distorting the line
 * weight. (The preview is desktop-only - previews are gated on min-width 900.)
 *
 * Output is an alpha silhouette (opaque fill on transparent) so dao.css can use
 * it as a CSS mask and paint it with the brand token - the colour stays in the
 * design system, the asset stays a vector, and it costs a couple of KB.
 *
 * Deterministic: fixed-seed PRNG, so re-running reproduces it byte for byte.
 *
 * Run: node scripts/make-ink-frame.mjs
 */
import fs from "node:fs";

const OUT = "public/assets/graphics/ink-frame.svg";
const W = 300;
const H = 190;
const INSET = 7; // how far the frame sits inside the box, in viewBox units
const WEIGHT = 1.3; // mean pen weight; ~1.3px when the preview is 300px wide
const STEP = 1.5; // units between contour samples
const SEED = 20260824;

/** mulberry32 - tiny deterministic PRNG */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(SEED);

/** Smooth 1-D noise along a run: a few harmonics with random phase. */
function noise(harmonics, amp) {
  const parts = harmonics.map((k) => ({ k, phase: rnd() * Math.PI * 2, w: rnd() * 0.6 + 0.7 }));
  const norm = parts.reduce((sum, q) => sum + q.w, 0);
  return (t) => {
    let v = 0;
    for (const q of parts) v += q.w * Math.sin(q.phase + Math.PI * q.k * t);
    return (v / norm) * amp;
  };
}

const round = (v) => Math.round(v * 100) / 100;

/**
 * One pen run: a straight line from a to b, drawn as a closed contour so the
 * weight can vary along it. `over` carries the ends past the nominal corners -
 * a hand-ruled box overshoots, and those little crossings at the corners are
 * the clearest signal that a person drew it rather than a border-radius.
 */
function run(ax, ay, bx, by, overStart, overEnd, drift, weight) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // outward normal (perpendicular)
  const nx = -uy;
  const ny = ux;
  const x0 = ax - ux * overStart;
  const y0 = ay - uy * overStart;
  const total = len + overStart + overEnd;
  const steps = Math.max(6, Math.ceil(total / STEP));
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const cx = x0 + ux * total * t + nx * drift(t);
    const cy = y0 + uy * total * t + ny * drift(t);
    // taper the last couple of units at each end so the stroke dries out
    const edge = Math.min(t, 1 - t) * total;
    const fade = Math.min(1, (edge + 0.4) / 2.6);
    const half = (WEIGHT * (1 + weight(t)) * fade) / 2;
    outer.push([cx + nx * half, cy + ny * half]);
    inner.push([cx - nx * half, cy - ny * half]);
  }
  return (
    `M${round(outer[0][0])} ${round(outer[0][1])}` +
    outer
      .slice(1)
      .map(([x, y]) => `L${round(x)} ${round(y)}`)
      .join("") +
    inner
      .reverse()
      .map(([x, y]) => `L${round(x)} ${round(y)}`)
      .join("") +
    "Z"
  );
}

const L = INSET;
const R = W - INSET;
const T = INSET;
const B = H - INSET;

// Four runs, each with its own gesture and its own overshoot at each end.
// Drawn in the order a right-hander tends to: top, right, bottom, left.
const runs = [
  // top: carries a little past both corners
  run(L, T, R, T, 2.6, 4.1, noise([1, 2, 3], 1.5), noise([1, 2, 4], 0.44)),
  // right: starts high, stops just short of the bottom corner
  run(R, T, R, B, 3.4, 1.2, noise([1, 2, 3], 1.3), noise([1, 3, 5], 0.46)),
  // bottom: right to left, overshooting the left corner most
  run(R, B, L, B, 2.1, 4.6, noise([1, 2, 3], 1.55), noise([1, 2, 4], 0.42)),
  // left: bottom to top, the shortest overshoot - the hand is closing the box
  run(L, B, L, T, 3.0, 2.2, noise([1, 2, 4], 1.4), noise([1, 2, 3], 0.48)),
];

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="#000" fill-rule="nonzero">\n` +
  runs.map((d) => `  <path d="${d}"/>`).join("\n") +
  "\n</svg>\n";

fs.writeFileSync(OUT, svg);
console.log(
  `${OUT}  ${W}x${H} viewBox  ${runs.length} pen runs  ` +
    `${(Buffer.byteLength(svg) / 1024).toFixed(1)}KB`,
);
