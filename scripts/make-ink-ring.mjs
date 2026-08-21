/**
 * Generates the Studio Introduction's hand-drawn ink ring
 * (public/assets/graphics/ink-ring.svg).
 *
 * Replaces the old `border: 1px dashed` orbit path. The brief calls for a
 * continuous black ink/brush ring: an imperfect circular stroke with subtly
 * irregular thickness and occasional dry-brush roughness - one clear
 * circular gesture, light enough not to compete with the statement, and
 * emphatically not mathematically sterile.
 *
 * Technique: a single closed SVG path per brush segment. Each segment walks
 * the outer contour forward and the inner contour back, so the enclosed area
 * IS the stroke and its thickness can vary freely along the arc - something
 * a stroked circle with one width cannot do.
 *
 * Two layers of low-frequency noise drive the gesture:
 *   - radius wobble   the circle is slightly out of round and off-centre,
 *                     the way a hand-drawn one is
 *   - weight wobble   the brush loads and runs dry around the sweep, from
 *                     hairline to a few times the mean weight
 * A handful of gaps break the ring where the brush lifted; the segment ends
 * taper to nothing so they read as dry-brush, not as cut tube ends.
 *
 * Output is an alpha silhouette (opaque fill on transparent), so dao.css can
 * use it as a CSS mask and paint it with the ink token - the colour stays in
 * the design system and the asset stays a vector (crisp at every viewport,
 * no raster, ~4KB).
 *
 * Deterministic: a fixed-seed PRNG, so re-running reproduces the artwork
 * byte for byte.
 *
 * Run: node scripts/make-ink-ring.mjs
 */
import fs from "node:fs";

const OUT = "public/assets/graphics/ink-ring.svg";
const SIZE = 1000; // viewBox units
const C = SIZE / 2;
const R = 486; // mean radius - sits just inside the box like the old border
const WEIGHT = 2.9; // mean stroke weight in viewBox units (~2.4px at 840px)
const STEP = 1.1; // degrees between contour samples
const SEED = 20260821;

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

/**
 * Sum of a few sine harmonics with random phase - smooth, seamless around
 * the full turn (integer frequencies), and cheap. amp is the peak deviation.
 */
function wobbler(freqs, amp) {
  const phases = freqs.map(() => rnd() * Math.PI * 2);
  const weights = freqs.map(() => 0.5 + rnd());
  const norm = weights.reduce((a, b) => a + b, 0);
  return (deg) => {
    const t = (deg * Math.PI) / 180;
    let v = 0;
    freqs.forEach((f, i) => {
      v += weights[i] * Math.sin(f * t + phases[i]);
    });
    return (v / norm) * amp;
  };
}

// the circle is a little out of round (low harmonics) with finer tremble on top
const wobbleR = wobbler([2, 3, 5, 9], 7.5);
// the brush loads and runs dry around the sweep
const wobbleW = wobbler([1, 2, 3, 6, 11], 0.62);
// Each edge of the stroke gets its OWN fine tremble. Without this the two
// contours stay perfectly parallel and the ring reads as a vector annulus;
// independent high-frequency noise is what makes a brush edge look ragged.
const edgeOuter = wobbler([17, 29, 43], 0.34);
const edgeInner = wobbler([19, 31, 47], 0.34);
// and the whole gesture is very slightly off-centre, as a hand-drawn one is
const OFF_X = 2.4;
const OFF_Y = -1.8;

const radiusAt = (deg) => R + wobbleR(deg);
/** stroke weight at an angle: mean, modulated, never quite vanishing */
const weightAt = (deg) => WEIGHT * Math.max(0.22, 1 + wobbleW(deg));

/**
 * Where the brush lifted. Each gap has a start angle and a span; the arcs
 * either side taper to nothing across TAPER degrees so the break reads as
 * dry brush rather than a cut pipe.
 */
const GAPS = [
  { at: 47, span: 9 },
  { at: 143, span: 5.5 },
  { at: 221, span: 13 },
  { at: 309, span: 4 },
];
const TAPER = 10;

/** Segments between the gaps, as [startDeg, endDeg] running forward. */
function segments() {
  const sorted = [...GAPS].sort((a, b) => a.at - b.at);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const from = sorted[i].at + sorted[i].span;
    const next = sorted[(i + 1) % sorted.length];
    let to = next.at;
    if (to <= from) to += 360;
    out.push([from, to]);
  }
  return out;
}

const pt = (deg, r) => {
  const t = (deg * Math.PI) / 180;
  return [C + OFF_X + Math.cos(t) * r, C + OFF_Y + Math.sin(t) * r];
};
const f = (n) =>
  n
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");

/** One closed path: out along the outer contour, back along the inner one. */
function segmentPath([from, to]) {
  const span = to - from;
  const samples = Math.max(6, Math.round(span / STEP));
  const outer = [];
  const inner = [];
  for (let i = 0; i <= samples; i += 1) {
    const deg = from + (span * i) / samples;
    // taper the weight to zero at both ends of the segment
    const dFrom = deg - from;
    const dTo = to - deg;
    const edge = Math.min(dFrom, dTo);
    const taper = edge >= TAPER ? 1 : Math.sin(((edge / TAPER) * Math.PI) / 2) ** 1.6;
    const half = (weightAt(deg) * taper) / 2;
    const r = radiusAt(deg);
    // the edge tremble scales with the taper too, so it dies out with the
    // stroke instead of leaving specks past the end of a segment
    outer.push(pt(deg, r + half + edgeOuter(deg) * taper));
    inner.push(pt(deg, r - half - edgeInner(deg) * taper));
  }
  inner.reverse();
  const d = [`M${f(outer[0][0])} ${f(outer[0][1])}`];
  for (let i = 1; i < outer.length; i += 1) d.push(`L${f(outer[i][0])} ${f(outer[i][1])}`);
  for (const p of inner) d.push(`L${f(p[0])} ${f(p[1])}`);
  d.push("Z");
  return d.join("");
}

const paths = segments()
  .map((s) => `  <path d="${segmentPath(s)}"/>`)
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="#000" fill-rule="nonzero">
${paths}
</svg>
`;

fs.writeFileSync(OUT, svg);
const bytes = fs.statSync(OUT).size;
console.log(`${OUT}  ${bytes} bytes  (${(bytes / 1024).toFixed(1)} KB)`);
console.log(`mean radius ${R} / mean weight ${WEIGHT} / ${GAPS.length} dry-brush gaps`);
