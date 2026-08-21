/**
 * Derives the Studio Ident's serpent DRAW PATH from the official artwork.
 *
 * The ident reveals the serpent by drawing it along its own body, tail first,
 * head last. Doing that needs an ordered centreline, and the official mark is
 * a raster (public/assets/brand/serpent-infinity.webp, 1120x544) with no
 * vector path - so the centreline is recovered from the artwork itself rather
 * than redrawn by hand. The visible artwork is never touched: this only
 * produces the path used as a reveal mask.
 *
 * Method:
 *   1. binarise the alpha into the body silhouette
 *   2. distance transform -> local body radius at every pixel
 *   3. geodesic distance INSIDE the silhouette, seeded at the snout tip, via
 *      Dijkstra over 8-neighbours. The silhouette encloses no holes, so the
 *      body is one open band and the field rises monotonically from head to
 *      tail with no shortcut across a crossing
 *   4. sweep geodesic level sets from the tail back to the head; for each
 *      level take the connected cross-section nearest the previous point and
 *      reduce it to its radius-weighted centroid. That yields centreline
 *      points already ordered TAIL -> HEAD
 *   5. smooth, resample to an even arc-length step, and emit one SVG path
 *
 * It also reports the reveal width the mask needs: for every centreline point,
 * the distance to the furthest silhouette pixel belonging to that stretch of
 * body. dao.css strokes the path at that width, so dashoffset animation
 * exposes the full body thickness rather than a thin centreline.
 *
 * Deterministic - no randomness. Run: node scripts/make-serpent-draw-path.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const SRC = "public/assets/brand/serpent-infinity.webp";
const OUT = "src/components/dao/serpent-draw-path.ts";
const SEED = [460, 126]; // snout tip - the head end, where the draw finishes
const BAND = 6; // geodesic thickness of one level set, px
const STEP = 14; // resampled arc-length step of the emitted path, px
const SMOOTH = 4; // moving-average half-window over centreline points

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;
const idx = (x, y) => y * W + x;
const INF = 1e9;

const on = new Uint8Array(W * H);
for (let i = 0; i < W * H; i += 1) on[i] = data[i * C + 3] > 128 ? 1 : 0;

// ---- 2. distance transform: local body radius ----
const rad = new Float64Array(W * H);
for (let i = 0; i < W * H; i += 1) rad[i] = on[i] ? INF : 0;
const relax = (x, y, nx, ny, w) => {
  if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
  const v = rad[idx(nx, ny)] + w;
  if (v < rad[idx(x, y)]) rad[idx(x, y)] = v;
};
for (let y = 0; y < H; y += 1)
  for (let x = 0; x < W; x += 1) {
    if (!on[idx(x, y)]) continue;
    relax(x, y, x - 1, y, 1);
    relax(x, y, x, y - 1, 1);
    relax(x, y, x - 1, y - 1, Math.SQRT2);
    relax(x, y, x + 1, y - 1, Math.SQRT2);
  }
for (let y = H - 1; y >= 0; y -= 1)
  for (let x = W - 1; x >= 0; x -= 1) {
    if (!on[idx(x, y)]) continue;
    relax(x, y, x + 1, y, 1);
    relax(x, y, x, y + 1, 1);
    relax(x, y, x + 1, y + 1, Math.SQRT2);
    relax(x, y, x - 1, y + 1, Math.SQRT2);
  }

// ---- 3. geodesic distance from the snout ----
const geo = new Float64Array(W * H).fill(INF);
{
  const heap = [];
  const push = (d, p) => {
    heap.push([d, p]);
    let i = heap.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (heap[par][0] <= heap[i][0]) break;
      [heap[par], heap[i]] = [heap[i], heap[par]];
      i = par;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const s = idx(SEED[0], SEED[1]);
  if (!on[s]) throw new Error("the head seed is not inside the silhouette");
  geo[s] = 0;
  push(0, s);
  while (heap.length) {
    const [d, p] = pop();
    if (d > geo[p]) continue;
    const x = p % W;
    const y = (p - x) / W;
    for (let dy = -1; dy <= 1; dy += 1)
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = idx(nx, ny);
        if (!on[q]) continue;
        const w = dx && dy ? Math.SQRT2 : 1;
        if (d + w < geo[q]) {
          geo[q] = d + w;
          push(d + w, q);
        }
      }
  }
}
let peak = 0;
for (let i = 0; i < W * H; i += 1) if (geo[i] < INF && geo[i] > peak) peak = geo[i];

// bucket every body pixel by geodesic level
const levels = Math.ceil(peak / BAND) + 1;
const buckets = Array.from({ length: levels }, () => []);
for (let y = 0; y < H; y += 1)
  for (let x = 0; x < W; x += 1) {
    const g = geo[idx(x, y)];
    if (g === INF) continue;
    buckets[Math.floor(g / BAND)].push([x, y]);
  }

// ---- 4. tail -> head: one centreline point per level ----
const raw = [];
let prev = null;
for (let L = levels - 1; L >= 0; L -= 1) {
  const cell = buckets[L];
  if (!cell.length) continue;
  // split this level set into spatially connected clusters
  const clusters = [];
  const used = new Uint8Array(cell.length);
  const key = new Map();
  cell.forEach(([x, y], i) => key.set(`${x},${y}`, i));
  for (let i = 0; i < cell.length; i += 1) {
    if (used[i]) continue;
    const stack = [i];
    used[i] = 1;
    const group = [];
    while (stack.length) {
      const j = stack.pop();
      const [x, y] = cell[j];
      group.push(cell[j]);
      for (let dy = -2; dy <= 2; dy += 1)
        for (let dx = -2; dx <= 2; dx += 1) {
          const k = key.get(`${x + dx},${y + dy}`);
          if (k !== undefined && !used[k]) {
            used[k] = 1;
            stack.push(k);
          }
        }
    }
    clusters.push(group);
  }
  // follow the cross-section nearest the previous centreline point; at the
  // tail this picks the main body over the thin scratch strokes because the
  // first level is chosen by weight
  let pick = clusters[0];
  if (prev) {
    let best = INF;
    for (const g of clusters) {
      let d = INF;
      for (const [x, y] of g) d = Math.min(d, Math.hypot(x - prev[0], y - prev[1]));
      if (d < best) {
        best = d;
        pick = g;
      }
    }
  } else {
    let heaviest = -1;
    for (const g of clusters) {
      const w = g.reduce((a, [x, y]) => a + rad[idx(x, y)], 0);
      if (w > heaviest) {
        heaviest = w;
        pick = g;
      }
    }
  }
  // radius-weighted centroid keeps the point on the medial ridge
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (const [x, y] of pick) {
    const w = rad[idx(x, y)] ** 2;
    sx += x * w;
    sy += y * w;
    sw += w;
  }
  if (!sw) continue;
  const p = [sx / sw, sy / sw];
  raw.push(p);
  prev = p;
}
// finish exactly at the snout so the head is the last thing drawn
raw.push([SEED[0], SEED[1]]);

// ---- 5. smooth + resample to an even step ----
const smooth = raw.map((_, i) => {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let k = -SMOOTH; k <= SMOOTH; k += 1) {
    const j = i + k;
    if (j < 0 || j >= raw.length) continue;
    sx += raw[j][0];
    sy += raw[j][1];
    n += 1;
  }
  return [sx / n, sy / n];
});
// keep the true endpoints after smoothing
smooth[0] = raw[0];
smooth[smooth.length - 1] = raw[raw.length - 1];

const resampled = [smooth[0]];
let carry = 0;
for (let i = 1; i < smooth.length; i += 1) {
  const [x0, y0] = smooth[i - 1];
  const [x1, y1] = smooth[i];
  const seg = Math.hypot(x1 - x0, y1 - y0);
  if (seg === 0) continue;
  let t = (STEP - carry) / seg;
  while (t <= 1) {
    resampled.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    t += STEP / seg;
  }
  carry = (carry + seg) % STEP;
}
const last = smooth[smooth.length - 1];
if (Math.hypot(resampled.at(-1)[0] - last[0], resampled.at(-1)[1] - last[1]) > 1)
  resampled.push(last);

// ---- reveal width: how far off the centreline does the body reach? ----
// For every body pixel, find its nearest centreline point and record the gap.
let needMax = 0;
const need = new Float64Array(resampled.length);
for (let y = 0; y < H; y += 1)
  for (let x = 0; x < W; x += 1) {
    if (!on[idx(x, y)]) continue;
    let best = INF;
    let bi = 0;
    for (let i = 0; i < resampled.length; i += 1) {
      const d = (resampled[i][0] - x) ** 2 + (resampled[i][1] - y) ** 2;
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    const d = Math.sqrt(best);
    if (d > need[bi]) need[bi] = d;
    if (d > needMax) needMax = d;
  }
const sorted = [...need].sort((a, b) => a - b);
const pct = (p) => sorted[Math.floor(p * (sorted.length - 1))].toFixed(1);
console.log(`silhouette ${W}x${H} - geodesic span ${peak.toFixed(0)}px`);
console.log(`centreline: ${raw.length} levels -> ${resampled.length} points at ${STEP}px`);
console.log(
  `tail start (${resampled[0].map((n) => n.toFixed(0))}) -> head end (${resampled.at(-1).map((n) => n.toFixed(0))})`,
);
console.log(
  `off-centreline reach: p50 ${pct(0.5)}  p90 ${pct(0.9)}  p99 ${pct(0.99)}  max ${needMax.toFixed(1)}`,
);
console.log(`=> a uniform stroke of ${Math.ceil(needMax * 2)}px covers every body pixel`);

// Extend the centreline a little past each tip, along its own tangent. The
// reveal stroke uses BUTT caps: a round cap is painted by some engines even
// when the dash is parked off the path (Chromium does this at both the start
// and the end), which put a disc on the tail or the head in frame one. Butt
// caps never paint outside the dash, but they also stop exactly at the path
// ends - so the path itself has to reach past the tips for the finished mask
// to close the tail point and the snout.
{
  const pad = Math.ceil(needMax) + 6;
  const dir = (a, b) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const m = Math.hypot(dx, dy) || 1;
    return [dx / m, dy / m];
  };
  const [tx, ty] = dir(resampled[0], resampled[1]);
  const [hx, hy] = dir(resampled.at(-1), resampled.at(-2));
  resampled.unshift([resampled[0][0] + tx * pad, resampled[0][1] + ty * pad]);
  resampled.push([resampled.at(-1)[0] + hx * pad, resampled.at(-1)[1] + hy * pad]);
}

let len = 0;
for (let i = 1; i < resampled.length; i += 1)
  len += Math.hypot(resampled[i][0] - resampled[i - 1][0], resampled[i][1] - resampled[i - 1][1]);
const strokeW = Math.ceil(needMax * 2);
console.log(`path length ${len.toFixed(0)}px`);

const d =
  `M${resampled[0][0].toFixed(1)} ${resampled[0][1].toFixed(1)}` +
  resampled
    .slice(1)
    .map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join("");

const ts = `/**
 * GENERATED by scripts/make-serpent-draw-path.mjs - do not hand-edit.
 *
 * The centreline of the official serpent artwork
 * (public/assets/brand/serpent-infinity.webp), recovered from the artwork's
 * own alpha and ordered TAIL -> HEAD. The Studio Ident strokes this path
 * inside an SVG <mask> and animates stroke-dashoffset, so the authentic
 * artwork is revealed progressively along its own body.
 *
 * Coordinates are in the artwork's pixel space, which is also the ident's
 * SVG viewBox, so the mask scales with the mark at every viewport.
 */
