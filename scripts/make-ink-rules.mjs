/**
 * Generates the two single-axis pen runs the Team contact sheet frames its
 * portraits with (public/assets/graphics/ink-rule-h.svg + ink-rule-v.svg).
 *
 * WHY NOT ink-frame.svg
 * ---------------------
 * `ink-frame.svg` already draws a complete four-sided hand-drawn frame, and it
 * is the right asset for the burger hover preview. But it is a SINGLE mask with
 * a fixed 300x190 viewBox, and its own generator says why: the preview is always
 * ~1.57 aspect, "so a single fixed-aspect mask scales without distorting the
 * line weight."
 *
 * A Team portrait is 4:5. Stretching a 300x190 mask into 0.8 aspect scales the
 * two axes by very different factors - at a 300px-wide card the vertical scale
 * is ~1.97 while the horizontal is 1.0 - so the top and bottom runs come out
 * roughly twice as thick as the left and right ones. The perimeter is all there
 * in the geometry, but it READS as a pair of heavy horizontal rules with sides
 * so thin they disappear. That is the "partial frame" in the review.
 *
 * THE FIX
 * -------
 * Draw one horizontal run and one vertical run, and let CSS compose four mask
 * layers from them - top and bottom stretched along X only, left and right along
 * Y only, each given a fixed pixel thickness. Every side then keeps the same
 * weight at ANY card aspect, and the frame is a complete rectangle by
 * construction rather than by hoping the scale factors match.
 *
 * The drawing technique is unchanged from make-ink-frame.mjs, deliberately: one
 * closed contour per run so the enclosed area IS the stroke and its weight can
 * vary along it; a wobbling centreline so the line is a little out of true; a
 * weight wobble so the nib loads and runs dry; and overshoot at both ends so the
 * runs CROSS at the corners instead of joining, which is the clearest signal a
 * person drew it. The two axes are seeded differently so the frame does not read
 * as the same line used four times.
 *
 * Each output is an alpha silhouette (opaque fill on transparent), so the colour
 * stays a brand token in CSS and the asset stays a vector.
 *
 * Deterministic: fixed-seed PRNG, so re-running reproduces both files byte for
 * byte.
 *
 * Run: node scripts/make-ink-rules.mjs
 */
import fs from "node:fs";

/** length of a run in viewBox units - the axis that gets stretched */
const LEN = 300;
/** the band the run wanders inside; becomes the frame thickness in CSS px */
const BAND = 6;
const WEIGHT = 1.7; // mean pen weight in viewBox units
const DRIFT = 1.3; // how far the centreline wanders off true
/**
 * How much the nib is allowed to run dry along the run. Kept low on purpose:
 * the gesture has to come from the WANDERING CENTRELINE, not from the stroke
 * thinning to nothing. At higher amplitudes the line breaks up into dashes and
 * the frame stops reading as a closed rectangle - which is exactly the
 * "partial frame" this asset exists to fix.
 */
const WEIGHT_WOBBLE = 0.26;
const STEP = 1.5; // units between contour samples

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

const round = (v) => Math.round(v * 100) / 100;

/**
 * One pen run along a single axis, drawn as a closed contour so the weight can
 * vary. `over` carries each end past the nominal corner.
 */
function run({ horizontal, rnd, over }) {
  /** Smooth 1-D noise: a few harmonics with random phase. */
  const noise = (harmonics, amp) => {
    const parts = harmonics.map((k) => ({ k, phase: rnd() * Math.PI * 2, w: rnd() * 0.6 + 0.7 }));
    const norm = parts.reduce((sum, q) => sum + q.w, 0);
    return (t) => {
      let v = 0;
      for (const q of parts) v += q.w * Math.sin(q.phase + Math.PI * q.k * t);
      return (v / norm) * amp;
    };
  };
  const drift = noise([1, 2, 3], DRIFT);
  const weight = noise([1, 2, 4], WEIGHT_WOBBLE);

  // the run travels along `LEN` and wanders across the middle of `BAND`
  const mid = BAND / 2;
  const total = LEN + over[0] + over[1];
  const steps = Math.max(8, Math.ceil(total / STEP));
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const along = -over[0] + total * t;
    const across = mid + drift(t);
    // taper the last couple of units at each end so the stroke dries out
    const edge = Math.min(t, 1 - t) * total;
    const fade = Math.min(1, (edge + 1.1) / 1.9);
    const half = (WEIGHT * (1 + weight(t)) * fade) / 2;
    if (horizontal) {
      outer.push([along, across + half]);
      inner.push([along, across - half]);
    } else {
      outer.push([across + half, along]);
      inner.push([across - half, along]);
    }
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

function emit({ file, horizontal, seed, over }) {
  const d = run({ horizontal, rnd: prng(seed), over });
  const w = horizontal ? LEN : BAND;
  const h = horizontal ? BAND : LEN;
  // the overshoot runs outside the viewBox on purpose: the corners are where the
  // runs cross, and CSS positions each layer so the crossings land on the corner
  // preserveAspectRatio="none" is REQUIRED, not cosmetic. A viewBox with the
  // default xMidYMid meet LETTERBOXES the artwork whenever the mask box has a
  // different aspect: a 300x6 run asked to fill 447x6 scales to fit the height
  // and paints 300px wide, centred, so each side stops short and the corners of
  // the frame stay open. That is precisely the "partial frame" this asset exists
  // to fix. "none" lets each run stretch along its own axis, which is the whole
  // point of a single-axis asset.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ` +
    `preserveAspectRatio="none" fill="#000" fill-rule="nonzero">\n  <path d="${d}"/>\n</svg>\n`;
  fs.writeFileSync(file, svg);
  console.log(
    `${file}  ${w}x${h} viewBox  weight ~${WEIGHT}u in a ${BAND}u band  ` +
      `${(Buffer.byteLength(svg) / 1024).toFixed(1)}KB`,
  );
}

emit({
  file: "public/assets/graphics/ink-rule-h.svg",
  horizontal: true,
  seed: 20260826,
  over: [2.4, 3.8],
});
emit({
  file: "public/assets/graphics/ink-rule-v.svg",
  horizontal: false,
  seed: 20260827,
  over: [3.1, 2.0],
});
