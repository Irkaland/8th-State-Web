// Downloads curated, license-clean demo photography (Pexels License) at high resolution.
// Every image is an EDITORIAL PLACEHOLDER for the demo - swap for studio masters before production.
// Usage: node scripts/fetch-media.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/media");
const WIDTH = 2400; // long-edge target for prominent placements
const Q = "auto=compress&cs=tinysrgb";

// filename -> { id, alt, placement } ; Pexels photo page: https://www.pexels.com/photo/<id>/
const MANIFEST = [
  // Hero triptych (portrait)
  {
    file: "hero-green.jpg",
    id: 32174359,
    placement: "Homepage hero - frame 1",
    alt: "Model in a teal suit against a saturated green studio backdrop",
  },
  {
    file: "hero-red.jpg",
    id: 17173186,
    placement: "Homepage hero - frame 2",
    alt: "Editorial figure posing on a chair against a vivid red backdrop",
  },
  {
    file: "hero-panel-3-v2.jpg",
    id: 34921744,
    placement: "Homepage hero - frame 3",
    alt: "Model in a black dress under dramatic studio light on a dark background",
  },
  // Project covers
  {
    file: "aom-cover.jpg",
    id: 33852945,
    placement: "AOM - feature card / featured / related",
    alt: "Fashion model in bold styling under saturated red light",
  },
  {
    file: "aom-hero.jpg",
    id: 33714925,
    placement: "AOM - case study hero (wide)",
    alt: "Model in a black dress in a red-lit studio scene",
  },
  {
    file: "bal-dafrique.jpg",
    id: 26924218,
    placement: "Bal d'Afrique - product still life",
    alt: "Fragrance bottle styled with cotton blooms on warm sand tones",
  },
  {
    file: "meama-iced.jpg",
    id: 38127780,
    placement: "Iced Classic - food & beverage",
    alt: "Iced coffee in a textured glass with a straw against green",
  },
  {
    file: "gastronome-kitchen.jpg",
    id: 11067884,
    placement: "Kitchen & Living - lifestyle table",
    alt: "Georgian table with khachapuri, wine and salad from above",
  },
  {
    file: "volvo-film.jpg",
    id: 10077895,
    placement: "Volvo x Situationist - film",
    alt: "Figure in a leather jacket by a vintage car under neon light",
  },
  {
    file: "leghvi-culture.jpg",
    id: 33611113,
    placement: "The Colors of Leghvi - music & culture",
    alt: "Cinematic night scene of a retro diner in colourful neon",
  },
  {
    file: "office-editorial.jpg",
    id: 20218971,
    placement: "Office Series - fashion editorial",
    alt: "Model in a black blazer in a stylised studio shot",
  },
  {
    file: "chronograph.jpg",
    id: 11216317,
    placement: "Chronograph Georgia - product",
    alt: "Object in textured glass under warm directional light",
  },
  {
    file: "glass-interiors.jpg",
    id: 12379606,
    placement: "Glass Study - interiors",
    alt: "Green velvet chair with gold legs in a striped interior",
  },
  {
    file: "florida-hospitality.jpg",
    id: 14693027,
    placement: "Florida - hospitality",
    alt: "Building facade with red and blue mosaic tiling",
  },
  {
    file: "pure-royal.jpg",
    id: 26924217,
    placement: "Pure Royal - fragrance product",
    alt: "Fragrance bottle on a vivid orange background",
  },
  {
    file: "berlin-editorial.jpg",
    id: 31630337,
    placement: "Berlin Diary - fashion editorial",
    alt: "Fashion model posed in a Berlin studio setting",
  },
  // AOM case-study gallery + BTS
  {
    file: "aom-gallery-1.jpg",
    id: 9121191,
    placement: "AOM - gallery full-bleed",
    alt: "Model in colourful conceptual fashion",
  },
  {
    file: "aom-gallery-2.jpg",
    id: 19952453,
    placement: "AOM - gallery portrait",
    alt: "Portrait in a sepia-toned studio shoot",
  },
  {
    file: "aom-gallery-3.jpg",
    id: 953695,
    placement: "AOM - gallery portrait",
    alt: "Model in a blue top with motion blur in studio",
  },
  {
    file: "aom-film-still.jpg",
    id: 10385384,
    placement: "AOM - gallery film still",
    alt: "Figure inside a car lit by moody pink and purple light",
  },
  {
    file: "aom-detail.jpg",
    id: 20194705,
    placement: "AOM - gallery detail crop",
    alt: "Detail of a black satin blouse and leather gloves",
  },
  {
    file: "bts-camera.jpg",
    id: 8089652,
    placement: "Studio positioning / AOM BTS",
    alt: "Film crew with a camera on a set under red lighting",
  },
  {
    file: "bts-set.jpg",
    id: 8088386,
    placement: "AOM BTS - set prep",
    alt: "Crew setting up an indoor scene with lighting equipment",
  },
  // Georgia Production
  {
    file: "georgia-hero.jpg",
    id: 34060610,
    placement: "Georgia Production - hero",
    alt: "Street with brutalist architecture and parked cars at twilight",
  },
  {
    file: "georgia-street.jpg",
    id: 9536026,
    placement: "Georgia Production - still",
    alt: "Figure beside a red car outside a brightly lit city storefront",
  },
  {
    file: "georgia-architecture.jpg",
    id: 19039174,
    placement: "Georgia Production - still",
    alt: "Modern building with prominent columns and a brutalist facade",
  },
  {
    file: "georgia-set.jpg",
    id: 4278985,
    placement: "Georgia Production - set build still",
    alt: "Set corner with circular red wall art and a green velvet armchair",
  },
];

function url(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?${Q}&w=${WIDTH}`;
}

async function download(id) {
  const res = await fetch(url(id), { headers: { "User-Agent": "Mozilla/5.0 (demo-media-fetch)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // JPEG magic bytes FF D8 FF
  if (buf.length < 20000 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
    throw new Error(`invalid JPEG (${buf.length} bytes)`);
  }
  return buf;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const sources = [];
  const failures = [];
  for (const item of MANIFEST) {
    const dest = path.join(OUT, item.file);
    try {
      const buf = await download(item.id);
      await writeFile(dest, buf);
      const kb = Math.round((await stat(dest)).size / 1024);
      sources.push({
        ...item,
        bytesKB: kb,
        pexels: `https://www.pexels.com/photo/${item.id}/`,
        src: url(item.id),
      });
      console.log(`OK   ${item.file.padEnd(24)} ${kb} KB  (#${item.id})`);
    } catch (err) {
      failures.push({ ...item, error: String(err.message || err) });
      console.error(`FAIL ${item.file.padEnd(24)} #${item.id}: ${err.message || err}`);
    }
  }
  await writeFile(
    path.join(OUT, "_sources.json"),
    JSON.stringify(
      {
        license: "Pexels License (free for commercial use, no attribution required)",
        note: "Editorial placeholder imagery for the demo. Replace with 8th State studio masters before production.",
        generatedWidth: WIDTH,
        images: sources,
        failures,
      },
      null,
      2,
    ),
  );
  console.log(
    `\nDone: ${sources.length} ok, ${failures.length} failed. Manifest -> public/media/_sources.json`,
  );
  if (failures.length) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
