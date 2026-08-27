/**
 * Builds the site icons from the OFFICIAL brandbook sun - no redrawing.
 *
 * WHAT IT REPLACES
 * ----------------
 * `src/app/icon.svg` used to be a placeholder: a blue disc with an orange
 * infinity glyph set in a font the site does not even load any more. It is
 * not a brand asset and never was.
 *
 * THE SOURCE
 * ----------
 * `public/assets/graphics/bb-sun-symbol.webp` - the celestial sun lifted from
 * the brandbook's own SYMBOLS sheet by `scripts/extract-brandbook-marks.mjs`
 * (page 15, column 3, item 1 - object 1072). It ships the way every decoration
 * on this site ships: white pixels, artwork in the ALPHA, so the colour is
 * applied downstream. Here that colour is the brand red, `--dao-red` #d03e26.
 *
 * WHY A TRACE AND NOT A RESIZE
 * ----------------------------
 * A favicon is drawn at 16px and at 180px from the same declaration, and this
 * mark is twelve rays around a disc - exactly the shape a fixed raster serves
 * worst. The outline is read off the brandbook alpha at the iso-level its own
 * anti-aliasing encodes (see scripts/lib/trace-alpha.mjs), so the contour is
 * the printed contour; nothing is smoothed, simplified into a "cleaner" sun,
 * or re-drawn.
 *
 * OUTPUTS (Next.js App Router file conventions - no manual <link> anywhere)
 *   src/app/icon.svg        vector, brand red on transparent - every browser
 *                           that supports SVG icons, at any size
 *   src/app/apple-icon.png  180x180 raster for iOS, on the brand paper ground
 *                           because iOS composites a transparent icon on black
 *
 * Run: node scripts/make-favicon.mjs
 */
import fs from "node:fs";
import sharp from "sharp";
import { contours, simplify, toPath, area } from "./lib/trace-alpha.mjs";

const SRC = "public/assets/graphics/bb-sun-symbol.webp";
const SVG_OUT = "src/app/icon.svg";
const APPLE_OUT = "src/app/apple-icon.png";
const RED = "#d03e26";
const PAPER = { r: 242, g: 237, b: 227 };
/** the icon box, in the units the path is written in */
const BOX = 512;
/** breathing room inside the box, as a share of it - a tab icon needs it */
const PAD = 0.06;
/** RDP tolerance in SOURCE pixels; 1400px of source, so this is 0.07% of it */
const EPSILON = 1;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const alpha = new Uint8Array(W * H);
for (let i = 0; i < W * H; i += 1) alpha[i] = data[i * C + C - 1];

const rings = contours(alpha, W, H)
  .filter((r) => Math.abs(area(r)) > 20)
  .map((r) => simplify(r, EPSILON));
if (!rings.length) throw new Error("no contour found in the brandbook sun");

// square box, artwork centred, longest side fitting the padded area
const inner = BOX * (1 - 2 * PAD);
const scale = inner / Math.max(W, H);
const d = toPath(rings, {
  scale,
  // marching squares reads at sample centres, so the grid origin is -0.5
  dx: (BOX - W * scale) / 2 + 0.5 * scale,
  dy: (BOX - H * scale) / 2 + 0.5 * scale,
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}" ` +
  `width="${BOX}" height="${BOX}">` +
  `<path fill="${RED}" fill-rule="evenodd" d="${d}"/>` +
  `</svg>\n`;

// ---- verification: the vector must BE the brandbook shape ----
const S = 2;
const shot = await sharp(Buffer.from(svg))
  .resize(Math.round(BOX * (S / scale)), Math.round(BOX * (S / scale)))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const sw = shot.info.width;
const sc = shot.info.channels;
const left = Math.round(((BOX - W * scale) / 2) * (S / scale));
const top = Math.round(((BOX - H * scale) / 2) * (S / scale));
const ref = await sharp(SRC)
  .ensureAlpha()
  .extractChannel("alpha")
  .resize(W * S, H * S, { kernel: "lanczos3" })
  .raw()
  .toBuffer();
let inter = 0;
let union = 0;
for (let y = 0; y < H * S; y += 1) {
  for (let x = 0; x < W * S; x += 1) {
    const a = shot.data[((y + top) * sw + (x + left)) * sc + sc - 1] >= 128;
    const b = ref[y * W * S + x] >= 128;
    if (a || b) union += 1;
    if (a && b) inter += 1;
  }
}
const iou = inter / union;
if (iou < 0.99) throw new Error(`traced sun drifted from the brandbook (IoU ${iou.toFixed(4)})`);

fs.writeFileSync(SVG_OUT, svg);
await sharp(Buffer.from(svg))
  .resize(180, 180)
  .flatten({ background: PAPER })
  .png({ compressionLevel: 9 })
  .toFile(APPLE_OUT);

const points = rings.reduce((n, r) => n + r.length, 0);
console.log(
  `icon.svg        ${rings.length} contour(s), ${points} points, IoU ${iou.toFixed(4)}` +
    `  ${(fs.statSync(SVG_OUT).size / 1024).toFixed(1)}KB`,
);
console.log(`apple-icon.png  180x180  ${(fs.statSync(APPLE_OUT).size / 1024).toFixed(1)}KB`);
