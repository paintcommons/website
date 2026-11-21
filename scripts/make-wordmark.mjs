#!/usr/bin/env node
// Draws the "PAINT COMMONS" wordmark as outlines, so it looks the same on every device whatever
// fonts it has. The wordmark is Cormorant SemiBold in even capitals with the font's own spacing
// and kerning (no added tracking).
//
// Writes, with the icon (dist/icon.svg) for the lockups:
//   dist/brand/wordmark.svg, wordmark-light.svg   the word alone (ink / paper, for dark grounds)
//   dist/brand/lockup.svg, lockup-light.svg       the icon and the word side by side
//
//   npm install --no-save harfbuzzjs && node scripts/make-wordmark.mjs
//
// Cormorant is © the Cormorant Project Authors, SIL Open Font License 1.1 (assets/fonts/cormorant/OFL.txt).
// Re-run after changing the settings below or the icon, and keep STYLE_GUIDE.md in step.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let hbInit;
try {
  hbInit = (await import("harfbuzzjs")).default;
} catch {
  console.error("harfbuzzjs is needed to draw the wordmark: npm install --no-save harfbuzzjs");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONT = join(root, "assets/fonts/cormorant/Cormorant[wght].ttf");
const NAME = "Paint Commons";
const TEXT = NAME.toUpperCase();
const AXES = { wght: 600 };
const INK = "#242820", PAPER = "#f8f7f3"; // tokens: --ink and --paper

const hb = await hbInit;
const face = hb.createFace(hb.createBlob(readFileSync(FONT)), 0);
const font = hb.createFont(face);
font.setVariations(AXES);
const upem = face.upem;
const buffer = hb.createBuffer();
buffer.addText(TEXT);
buffer.guessSegmentProperties();
hb.shape(font, buffer); // applies the font's kerning
const glyphs = buffer.json(font);

// Place each glyph (font units, y up), flipped into SVG space (y down), baseline at y = 0.
let x = 0;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
const parts = [];
for (const g of glyphs) {
  const ox = x + g.dx, oy = g.dy;
  parts.push(font.glyphToPath(g.g).replace(/([MLQCZ])([^MLQCZ]*)/g, (_, cmd, args) => {
    const n = args.trim() ? args.trim().split(/[ ,]+/).map(Number) : [];
    const pts = [];
    for (let i = 0; i < n.length; i += 2) {
      const px = ox + n[i], py = -(oy + n[i + 1]);
      minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      pts.push(`${Math.round(px)} ${Math.round(py)}`);
    }
    return cmd + pts.join(" ");
  }));
  x += g.ax;
}
const path = parts.join("");

const pad = Math.round(upem * 0.02);
const vb = [Math.floor(minX) - pad, Math.floor(minY) - pad, Math.ceil(maxX - minX) + pad * 2, Math.ceil(maxY - minY) + pad * 2];
const wordSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" role="img" aria-label="${NAME}"><path fill="${fill}" d="${path}"/></svg>\n`;

// Lockup: the icon 1.6 times the capital height, centred on the word, a gap of a third of the icon.
const icon = readFileSync(join(root, "dist/icon.svg"), "utf8");
const iconView = icon.match(/viewBox="([^"]+)"/)[1];
const iconInner = icon.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const iconSize = Math.round(vb[3] * 1.6);
const gap = Math.round(iconSize * 0.3);
const lockupW = iconSize + gap + vb[2];
const wordTop = Math.round((iconSize - vb[3]) / 2);
const lockupSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lockupW} ${iconSize}" role="img" aria-label="${NAME}">
<svg width="${iconSize}" height="${iconSize}" viewBox="${iconView}">${iconInner}</svg>
<svg x="${iconSize + gap}" y="${wordTop}" width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(" ")}"><path fill="${fill}" d="${path}"/></svg>
</svg>\n`;

mkdirSync(join(root, "dist/brand"), { recursive: true });
writeFileSync(join(root, "dist/brand/wordmark.svg"), wordSvg(INK));
writeFileSync(join(root, "dist/brand/wordmark-light.svg"), wordSvg(PAPER));
writeFileSync(join(root, "dist/brand/lockup.svg"), lockupSvg(INK));
writeFileSync(join(root, "dist/brand/lockup-light.svg"), lockupSvg(PAPER));
console.log(`Wordmark ${vb[2]}×${vb[3]} units, ratio ${(vb[2] / vb[3]).toFixed(3)} → dist/brand/`);
