// Generates public/og.png (1200x630) - a clean typographic share card.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#131312"/>
  <g transform="translate(80,80)">
    <circle cx="26" cy="26" r="26" fill="#4E7CA8"/>
    <text x="26" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#C6421F">∞</text>
    <text x="70" y="34" font-family="Arial, sans-serif" font-size="20" letter-spacing="3" fill="#F2F0EA">8TH STATE&#160;&#160;<tspan fill="#8A8882">PRODUCTION</tspan></text>
  </g>
  <text x="80" y="360" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="#F7F5EF" letter-spacing="-2">From visual concept</text>
  <text x="80" y="440" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="#F7F5EF" letter-spacing="-2">to final frame.</text>
  <rect x="80" y="486" width="52" height="3" fill="#C6421F"/>
  <text x="80" y="536" font-family="Arial, sans-serif" font-size="22" fill="rgba(242,240,234,0.7)">Photography · Film · Creative Direction · Production Design</text>
  <text x="80" y="576" font-family="Arial, sans-serif" font-size="16" letter-spacing="2" fill="#8A8882">TBILISI, GEORGIA</text>
</svg>`;

const out = path.resolve("public/og.png");
const buf = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile(out, buf);
console.log(`Wrote ${out} (${Math.round(buf.length / 1024)} KB)`);
