/**
 * Lifts decorative marks and symbols out of the official 8th State brandbook -
 * no redrawing, no vector approximations.
 *
 * The brandbook is a raster export with no vector paths, so each mark exists
 * only as an embedded image plus a soft mask. This reads the PDF directly,
 * applies the mask, trims the transparent margin and writes the result in the
 * form the site's decoration architecture already expects: a WHITE image whose
 * ALPHA is the artwork, painted at run time through `.dao-mask` (`--m`) with a
 * brand token. That is what keeps the printed edge - the grain and the
 * irregular contour live in the alpha, so the same file can be cream on ink or
 * ink on paper without ever being re-drawn.
 *
 * The source objects were identified by rebuilding the two grid pages from
 * their own content streams and reading them by column and row, rather than by
 * guessing at coordinates:
 *
 *   page 16, DECORATIVE
 *     column 1, item 4  obj 133   flowering stem
 *     column 2, item 2  obj 1441  twin-bird ornament
 *     column 3, item 2  obj 1471  curled flourish
 *   page 15, SYMBOLS
 *     column 2, item 2  obj 1381  bird, wings open
 *     column 3, item 1  obj 1072  celestial sun (with the wordmark beneath it,
 *                                 which is cropped off - see SUN_ONLY)
 *
 * The brandbook is not in the repository (it is a 4.5MB print PDF and not a web
 * asset), so this script takes its path as an argument and the derived webp
 * files are committed. Re-run only if a mark has to be re-derived:
 *
 *   node scripts/extract-brandbook-marks.mjs "<path to brandbook.pdf>"
 */
import fs from "node:fs";
import zlib from "node:zlib";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/extract-brandbook-marks.mjs <brandbook.pdf>");
  process.exit(1);
}
const OUT = "public/assets/graphics";

/** what to lift, and how wide to ship it (2x the largest CSS box it is drawn in) */
const MARKS = [
  { obj: 133, name: "bb-flower-stem", width: 520, note: "DECORATIVE col1 #4" },
  { obj: 1441, name: "bb-twin-birds", width: 760, note: "DECORATIVE col2 #2" },
  { obj: 1471, name: "bb-flourish", width: 260, note: "DECORATIVE col3 #2" },
  { obj: 1381, name: "bb-bird-open", width: 900, note: "SYMBOLS col2 #2" },
  { obj: 1072, name: "bb-sun-symbol", width: 1400, note: "SYMBOLS col3 #1", sunOnly: true },
];

const buf = fs.readFileSync(SRC);
const raw = buf.toString("latin1");

/** objnum -> { dict, stream offsets } for every top-level object */
const objs = new Map();
{
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(raw))) {
    const num = Number(m[1]);
    const start = m.index + m[0].length;
    const end = raw.indexOf("endobj", start);
    if (end < 0) continue;
    const body = raw.slice(start, end);
    const si = body.indexOf("stream");
    let dict = body;
    let sStart = -1;
    let sLen = -1;
    if (si >= 0) {
      dict = body.slice(0, si);
      let p = start + si + 6;
      if (raw[p] === "\r") p += 1;
      if (raw[p] === "\n") p += 1;
      sStart = p;
      const lm = dict.match(/\/Length\s+(\d+)/);
      sLen = lm ? Number(lm[1]) : raw.indexOf("endstream", p) - p;
    }
    objs.set(num, { dict, sStart, sLen });
  }
}

function inflate(o) {
  const b = buf.subarray(o.sStart, o.sStart + o.sLen);
  if (!/\/FlateDecode/.test(o.dict)) return b;
  return zlib.inflateSync(b);
}

/** the artwork's shape, from its /SMask - itself usually a JPEG, not raw bytes */
async function alphaOf(dict, n) {
  const m = dict.match(/\/SMask\s+(\d+)\s+0\s+R/);
  if (!m) throw new Error(`obj ${n} has no /SMask - nothing to cut it out with`);
  const so = objs.get(Number(m[1]));
  if (/\/DCTDecode/.test(so.dict)) {
    return sharp(buf.subarray(so.sStart, so.sStart + so.sLen))
      .greyscale()
      .raw()
      .toBuffer();
  }
  return inflate(so);
}

/**
 * The celestial-sun cell carries the wordmark under the mark. A decorative
 * background graphic must not quietly become a second logo lockup, so the type
 * is cropped off at the widest empty row between the two.
 */
function sunOnly(alpha, W, H) {
  const rowInk = [];
  for (let y = 0; y < H; y += 1) {
    let n = 0;
    for (let x = 0; x < W; x += 1) if (alpha[y * W + x] > 40) n += 1;
    rowInk.push(n);
  }
  // walk up from the bottom past the type, then past the gap above it, and cut
  // at the sun's own last inked row - half a gap of empty alpha would shift the
  // mark off centre inside its own box
  let y = H - 1;
  while (y > 0 && rowInk[y] === 0) y -= 1; // bottom margin
  while (y > 0 && rowInk[y] > 0) y -= 1; // the wordmark itself
  while (y > 0 && rowInk[y] === 0) y -= 1; // the gap above it
  const cut = y + 2;
  if (cut < H * 0.5) throw new Error("sun crop landed too high - check the source");
  return cut;
}

for (const mk of MARKS) {
  const od = objs.get(mk.obj);
  if (!od) throw new Error(`obj ${mk.obj} not found`);
  const W = Number((od.dict.match(/\/Width\s+(\d+)/) || [])[1]);
  const H = Number((od.dict.match(/\/Height\s+(\d+)/) || [])[1]);
  const alpha = await alphaOf(od.dict, mk.obj);

  const height = mk.sunOnly ? sunOnly(alpha, W, H) : H;
  // white ink, artwork in the alpha - the form every other decoration ships in
  const rgba = Buffer.alloc(W * height * 4);
  for (let i = 0; i < W * height; i += 1) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = alpha[i];
  }

  const file = `${OUT}/${mk.name}.webp`;
  const info = await sharp(rgba, { raw: { width: W, height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ width: mk.width, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(file);
  console.log(
    `obj ${mk.obj} (${mk.note}) ${W}x${H}${mk.sunOnly ? ` -> cropped to ${W}x${height}` : ""}` +
      ` -> ${info.width}x${info.height} ${file}`,
  );
}
