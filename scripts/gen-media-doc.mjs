// Regenerates DEMO_MEDIA_SOURCES.md from public/media/_sources.json (+ real image dimensions).
// Usage: node scripts/gen-media-doc.mjs
import fs from "node:fs";
import sharp from "sharp";

const data = JSON.parse(fs.readFileSync("public/media/_sources.json", "utf8"));

const rows = [];
for (const im of data.images) {
  const meta = await sharp("public/media/" + im.file).metadata();
  rows.push({ ...im, dim: `${meta.width}×${meta.height}` });
}

const L = [];
L.push("# Demo Media Sources");
L.push("");
L.push(
  "All prominent imagery in this demo is **editorial placeholder photography** sourced from **Pexels** under the **" +
    data.license +
    "**. It demonstrates art direction, layout and image treatment only - it does **not** represent real 8th State client work, and every project title/credit is flagged provisional in the content layer.",
);
L.push("");
L.push(
  "**Replace all of these with 8th State studio masters before production** (see `FINAL_MEDIA_REQUIREMENTS.md`). Swapping is trivial: drop a file with the same name into `public/media/`, or change the `src` path in `src/content/projects.ts` (hero paths in `src/components/home/Hero.tsx`, Georgia stills in `src/content/pathways.ts`).",
);
L.push("");
L.push(
  "- Fetch / refresh script: `node scripts/fetch-media.mjs` (downloads from the manifest below).",
);
L.push("- Regenerate this document: `node scripts/gen-media-doc.mjs`.");
L.push("- Machine-readable manifest: `public/media/_sources.json`.");
L.push(
  "- Downloaded long-edge width: **" +
    data.generatedWidth +
    "px** - meets the quality targets (hero/full-bleed ≥2000px, landscape ≥1600px, portrait ≥1200px).",
);
L.push("");
L.push("| Local file | Dimensions | Placement | Pexels source | Alt (EN) |");
L.push("|---|---|---|---|---|");
for (const r of rows) {
  L.push(`| \`${r.file}\` | ${r.dim} | ${r.placement} | [${r.id}](${r.pexels}) | ${r.alt} |`);
}
L.push("");
L.push("## Non-prominent supplied assets (low-resolution mockup crops)");
L.push("");
L.push(
  "The UI-mockup archive shipped ~50 images under `_design-reference/ui-mockup/assets/p/` at **~246px wide**, cropped from Instagram screenshots. They are **not used anywhere in the running demo**: they are too low-resolution for any on-screen placement (hero, grid card, case study, or thumbnail) and would visibly pixelate. They remain in the reference folder only for art-direction/composition context. The IG grid strips under `assets/src/` (739×1600) are screenshot compilations and are likewise unused.",
);
L.push("");
L.push("## OG / social image");
L.push("");
L.push(
  "`public/og.png` (1200×630) is a self-generated typographic card (no third-party imagery). Regenerate with `node scripts/make-og.mjs`.",
);
L.push("");
L.push("## Attribution note");
L.push("");
L.push(
  "The Pexels License does not require attribution, but each source photo page is linked above for traceability so the studio can verify and replace each frame deliberately.",
);
L.push("");

fs.writeFileSync("DEMO_MEDIA_SOURCES.md", L.join("\n"));
console.log("Wrote DEMO_MEDIA_SOURCES.md with " + rows.length + " images");
