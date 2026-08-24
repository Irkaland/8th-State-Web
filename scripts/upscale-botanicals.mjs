/**
 * Rebuilds the two Studio Lab botanical masks from the OFFICIAL brandbook at
 * full source resolution - no redrawing, no substitute flowers.
 *
 * WHY
 * ---
 * `stem.webp` shipped at 396x560, with only 243x414 of that being artwork. The
 * Studio Lab composition renders it in a box up to 486px wide, so the artwork
 * was already being drawn past 1:1 on an ordinary display and at roughly 2.5x
 * on a DPR-2 phone. That is the visible pixelation.
 *
 * SOURCE OF TRUTH
 * ---------------
 * `8th state brandbook final.pdf`. The PDF carries no fonts and no vector
 * paths - it is a raster export - so there is no SVG to lift. What it does
 * carry is 193 embedded images, and every piece of artwork is stored as an RGB
 * JPEG plus a same-size DeviceGray soft mask. Those grays are exactly what this
 * project needs: `.dao-mask` paints a brand token through an alpha channel, so
 * the gray IS the asset.
 *
 * Scanning every mask >=400x400 for a masked motif (2%-45% coverage) and
 * measuring each one's content bounding box identifies the two botanicals
 * already in use, and proves they are the same drawings rather than lookalikes:
 *
 *   asset             shipped box  content    aspect | brandbook source        content    aspect
 *   stem.webp         396x560      243x414    0.587  | obj87   1254x1254       544x928    0.586
 *   floral-rose.webp  528x560      357x392    0.911  | obj77   1004x1004       606x663    0.914
 *
 * Aspects agree to three decimals. These are the originals, at 2.2x and 1.7x
 * the linear resolution. obj87 is the ONLY copy of the stem flower in the
 * document, so 544x928 is the ceiling the brandbook can give - the alternative
 * would be inventing a flower, which the brief explicitly rules out.
 *
 * WHAT THIS PRESERVES
 * -------------------
 * Each output reproduces its predecessor's content-to-box ratio, so the
 * padding around the artwork scales with it and the file is a drop-in: every
 * `width`, `aspect-ratio` and offset in the CSS keeps framing the flower
 * exactly as approved. Only the pixel count changes.
 *
 * Run: node scripts/upscale-botanicals.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import sharp from "sharp";

const BRANDBOOK =
  process.env.DAO_BRANDBOOK ??
  "C:/Users/Admin/Desktop/8th State Production/8th state brandbook final.pdf";
const OUT_DIR = "public/assets/graphics";

/** Pull every embedded image stream out of the brandbook, keyed by object id. */
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
      width: Number(/\/Width\s+(\d+)/.exec(dict)?.[1]),
      height: Number(/\/Height\s+(\d+)/.exec(dict)?.[1]),
      gray: /\/ColorSpace\s*\/DeviceGray/.test(dict),
    });
  }
  return out;
}

/** Tight bounding box of everything above the alpha floor. */
async function contentBox(input, fromAlpha) {
  const pipe = fromAlpha
    ? sharp(input).ensureAlpha().extractChannel("alpha")
    : sharp(input).greyscale();
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (data[(y * W + x) * C] > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { W, H, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Build one mask asset: crop the brandbook artwork to its content, then pad it
 * back out so the content occupies the same fraction of the box as the file it
 * replaces. `.dao-mask` uses `center / contain`, so matching that fraction is
 * what makes the swap invisible to the layout.
 */
async function build({ name, objId, images }) {
  const target = path.join(OUT_DIR, name);
  // read through a Buffer, never the path: sharp keeps a file handle open on a
  // path input, and Windows then refuses to replace the file underneath it
  const before = await contentBox(fs.readFileSync(target), true);
  const src = images.get(objId);
  if (!src) throw new Error(`brandbook object ${objId} not found`);
  if (!src.gray) throw new Error(`brandbook object ${objId} is not a soft mask`);

  const box = await contentBox(src.data, false);
  // the artwork must be the same drawing, not merely a similar one
  const drift = Math.abs(box.w / box.h - before.w / before.h);
  if (drift > 0.01) {
    throw new Error(
      `${name}: source aspect ${(box.w / box.h).toFixed(3)} does not match the ` +
        `shipped artwork ${(before.w / before.h).toFixed(3)} - wrong motif`,
    );
  }

  const boxW = Math.round(box.w / (before.w / before.W));
  const boxH = Math.round(box.h / (before.h / before.H));
  // keep the old asset's slight off-centre bias rather than re-centring it
  const left = Math.round((boxW - box.w) * (before.x0 / (before.W - before.w)));
  const top = Math.round((boxH - box.h) * (before.y0 / (before.H - before.h)));

  const alpha = await sharp(src.data)
    .greyscale()
    .extract({ left: box.x0, top: box.y0, width: box.w, height: box.h })
    .extend({
      left,
      top,
      right: boxW - box.w - left,
      bottom: boxH - box.h - top,
      background: { r: 0, g: 0, b: 0 },
    })
    .raw()
    .toBuffer();

  // RGBA: the colour is irrelevant (the mask consumes alpha only) but a white
  // body keeps the file sane if anything ever renders it as an image
  const px = Buffer.alloc(boxW * boxH * 4);
  for (let i = 0; i < boxW * boxH; i += 1) {
    px[i * 4] = 255;
    px[i * 4 + 1] = 255;
    px[i * 4 + 2] = 255;
    px[i * 4 + 3] = alpha[i];
  }
  const webp = await sharp(px, { raw: { width: boxW, height: boxH, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toBuffer();
  fs.writeFileSync(target, webp);

  const kb = (fs.statSync(target).size / 1024).toFixed(1);
  console.log(
    `${name.padEnd(20)} ${before.W}x${before.H} -> ${boxW}x${boxH}` +
      `  content ${before.w}x${before.h} -> ${box.w}x${box.h}` +
      `  (${(box.w / before.w).toFixed(2)}x)  ${kb}KB`,
  );
}

const images = readBrandbookImages(BRANDBOOK);
console.log(`brandbook: ${images.size} decodable image objects\n`);
await build({ name: "stem.webp", objId: 87, images });
await build({ name: "floral-rose.webp", objId: 77, images });
