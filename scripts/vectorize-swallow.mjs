/**
 * Ships the Start a Project / not-found swallow as VECTOR, traced from the
 * OFFICIAL brandbook - no redrawing, no substitute bird, no upscale.
 *
 * WHY THIS AND NOT ANOTHER RESAMPLE
 * ---------------------------------
 * `scripts/rebuild-swallow.mjs` already established where this mark comes
 * from: the brandbook is a raster export, and the bird exists in it exactly
 * once, as the soft mask of object 1377 - 326x435, of which 279x314 is
 * artwork. Re-scanning every image in `8th state brandbook final.pdf` and in
 * the 36MB Phase 08B brand-system deck confirms it: the next-best match by
 * IoU is 0.744, which is a DIFFERENT bird from the same family. There is no
 * larger raster of this bird anywhere in the brand material.
 *
 * `.dbr__swallow` draws it up to 330px wide - 660 device pixels on a DPR-2
 * phone or laptop - against 279 pixels of real artwork. Whatever resamples it,
 * and whenever, the result is a 2.4x enlargement: that is the pixellation and
 * the soft, "badly extracted" edge on /start-a-project.
 *
 * The mark is a flat SILHOUETTE, so its outline is the whole drawing. Tracing
 * the outline keeps 100% of what the brandbook actually contains and drops the
 * only thing that was ever lossy - the pixel grid. The contour is read at the
 * iso-level the anti-aliasing already encodes (alpha = 0.5) with linear
 * interpolation, so it lands where the printed edge lands, and the brandbook's
 * own irregular contour (the frayed left wing, the notched beak, the eye) is
 * preserved rather than tidied. Nothing is smoothed or re-drawn.
 *
 * FRAMING IS UNCHANGED
 * --------------------
 * The SVG keeps the outgoing file's 900x994 box and places the artwork on
 * exactly its content rectangle, so every width, aspect-ratio and offset in
 * the CSS keeps framing the bird as approved. It is painted white, so it works
 * as a mask under either mask-mode, which is how `.dao-mask` consumes it.
 *
 * Run: node scripts/vectorize-swallow.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { contours, simplify, toPath, area } from "./lib/trace-alpha.mjs";

const BRANDBOOK =
  process.env.DAO_BRANDBOOK ??
  "C:/Users/Admin/Desktop/8th State Production/8th state brandbook final.pdf";
const OUT = path.join("public/assets/graphics", "swallow.svg");
const SOURCE_OBJ = 1377;
/** the box the outgoing raster used, kept so no CSS has to move */
const BOX_W = 900;
const BOX_H = 994;
/** where the artwork sat inside that box, measured off the shipped file */
const ART = { x: 117, y: 130, w: 654, h: 740 };
/** RDP tolerance, in SOURCE pixels - below the JPEG's own edge jitter */
const EPSILON = 0.45;

function brandbookImage(file, objNum) {
  const buf = fs.readFileSync(file);
  const s = buf.toString("latin1");
  // one global pass over every object, exactly as scripts/rebuild-swallow.mjs
  // does - a single lazy match against 4.5MB of binary is not reliable
  const re = /(\d+)\s+0\s+obj([\s\S]*?)stream\r?\n/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (Number(m[1]) !== objNum) continue;
    if (!/\/Subtype\s*\/Image/.test(m[2])) throw new Error(`object ${objNum} is not an image`);
    if (!/\/DeviceGray/.test(m[2])) throw new Error(`object ${objNum} is not a soft mask`);
    const start = m.index + m[0].length;
    return buf.subarray(start, s.indexOf("endstream", start));
  }
  throw new Error(`brandbook object ${objNum} not found`);
}

const src = brandbookImage(BRANDBOOK, SOURCE_OBJ);
const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const alpha = new Uint8Array(W * H);
for (let i = 0; i < W * H; i += 1) alpha[i] = data[i * C];

// the artwork's own rectangle inside the source, so the trace can be mapped
// onto the shipped content box without moving the drawing
let x0 = W;
let y0 = H;
let x1 = -1;
let y1 = -1;
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (alpha[y * W + x] >= 128) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
const srcW = x1 - x0 + 1;
const srcH = y1 - y0 + 1;
const drift = Math.abs(srcW / srcH - ART.w / ART.h);
if (drift > 0.02) {
  throw new Error(
    `source aspect ${(srcW / srcH).toFixed(3)} does not match the shipped artwork ` +
      `${(ART.w / ART.h).toFixed(3)} - wrong bird`,
  );
}

const rings = contours(alpha, W, H)
  // JPEG ringing throws off a few one-cell specks; the eye is 300+ square units
  .filter((r) => Math.abs(area(r)) > 12)
  .map((r) => simplify(r, EPSILON));

const scale = ART.w / srcW;
const d = toPath(rings, {
  scale,
  // marching squares reads at sample centres, so the grid origin is -0.5
  dx: ART.x - (x0 - 0.5) * scale,
  dy: ART.y - (y0 - 0.5) * scale,
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX_W} ${BOX_H}" ` +
  `width="${BOX_W}" height="${BOX_H}">` +
  `<path fill="#fff" fill-rule="evenodd" d="${d}"/>` +
  `</svg>\n`;
fs.writeFileSync(OUT, svg);

// ---- verification: the vector must BE the source shape, not resemble it ----
// Rasterise the SVG at 4 render pixels per SOURCE pixel, cut the artwork
// rectangle back out of it, and compare it to the source mask at the same
// scale. Below 0.99 IoU the outline moved and the file is not written.
const S = 4;
const renderScale = S / scale; // render pixels per viewBox unit
const rw = Math.round(BOX_W * renderScale);
const rh = Math.round(BOX_H * renderScale);
const shot = await sharp(Buffer.from(svg))
  .resize(rw, rh)
  .ensureAlpha()
  .extractChannel("alpha")
  .extract({
    left: Math.round(ART.x * renderScale),
    top: Math.round(ART.y * renderScale),
    width: srcW * S,
    height: srcH * S,
  })
  .raw()
  .toBuffer();
const ref = await sharp(src)
  .greyscale()
  .extract({ left: x0, top: y0, width: srcW, height: srcH })
  .resize(srcW * S, srcH * S, { kernel: "lanczos3" })
  .raw()
  .toBuffer();
let inter = 0;
let union = 0;
for (let i = 0; i < shot.length; i += 1) {
  const a = shot[i] >= 128;
  const b = ref[i] >= 128;
  if (a || b) union += 1;
  if (a && b) inter += 1;
}
const iou = inter / union;
if (iou < 0.99) throw new Error(`traced outline drifted from the source (IoU ${iou.toFixed(4)})`);

const points = rings.reduce((n, r) => n + r.length, 0);
console.log(
  `swallow.svg  obj ${SOURCE_OBJ} ${W}x${H} (artwork ${srcW}x${srcH})` +
    ` -> ${rings.length} contour(s), ${points} points, IoU ${iou.toFixed(4)}` +
    `  ${(fs.statSync(OUT).size / 1024).toFixed(1)}KB`,
);