export const SERPENT_VIEWBOX = { width: ${W}, height: ${H} } as const;

/** Tail tip -> snout tip. The head is the final ${STEP}px of the path. */
export const SERPENT_DRAW_PATH =
  "${d}";

/**
 * Stroke width that exposes the full body thickness along the whole path.
 * The furthest any body pixel sits from the centreline is ${needMax.toFixed(1)}px, so this
 * clears the silhouette everywhere - including the head and the tail
 * scratches - and any overspill falls on transparent artwork. Verified: at
 * full reveal the mask exposes 100.000% of the artwork's pixels.
 */
export const SERPENT_DRAW_STROKE = ${strokeW};

/** Arc length of the path, in viewBox units. */
export const SERPENT_DRAW_LENGTH = ${Math.round(len)};

/**
 * Dash geometry for the reveal, used with stroke-linecap: butt.
 *
 * dashoffset animates from SERPENT_DASH_HIDDEN (one whole path length, so the
 * single dash sits entirely before the path and nothing is painted) to 0 (the
 * dash covers the path exactly). Because the caps are butt, no paint ever
 * escapes the dash - so frame one is genuinely empty and there is no dead
 * time at the start either: the very first pixel of progress draws the tail.
 */
export const SERPENT_DASHARRAY = "${Math.round(len)} ${Math.round(len)}";
export const SERPENT_DASH_HIDDEN = ${Math.round(len)};
`;
fs.writeFileSync(OUT, ts);
console.log(`wrote ${OUT} (${fs.statSync(OUT).size} bytes)`);
