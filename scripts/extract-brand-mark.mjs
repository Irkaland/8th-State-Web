/**
 * Derives the Studio Ident's three animated brand layers from the OFFICIAL
 * 8th State mark artwork - no redrawing, no reinterpretation.
 *
 * Source of truth: public/assets/brand/8th-state-logo-mark.png (3137x1595,
 * RGBA) - the approved serpent/infinity lockup: a RED serpent whose left
 * loop holds a WHITE celestial sun and whose right loop holds a BLACK one.
 *
 * The ident animates the three elements independently (serpent reveals from
 * its own centre, white sun descends, black sun rises), so the single
 * flattened lockup has to be separated into layers. Alpha-connected-
 * component labelling finds exactly three shapes in the artwork:
 *
 *   0  serpent + eye + tail flicks   3015x1464 @ (61,59)    avg #d14029
 *   1  left  celestial sun            526x579  @ (571,480)  avg #d3cdc6
 *   2  right celestial sun            526x579  @ (2039,524) avg #242424
 *
 * Outputs (public/assets/brand/):
 *   serpent-infinity.webp   full-colour RGBA - the authentic printed red and
 *                           the eye survive, so the artwork is used as-is
 *   celestial-sun.webp      alpha-only silhouette of the sun, painted at run
 *                           time with the brand tokens (--dao-paper for the
 *                           left sun, --dao-ink for the right) through the
 *                           existing .dao-mask architecture
 *
 * Also prints the composition geometry (sun centres as percentages of the
 * serpent box) that dao.css uses to place both suns inside their loops.
 *
 * Run: node scripts/extract-brand-mark.mjs
 */
import sharp from "sharp";

const SRC = "public/assets/brand/8th-state-logo-mark.png";
const OUT = "public/assets/brand";
const ALPHA = 40; // solid-enough to belong to a shape
const SERPENT_W = 1120; // ident renders at max 560px CSS -> 1120px @2x
const SUN_W = 208; // ident renders at max ~98px CSS -> 196px @2x

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// ---- alpha-connected components (8-neighbour, iterative) ----
const label = new Int32Array(W * H).fill(-1);
const stack = new Int32Array(W * H);
const comps = [];
for (let seed = 0; seed < W * H; seed += 1) {
  if (label[seed] !== -1) continue;
  if (data[seed * C + 3] < ALPHA) {
    label[seed] = -2;
    continue;
  }
  const id = comps.length;
  const c = { id, n: 0, x0: W, y0: H, x1: -1, y1: -1, r: 0, g: 0, b: 0 };
  let sp = 0;
  stack[sp++] = seed;
  label[seed] = id;
  while (sp > 0) {
    const p = stack[--sp];
    const x = p % W;
    const y = (p - x) / W;
    c.n += 1;
    c.r += data[p * C];
    c.g += data[p * C + 1];
    c.b += data[p * C + 2];
    if (x < c.x0) c.x0 = x;
    if (y < c.y0) c.y0 = y;
    if (x > c.x1) c.x1 = x;
    if (y > c.y1) c.y1 = y;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (label[q] !== -1) continue;
        if (data[q * C + 3] < ALPHA) {
          label[q] = -2;
          continue;
        }
        label[q] = id;
        stack[sp++] = q;
      }
    }
  }
  comps.push(c);
}

if (comps.length !== 3) {
  throw new Error(`expected 3 shapes in the official mark, found ${comps.length}`);
}

const hue = (c) => {
  const r = c.r / c.n;
  const g = c.g / c.n;
  const b = c.b / c.n;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return { r, g, b, sat: mx === 0 ? 0 : (mx - mn) / mx, lum: (r + g + b) / 3 };
};
const serpent = comps.find((c) => hue(c).sat > 0.3 && hue(c).r > hue(c).g);
const suns = comps.filter((c) => c !== serpent).sort((a, b) => a.x0 - b.x0);
const [sunL, sunR] = suns;
if (!serpent || !sunL || !sunR) throw new Error("could not classify the mark's shapes");

const box = (c) => ({
  left: c.x0,
  top: c.y0,
  width: c.x1 - c.x0 + 1,
  height: c.y1 - c.y0 + 1,
});

// ---- layer 1: the serpent, full colour, everything else erased ----
const sb = box(serpent);
const serpentRaw = Buffer.alloc(sb.width * sb.height * 4);
for (let y = 0; y < sb.height; y += 1) {
  for (let x = 0; x < sb.width; x += 1) {
    const src = ((y + sb.top) * W + (x + sb.left)) * C;
    const dst = (y * sb.width + x) * 4;
    if (label[(y + sb.top) * W + (x + sb.left)] !== serpent.id) continue;
    serpentRaw[dst] = data[src];
    serpentRaw[dst + 1] = data[src + 1];
    serpentRaw[dst + 2] = data[src + 2];
    serpentRaw[dst + 3] = data[src + 3];
  }
}
await sharp(serpentRaw, { raw: { width: sb.width, height: sb.height, channels: 4 } })
  .resize({ width: SERPENT_W })
  .webp({ quality: 74, alphaQuality: 100, effort: 6, smartSubsample: true })
  .toFile(`${OUT}/serpent-infinity.webp`);

// ---- layer 2: the celestial sun silhouette (alpha only) ----
// Both loops carry the same drawing (IoU 0.99); the left instance is the
// silhouette source and the fill colour is applied by CSS.
const lb = box(sunL);
const sunRaw = Buffer.alloc(lb.width * lb.height * 4);
for (let y = 0; y < lb.height; y += 1) {
  for (let x = 0; x < lb.width; x += 1) {
    const p = (y + lb.top) * W + (x + lb.left);
    const dst = (y * lb.width + x) * 4;
    sunRaw[dst] = 255;
    sunRaw[dst + 1] = 255;
    sunRaw[dst + 2] = 255;
    sunRaw[dst + 3] = label[p] === sunL.id ? data[p * C + 3] : 0;
  }
}
await sharp(sunRaw, { raw: { width: lb.width, height: lb.height, channels: 4 } })
  .resize({ width: SUN_W })
  .webp({ quality: 60, alphaQuality: 100, effort: 6 })
  .toFile(`${OUT}/celestial-sun.webp`);

// ---- composition geometry, as percentages of the serpent box ----
const pct = (c) => ({
  cx: (((c.x0 + c.x1) / 2 - sb.left) / sb.width) * 100,
  cy: (((c.y0 + c.y1) / 2 - sb.top) / sb.height) * 100,
  w: ((c.x1 - c.x0 + 1) / sb.width) * 100,
});
const f = (n) => n.toFixed(3);
console.log(`serpent   box ${sb.width}x${sb.height}  aspect ${f(sb.width / sb.height)}`);
for (const [name, c] of [
  ["left  white sun", sunL],
  ["right black sun", sunR],
]) {
  const p = pct(c);
  console.log(
    `${name}  centre ${f(p.cx)}% / ${f(p.cy)}%  width ${f(p.w)}%  ` +
      `aspect ${f(box(c).width / box(c).height)}`,
  );
}
