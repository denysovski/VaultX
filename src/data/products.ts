// Product images are hotlinked from Pinterest search results (pins of
// "png clothes", hoodies, knitwear, caps, beanies and belts). Rights stay with
// their owners; see the README. Every image is shown in the same 4:5 frame,
// in greyscale, multiplied onto the card colour, so mixed sources read as one set.

export type Category = 'hoodies' | 'knitwear' | 'outerwear' | 'tees' | 'headwear' | 'belts';

export interface Product {
  slug: string;
  code: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  /** short spec line shown as small text */
  spec: string;
  description: string;
  sizes: string[];
  /** units left per size (demo stock) */
  stock: Record<string, number>;
  isNew?: boolean;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'knitwear', label: 'Knitwear' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'tees', label: 'Tees' },
  { id: 'headwear', label: 'Headwear' },
  { id: 'belts', label: 'Belts' },
];

const PIN = (path: string) => `https://i.pinimg.com/736x/${path}`;
const TOPS = ['XS', 'S', 'M', 'L', 'XL'];
const st = (sizes: string[], left: number[]) => Object.fromEntries(sizes.map((s, i) => [s, left[i] ?? 0]));

export const PRODUCTS: Product[] = [
  // hoodies
  { slug: 'static-hoodie', code: 'VX-HD-STC', name: 'Static Hoodie', category: 'hoodies', price: 140, image: PIN('96/38/7c/96387c401cd00f5a6e88d8915b864f4f.jpg'), spec: '480 gsm / boxy / black', description: 'A heavy, plain hoodie with a deep hood and dropped shoulders. No print, no logo, nothing to read.', sizes: TOPS, stock: st(TOPS, [3, 8, 0, 6, 2]), isNew: true },
  { slug: 'bunker-hoodie', code: 'VX-HD-BNK', name: 'Bunker Hoodie', category: 'hoodies', price: 160, image: PIN('cb/15/44/cb1544a49191fd58d615435eaabdbc78.jpg'), spec: '520 gsm / cropped / black', description: 'Cropped at the hip, cut wide in the body. Brushed inside, ribbed tight at the cuffs.', sizes: TOPS, stock: st(TOPS, [2, 5, 7, 4, 1]), isNew: true },
  { slug: 'signal-zip-hoodie', code: 'VX-HD-SGN', name: 'Signal Zip Hoodie', category: 'hoodies', price: 170, image: PIN('c4/62/bb/c462bb6929f69dd168e38db155a65437.jpg'), spec: '500 gsm / two-way zip / black', description: 'Full two-way zip up to the chin, oversized hood, hand pockets lined in fleece.', sizes: TOPS, stock: st(TOPS, [1, 4, 6, 3, 0]) },
  { slug: 'ash-wash-hoodie', code: 'VX-HD-ASH', name: 'Ash Wash Hoodie', category: 'hoodies', price: 165, image: PIN('bb/f0/27/bbf027ab6019e540d63e18ac81ab69c0.jpg'), spec: '480 gsm / sun-faded / washed black', description: 'Garment dyed, then washed down until the black turns to ash at every seam.', sizes: TOPS, stock: st(TOPS, [0, 3, 5, 5, 2]) },
  { slug: 'curfew-zip-hoodie', code: 'VX-HD-CRF', name: 'Curfew Zip Hoodie', category: 'hoodies', price: 150, image: PIN('f5/4b/82/f54b829f3f021533a1fee953ef695241.jpg'), spec: '450 gsm / zip / faded black', description: 'A short zip hoodie with a soft, broken-in hand. Made to sit under a shell.', sizes: TOPS, stock: st(TOPS, [2, 2, 4, 3, 1]) },

  // knitwear
  { slug: 'thorn-knit', code: 'VX-KN-THR', name: 'Thorn Knit', category: 'knitwear', price: 190, image: PIN('78/63/55/786355518941d48fd434ca6e51d2506c.jpg'), spec: 'jacquard / wool blend / black', description: 'Jacquard thorns climb from the hem to the chest. Dense, warm, slightly scratchy, on purpose.', sizes: TOPS, stock: st(TOPS, [1, 3, 4, 2, 1]), isNew: true },
  { slug: 'arachne-knit', code: 'VX-KN-ARC', name: 'Arachne Knit', category: 'knitwear', price: 180, image: PIN('f4/66/83/f46683058e3fde9898a3db040f9ff964.jpg'), spec: 'intarsia / boxy / charcoal', description: 'One tonal spider on the chest, barely there until the light hits it.', sizes: TOPS, stock: st(TOPS, [0, 2, 5, 3, 2]), isNew: true },
  { slug: 'decay-knit', code: 'VX-KN-DCY', name: 'Decay Knit', category: 'knitwear', price: 175, image: PIN('36/37/5b/36375bf695819fde99c0bd5ceb5440b0.jpg'), spec: 'distressed / raw hem / grey', description: 'Holes and ladders worked in by hand, raw edges at the hem and cuffs. No two the same.', sizes: TOPS, stock: st(TOPS, [2, 4, 3, 0, 1]) },
  { slug: 'fray-knit', code: 'VX-KN-FRY', name: 'Fray Knit', category: 'knitwear', price: 170, image: PIN('84/6e/31/846e31179139fed70bb3001d7e0edd8b.jpg'), spec: 'cotton knit / frayed / black', description: 'A plain black knit with frayed neck and hem. Looks better the more it falls apart.', sizes: TOPS, stock: st(TOPS, [3, 5, 6, 4, 2]) },
  { slug: 'blank-knit', code: 'VX-KN-BLK', name: 'Blank Knit', category: 'knitwear', price: 150, image: PIN('a4/4b/e6/a44be6a30e785aa1e033d9841bff1d6d.jpg'), spec: 'merino / regular / black', description: 'The quiet one. Fine merino, regular fit, nothing on it.', sizes: TOPS, stock: st(TOPS, [4, 6, 6, 5, 3]) },
  { slug: 'shelter-turtleneck', code: 'VX-KN-SHL', name: 'Shelter Turtleneck', category: 'knitwear', price: 160, image: PIN('de/da/88/deda888bb8fb65dba59ebd50b382119b.jpg'), spec: 'wool / high neck / black', description: 'A tall, folded neck that covers the chin when the wind turns.', sizes: TOPS, stock: st(TOPS, [1, 3, 2, 2, 0]) },
  { slug: 'fallen-star-knit', code: 'VX-KN-STR', name: 'Fallen Star Knit', category: 'knitwear', price: 185, image: PIN('71/06/da/7106dad26406403158c68d56ddfd2824.jpg'), spec: 'intarsia / oversized / black, bone', description: 'One broken star across the front, knitted in bone on black.', sizes: TOPS, stock: st(TOPS, [0, 1, 3, 2, 1]) },

  // outerwear
  { slug: 'breach-leather-jacket', code: 'VX-OW-BRC', name: 'Breach Leather Jacket', category: 'outerwear', price: 590, image: PIN('98/51/59/98515992ddebc4ede930bf6630b720c0.jpg'), spec: 'lambskin / hooded / washed black', description: 'Washed lambskin with a hood, stitched seams that ride over the shoulders and a cropped hem.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 1, M: 2, L: 1, XL: 0 }, isNew: true },
  { slug: 'riot-leather-hood', code: 'VX-OW-RIT', name: 'Riot Leather Hood', category: 'outerwear', price: 620, image: PIN('d5/23/26/d52326e636e7b3247d06af7a7b2838af.jpg'), spec: 'lambskin / panelled / black', description: 'Panelled leather with a deep hood and boxy body. Heavier than it looks.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 0, M: 2, L: 2, XL: 1 } },
  { slug: 'ruin-leather-jacket', code: 'VX-OW-RUN', name: 'Ruin Leather Jacket', category: 'outerwear', price: 610, image: PIN('f7/93/5a/f7935acbf0655909cc437a0c3a4281ab.jpg'), spec: 'distressed leather / strapped / black', description: 'Scuffed by hand, then strapped across the sleeves. Bought new, looks lived in.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 1, M: 1, L: 0, XL: 1 } },
  { slug: 'sector-bomber', code: 'VX-OW-SCT', name: 'Sector Bomber', category: 'outerwear', price: 340, image: PIN('9e/f6/83/9ef68327df3ce0fc168c19c6a242c9b4.jpg'), spec: 'nylon / buckled collar / black', description: 'A padded bomber with a buckled collar and a short, ribbed hem.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 3, M: 4, L: 2, XL: 1 } },
  { slug: 'grid-shell', code: 'VX-OW-GRD', name: 'Grid Shell', category: 'outerwear', price: 380, image: PIN('79/4d/ef/794deff38c59a297ed67f24a3f5d6829.jpg'), spec: '3-layer / taped / black', description: 'A waterproof shell built in panels, with a peaked hood and pockets on every layer.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 2, M: 3, L: 3, XL: 2 }, isNew: true },
  { slug: 'nightline-anorak', code: 'VX-OW-NGT', name: 'Nightline Anorak', category: 'outerwear', price: 290, image: PIN('f9/b5/ea/f9b5eaf14dab5030283fe57fca2e76db.jpg'), spec: 'ripstop / pull-over / black', description: 'Pull-over anorak with a high neck, packable hood and toggles at the hem.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 2, M: 0, L: 3, XL: 2 } },
  { slug: 'vault-puffer', code: 'VX-OW-VLT', name: 'Vault Puffer', category: 'outerwear', price: 420, image: PIN('95/da/a5/95daa549b31190f597bf7f14a88fd4d8.jpg'), spec: 'coated / down fill / black', description: 'Coated outer, down fill, a hood that zips shut over the face.', sizes: ['S', 'M', 'L', 'XL'], stock: { S: 1, M: 2, L: 2, XL: 0 } },

  // tees
  { slug: 'ration-tee', code: 'VX-TS-RTN', name: 'Ration Tee', category: 'tees', price: 55, image: PIN('b6/f1/7e/b6f17e8fa93370c4ac43c7de51102992.jpg'), spec: '260 gsm / boxy / black', description: 'The everyday ration. Dense jersey, tight neck, boxy body.', sizes: TOPS, stock: st(TOPS, [8, 12, 10, 9, 5]) },
  { slug: 'blank-tee', code: 'VX-TS-BLK', name: 'Blank Tee', category: 'tees', price: 45, image: PIN('81/bd/4f/81bd4f86f36d64d37acd1ad12d7cfb5c.jpg'), spec: '220 gsm / regular / black', description: 'Lighter, longer, regular fit. The one under everything else.', sizes: TOPS, stock: st(TOPS, [6, 9, 11, 7, 4]) },
  { slug: 'heavy-tee', code: 'VX-TS-HVY', name: 'Heavy Tee', category: 'tees', price: 60, image: PIN('4f/95/cd/4f95cd68e185f65b1a421c91ba89591f.jpg'), spec: '300 gsm / oversized / black', description: 'Our heaviest jersey, cut wide and short so it hangs square from the shoulders.', sizes: TOPS, stock: st(TOPS, [2, 6, 8, 6, 3]) },
  { slug: 'fist-tee', code: 'VX-TS-FST', name: 'Fist Tee', category: 'tees', price: 65, image: PIN('15/c1/e5/15c1e5bb6651de727f4b027e23768138.jpg'), spec: '260 gsm / print / washed black', description: 'A cracked print on washed black, raw-cut at the sleeves and hem.', sizes: TOPS, stock: st(TOPS, [0, 3, 4, 2, 1]), isNew: true },

  // headwear
  { slug: 'ruin-cap', code: 'VX-HW-RUN', name: 'Ruin Cap', category: 'headwear', price: 60, image: PIN('c8/98/89/c898896e2a433cf7344df04c9aa5014c.jpg'), spec: 'distressed / raw brim / black', description: 'Torn at the brim, faded at the seams. Strap closure.', sizes: ['One size'], stock: { 'One size': 6 } },
  { slug: 'docker-beanie', code: 'VX-HW-DCK', name: 'Docker Beanie', category: 'headwear', price: 45, image: PIN('1b/68/de/1b68de982cf83366747444e18bef33cf.jpg'), spec: 'rib knit / short / grey', description: 'A short rib beanie that sits above the ears.', sizes: ['One size'], stock: { 'One size': 11 } },
  { slug: 'web-beanie', code: 'VX-HW-WEB', name: 'Web Beanie', category: 'headwear', price: 50, image: PIN('a8/c2/1a/a8c21a653de200f328f8e8cb891fc571.jpg'), spec: 'jacquard / long / black, bone', description: 'A long beanie with a web knitted in bone around the crown.', sizes: ['One size'], stock: { 'One size': 0 } },
  { slug: 'rot-beanie', code: 'VX-HW-ROT', name: 'Rot Beanie', category: 'headwear', price: 50, image: PIN('24/f6/05/24f60526964c1d3d97aac39e9c0cca0a.jpg'), spec: 'distressed knit / black', description: 'Holes worked in by hand, with a small woven label at the fold.', sizes: ['One size'], stock: { 'One size': 7 } },

  // belts
  { slug: 'rivet-belt', code: 'VX-BL-RVT', name: 'Rivet Belt', category: 'belts', price: 85, image: PIN('d3/91/16/d391164a72b59e80266104f954023617.jpg'), spec: 'leather / studded / 35 mm', description: 'Full-grain leather with a single row of studs and a squared buckle.', sizes: ['80', '90', '100'], stock: { '80': 3, '90': 5, '100': 2 } },
  { slug: 'double-rivet-belt', code: 'VX-BL-DBL', name: 'Double Rivet Belt', category: 'belts', price: 95, image: PIN('80/0a/e9/800ae9ab37f0b5c676dc5d88e849eb56.jpg'), spec: 'leather / double row / 40 mm', description: 'Two rows of studs and a heavy roller buckle. Worn low.', sizes: ['80', '90', '100'], stock: { '80': 1, '90': 2, '100': 2 }, isNew: true },
  { slug: 'line-belt', code: 'VX-BL-LNE', name: 'Line Belt', category: 'belts', price: 65, image: PIN('0d/7f/72/0d7f72b8174a2bb5b9aae77463fdfaf3.jpg'), spec: 'leather / slim / 25 mm', description: 'A slim black belt with a plain silver buckle. Nothing more.', sizes: ['80', '90', '100'], stock: { '80': 4, '90': 6, '100': 3 } },
  { slug: 'bastion-belt', code: 'VX-BL-BST', name: 'Bastion Belt', category: 'belts', price: 110, image: PIN('60/1c/05/601c059aeb65d2fbb7dc8d0716c3ea7f.jpg'), spec: 'leather / cast buckle / 40 mm', description: 'A wide belt with a heavy cast buckle, the centre of any outfit.', sizes: ['80', '90', '100'], stock: { '80': 0, '90': 2, '100': 1 } },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const totalStock = (p: Product) => Object.values(p.stock).reduce((a, b) => a + b, 0);

export const FREE_SHIPPING_FROM = 200;

export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', detail: '3 to 5 working days, tracked', price: 8, days: [3, 5] },
  { id: 'express', label: 'Express', detail: '1 to 2 working days, tracked and signed', price: 18, days: [1, 2] },
  { id: 'pickup', label: 'Pickup point', detail: '2 to 4 working days', price: 4, days: [2, 4] },
] as const;

export type ShippingId = (typeof SHIPPING_METHODS)[number]['id'];

export const PROMO_CODES: Record<string, number> = { VAULT10: 0.1, CURFEW: 0.15 };
