/**
 * Rebuilds the Studio hero swallow from the OFFICIAL brandbook, at the size it
 * is actually drawn - no redrawing, no substitute bird.
 *
 * THE PROBLEM
 * -----------
 * `swallow.webp` ships at 515x560 (374x417 of that being artwork) and
 * `.dst__swallow` draws it in a box up to `clamp(380px, 62vw, 900px)` wide. So
 * the artwork is already past 1:1 on an ordinary desktop and roughly 3.5x on a
 * DPR-2 display. That is the visible blur.
 *
 * WHAT THE SOURCE ACTUALLY IS
 * ---------------------------
 * `8th state brandbook final.pdf` carries no fonts and no vector paths - it is
 * a raster export - so there is no SVG of this bird to lift, and the repository
 * has none either. Scanning all 193 embedded images and comparing each mask to
 * the shipped alpha by IoU on a normalised 64x64 signature identifies the
 * source unambiguously:
 *
 *   obj1377   IoU 0.958   content 282x319
 *   obj1386   IoU 0.730   (a different bird in the same family)
 *   obj1380   IoU 0.652   (another)
 *
 * The brandbook holds a whole family of bird marks, and obj1377 is the one in
 * use. Note its content is 282x319 - SMALLER than the shipped 374x417. The
 * shipped file was itself upscaled from this original and re-encoded lossily,
 * and that shows up in the edges: measuring partially-transparent pixels as a
 * share of ink, the shipped file is 5.6% soft against the original's 1.8%. The
 * blur was baked in before the browser ever scaled it.
 *
 * WHAT THIS FIXES, AND WHAT IT CANNOT
 * -----------------------------------
 * Resampling the true original once, with lanczos3, straight to the display box
 * measures 2.2% soft - a 2.5x improvement on the 5.6% being shipped, achieved
 * with no sharpening filter and no invented detail. The browser then has nothing
 * left to upscale at 1x.
 *
 * It cannot add real detail beyond obj1377: 282x319 is all the brandbook has of
 * this bird. The remaining softness is the brandbook`s own distressed print
 * texture, which is intentional and is left alone.
 *
 * The content-to-box ratio of the outgoing file is reproduced exactly, so every
 * width, aspect-ratio and offset in the CSS keeps framing the bird as approved.
 * Only the pixel count changes.
 *
 * Run: node scripts/rebuild-swallow.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import sharp from "sharp";

const BRANDBOOK =
  process.env.DAO_BRANDBOOK ??
  "C:/Users/Admin/Desktop/8th State Production/8th state brandbook final.pdf";
const TARGET = path.join("public/assets/graphics", "swallow.webp");
const SOURCE_OBJ = 1377;
/** the widest `.dst__swallow` is ever drawn - past this adds bytes, not detail */
const BOX_WIDTH = 900;

function readBrandbookImages(file) {
  const buf = fs.readFileSync(file);
  const s = buf.toString("latin1");
  const out = new Map();
  const objRe = /(\d+)\s+0\s+obj([\s\S]*?)stream\r?\n/g;
  let m;
  while ((m = objRe.exec(s)) !== null) {
    const dict = m[2];
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    const start = m.index + m[0].length;
    const end = s.indexOf("endstream", start);
    if (end < 0) continue;
    const filter = /\/Filter\s*\/(\w+)/.exec(dict)?.[1] ?? "none";
    const raw = buf.subarray(start, end);
    let data = null;
    if (filter === "DCTDecode") data = raw;
    else if (filter === "FlateDecode") {
      try {
        data = zlib.inflateSync(raw);
      } catch {
        data = null;
      }
    }
    if (!data) continue;
    out.set(Number(m[1]), {
      data,
      gray: /\/ColorSpace\s*\/DeviceGray/.test(dict),
    });
  }
  return out;
}

/** Tight bounding box of everything above the alpha floor, plus edge softness. */
async function measure(input, fromAlpha) {
  const pipe = fromAlpha
    ? sharp(input).ensureAlpha().extractChannel("alpha")
    : sharp(input).greyscale();
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  let ink = 0;
  let soft = 0;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const v = data[(y * W + x) * C];
      if (v > 12) {
        ink += 1;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (v > 51 && v < 204) soft += 1;
    }
  }
  return { W, H, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, softness: soft / ink };
}

// read through a Buffer, never the path: sharp keeps a file handle open on a
// path input, and Windows then refuses to replace the file underneath it
const before = await measure(fs.readFileSync(TARGET), true);

const images = readBrandbookImages(BRANDBOOK);
const src = images.get(SOURCE_OBJ);
if (!src) throw new Error(`brandbook object ${SOURCE_OBJ} not found`);
if (!src.gray) throw new Error(`brandbook object ${SOURCE_OBJ} is not a soft mask`);

const box = await measure(src.data, false);
// refuse to proceed if this is not the same drawing
const drift = Math.abs(box.w / box.h - before.w / before.h);
if (drift > 0.02) {
  throw new Error(
    `source aspect ${(box.w / box.h).toFixed(3)} does not match the shipped ` +
      `artwork ${(before.w / before.h).toFixed(3)} - wrong bird`,
  );
}

// reproduce the outgoing content-to-box ratio so the CSS framing is unchanged
const contentW = Math.round(BOX_WIDTH * (before.w / before.W));
const contentH = Math.round(contentW / (box.w / box.h));
const boxH = Math.round(contentH / (before.h / before.H));
// keep the old asset's off-centre bias rather than re-centring it
const left = Math.round((BOX_WIDTH - contentW) * (before.x0 / (before.W - before.w)));
const top = Math.round((boxH - contentH) * (before.y0 / (before.H - before.h)));

const alpha = await sharp(src.data)
  .greyscale()
  .extract({ left: box.x0, top: box.y0, width: box.w, height: box.h })
  .resize(contentW, contentH, { kernel: "lanczos3" })
  .extend({
    left,
    top,
    right: BOX_WIDTH - contentW - left,
    bottom: boxH - contentH - top,
    background: { r: 0, g: 0, b: 0 },
  })
  .raw()
  .toBuffer();

// RGBA: the colour is irrelevant (.dao-mask consumes alpha only) but a white
// body keeps the file sane if anything ever renders it as an image
const px = Buffer.alloc(BOX_WIDTH * boxH * 4);
for (let i = 0; i < BOX_WIDTH * boxH; i += 1) {
  px[i * 4] = 255;
  px[i * 4 + 1] = 255;
  px[i * 4 + 2] = 255;
  px[i * 4 + 3] = alpha[i];
}
const webp = await sharp(px, { raw: { width: BOX_WIDTH, height: boxH, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toBuffer();
fs.writeFileSync(TARGET, webp);

const after = await measure(fs.readFileSync(TARGET), true);
console.log(
  `swallow.webp  ${before.W}x${before.H} -> ${after.W}x${after.H}` +
    `  content ${before.w}x${before.h} -> ${after.w}x${after.h}` +
    `  edge softness ${(before.softness * 100).toFixed(1)}% -> ${(after.softness * 100).toFixed(1)}%` +
    `  ${(fs.statSync(TARGET).size / 1024).toFixed(1)}KB`,
);
console.log(
  `content/box ratio  ${(before.w / before.W).toFixed(4)} -> ${(after.w / after.W).toFixed(4)}` +
    ` (CSS framing preserved)`,
);
