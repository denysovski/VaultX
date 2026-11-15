// Measures each product photo once and writes src/data/fit.json, so every
// hotlinked image can be framed the same way without editing the files:
//   s, x, y  scale and offset that put the garment's bounding box in the
//            middle of the 4:5 card, filling the same share of it
//   b        brightness boost that turns an off-white or grey backdrop white
//            (the card then shows through via mix-blend-mode: multiply)
// Usage: node scripts/fit-products.mjs <folder with the downloaded images>
// (file names: the Pinterest path with "/" replaced by "_")
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.argv[2];
const FRAME = 0.8; // width / height of the card
const FILL = 0.8; // share of the frame the garment should occupy
const prev = fs.existsSync('src/data/fit.json') ? JSON.parse(fs.readFileSync('src/data/fit.json', 'utf8')) : {};
const out = {};

for (const file of fs.readdirSync(DIR)) {
  const { data, info } = await sharp(path.join(DIR, file)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const border = [];
  for (let x = 0; x < w; x += 4) border.push(data[x], data[(h - 1) * w + x]);
  for (let y = 0; y < h; y += 4) border.push(data[y * w], data[y * w + w - 1]);
  border.sort((a, b) => a - b);
  const bg = border[border.length >> 1];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (Math.abs(data[y * w + x] - bg) > 22) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
  const c = Math.min(FRAME / w, 1 / h); // object-fit: contain in a FRAME x 1 box
  const s = Math.min((FRAME * FILL) / (bw * c), FILL / (bh * c));
  const offX = ((x0 + bw / 2) - w / 2) * c;
  const offY = ((y0 + bh / 2) - h / 2) * c;
  const key = file.replace(/_/g, '/');
  out[key] = {
    s: +s.toFixed(3),
    x: +((-offX * s) / FRAME * 100).toFixed(2),
    y: +(-offY * s * 100).toFixed(2),
    b: +Math.min(1.35, Math.max(1, 250 / Math.max(bg, 1))).toFixed(3),
    ...(prev[key]?.crop ? { crop: prev[key].crop } : {}), // hand-set crops survive a re-run
  };
}
fs.writeFileSync('src/data/fit.json', JSON.stringify(out, null, 2));
console.log(Object.keys(out).length, 'images measured');
