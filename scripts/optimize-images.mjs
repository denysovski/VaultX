// Turns the raw downloads (Unsplash photos, pngimg garment cut-outs) into
// AVIF + WebP files at a few widths, and writes src/data/images.json with
// the real dimensions so every <img> can reserve its space (no layout shift).
//
// Usage: node scripts/optimize-images.mjs <raw-folder>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const RAW = process.argv[2];
if (!RAW) throw new Error('Pass the folder with the raw downloads');
const OUT = path.resolve('public/img');
const manifest = {};

// Unsplash photos by Christian Agbede (@chriscreations__)
const photos = {
  'yellow-sky': 'vx-test.webp',
  scarf: 'vx-u-scarf.jpg',
  car: 'vx-u-car.jpg',
  concert: 'vx-u-concert.jpg',
  rings: 'vx-u-rings.jpg',
  suit: 'vx-u-suit.jpg',
  'market-veg': 'vx-u-market-veg.jpg',
  'orange-dress': 'vx-u-orange-dress.jpg',
  'market-crates': 'vx-u-market-crates.jpg',
  'oranges-stall': 'vx-u-oranges-stall.jpg',
  offshoulder: 'vx-u-offshoulder.jpg',
  reading: 'vx-u-reading.jpg',
  'holding-orange': 'vx-u-holding-orange.jpg',
  'cover-face': 'vx-u-cover-face.jpg',
  produce: 'vx-u-produce.jpg',
};

// Transparent garment cut-outs from pngimg.com
const garments = {
  'hoodie-black': 'hoodie_PNG19.png',
  'hoodie-ash': 'hoodie_PNG30.png',
  'hoodie-bone': 'hoodie_PNG4.png',
  'tee-black': 'tshirt_PNG5427.png',
  'tee-ash': 'tshirt_PNG5448.png',
  'tee-bone': 'tshirt_PNG5434.png',
  'tee-flare': 'tshirt_PNG5449.png',
  'tee-teal': 'tshirt_PNG5450.png',
  'leather-black': 'jacket_PNG8025.png',
  'bomber-graphite': 'jacket_PNG8047.png',
  // brand mark on the chest removed with OpenCV inpainting before export
  'shell-acid': 'jacket_PNG8051-clean.png',
  'denim-indigo': 'jeans_PNG5779.png',
  'denim-wash': 'jeans_PNG5778.png',
  'cap-black': 'cap_PNG5685.png',
  'cap-bone': 'cap_PNG5688.png',
};

async function emit(pipeline, dir, name, widths, quality) {
  fs.mkdirSync(dir, { recursive: true });
  const base = await pipeline.toBuffer({ resolveWithObject: true });
  const { width, height } = base.info;
  const made = [];
  for (const w of widths) {
    if (w > width && made.length) continue;
    const target = Math.min(w, width);
    const img = sharp(base.data).resize({ width: target });
    await img.clone().avif({ quality: quality.avif, effort: 6 }).toFile(path.join(dir, `${name}-${target}.avif`));
    await img.clone().webp({ quality: quality.webp, effort: 6, alphaQuality: 90 }).toFile(path.join(dir, `${name}-${target}.webp`));
    made.push(target);
  }
  return { w: width, h: height, sizes: made };
}

const ONLY = process.env.ONLY; // "photo" or "garment" to redo one group

for (const [name, file] of Object.entries(ONLY === 'garment' ? {} : photos)) {
  const p = sharp(path.join(RAW, file)).rotate().resize({ width: 1800, withoutEnlargement: true });
  manifest[`look/${name}`] = await emit(p, path.join(OUT, 'look'), name, [640, 1080, 1800], { avif: 52, webp: 74 });
  console.log('photo', name);
}

for (const [name, file] of Object.entries(ONLY === 'photo' ? {} : garments)) {
  const p = sharp(path.join(RAW, `vx-p-${file}`))
    .trim({ threshold: 1 })
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png();
  manifest[`garment/${name}`] = await emit(p, path.join(OUT, 'garment'), name, [480, 900, 1400], { avif: 60, webp: 80 });
  console.log('garment', name);
}

fs.mkdirSync('src/data', { recursive: true });
const prev = ONLY && fs.existsSync('src/data/images.json') ? JSON.parse(fs.readFileSync('src/data/images.json', 'utf8')) : {};
fs.writeFileSync('src/data/images.json', JSON.stringify({ ...prev, ...manifest }, null, 2));
