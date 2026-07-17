// One-off generator for lightweight placeholder gallery images used in
// local/demo mode. Run with: node scripts/generate-placeholders.mjs
// These are intentionally tiny flat-color SVGs, not real photos —
// real event photos live in Google Drive / Cloudflare R2, never in git.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(__dirname, "..", "public", "placeholders");

const albums = [
  { slug: "mahotsavam-2024", count: 8 },
  { slug: "mahotsavam-2023", count: 8 },
  { slug: "mahotsavam-2022", count: 6 },
  { slug: "mahotsavam-2021", count: 6 },
  { slug: "navarathiri-2024", count: 7 },
  { slug: "sivarathiri-2023", count: 6 },
  { slug: "thiruvempavai-2023", count: 6 },
];

// A few different aspect ratios so the grid doesn't look robotic.
const shapes = [
  { w: 1200, h: 900 }, // 4:3 landscape
  { w: 1200, h: 1500 }, // portrait
  { w: 1200, h: 1200 }, // square
];

// Flat maroon tones sampled from vinaayagar.com, same gradient angle every
// tile so the grid reads as one calm, consistent set rather than a jumble.
const maroons = ["#A11237", "#8A0F2F", "#700D27", "#5C0A20"];
const gold = "#FFDE5F";

function svgFor(label, sub, shape, seed) {
  const maroon = maroons[seed % maroons.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.w}" height="${shape.h}" viewBox="0 0 ${shape.w} ${shape.h}">
  <defs>
    <linearGradient id="g${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${maroon}"/>
      <stop offset="100%" stop-color="${maroons[maroons.length - 1]}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g${seed})"/>
  <circle cx="${shape.w * 0.5}" cy="${shape.h * 0.42}" r="${shape.w * 0.07}" fill="${gold}" opacity="0.9"/>
  <text x="50%" y="50%" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(shape.w / 16)}" fill="#fbfaf8" opacity="0.95">${label}</text>
  <text x="50%" y="${shape.h * 0.58}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(shape.w / 34)}" fill="${gold}" opacity="0.9">${sub}</text>
</svg>`;
}

let seed = 0;
for (const album of albums) {
  const dir = path.join(outRoot, album.slug);
  mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= album.count; i++) {
    const shape = shapes[seed % shapes.length];
    const label = album.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const svg = svgFor(label, `Photo ${i}`, shape, seed);
    writeFileSync(path.join(dir, `photo-${i}.svg`), svg);
    seed++;
  }
}

console.log(`Generated placeholders for ${albums.length} albums in ${outRoot}`);
