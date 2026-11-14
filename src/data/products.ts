export type Category = 'hoodies' | 'tees' | 'outerwear' | 'denim' | 'headwear';

export interface Colourway {
  id: string;
  name: string;
  /** swatch colour, used only for the small dot */
  hex: string;
  /** key in images.json, without the "garment/" prefix */
  image: string;
  /** units left per size, demo stock */
  stock: Record<string, number>;
}

export interface Product {
  slug: string;
  code: string;
  name: string;
  category: Category;
  price: number;
  line: string;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  sizes: string[];
  colours: Colourway[];
  /** lifestyle photos (keys in images.json without "look/") */
  world: string[];
  isNew?: boolean;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Tees' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'denim', label: 'Denim' },
  { id: 'headwear', label: 'Headwear' },
];

const TOPS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const PRODUCTS: Product[] = [
  {
    slug: 'bunker-hoodie',
    code: 'VX-07-01',
    name: 'Bunker Hoodie',
    category: 'hoodies',
    price: 160,
    line: '520 gsm loopback, double hood, dropped shoulder',
    description:
      'Heavy enough to stand on its own. The double-layer hood keeps its shape after a hundred washes, the pouch is bar-tacked at every corner and the cuffs are long enough to pull over your knuckles at the bus stop.',
    fabric: '100 % organic cotton loopback, 520 gsm. Garment dyed, pre-shrunk.',
    fit: 'Boxy, dropped shoulder. Take your usual size; size down for a closer fit. Model is 186 cm and wears L.',
    care: 'Wash inside out at 30 °C. Do not tumble dry. Dry flat.',
    sizes: TOPS,
    colours: [
      { id: 'black', name: 'Blackout', hex: '#1b1b1a', image: 'hoodie-black', stock: { XS: 4, S: 11, M: 0, L: 7, XL: 3, XXL: 2 } },
      { id: 'ash', name: 'Ash', hex: '#4a4a48', image: 'hoodie-ash', stock: { XS: 2, S: 5, M: 9, L: 6, XL: 0, XXL: 1 } },
      { id: 'bone', name: 'Bone', hex: '#e9e7e1', image: 'hoodie-bone', stock: { XS: 0, S: 3, M: 6, L: 4, XL: 2, XXL: 0 } },
    ],
    world: ['scarf', 'car'],
    isNew: true,
  },
  {
    slug: 'ration-tee',
    code: 'VX-07-02',
    name: 'Ration Tee',
    category: 'tees',
    price: 65,
    line: '260 gsm jersey, tight rib neck, five colourways',
    description:
      'The everyday ration. A dense jersey that does not twist, a 2 cm rib that stays flat and a length that sits right over denim. Five colours, including two loud ones for when the city gets too grey.',
    fabric: '100 % combed cotton single jersey, 260 gsm.',
    fit: 'Regular through the body, slightly wide sleeve. True to size.',
    care: 'Wash at 30 °C with similar colours. Iron inside out.',
    sizes: TOPS,
    colours: [
      { id: 'black', name: 'Blackout', hex: '#1b1b1a', image: 'tee-black', stock: { XS: 9, S: 14, M: 12, L: 8, XL: 6, XXL: 3 } },
      { id: 'ash', name: 'Ash', hex: '#a6a6a2', image: 'tee-ash', stock: { XS: 3, S: 8, M: 10, L: 5, XL: 2, XXL: 0 } },
      { id: 'bone', name: 'Bone', hex: '#efeee9', image: 'tee-bone', stock: { XS: 5, S: 9, M: 0, L: 6, XL: 4, XXL: 2 } },
      { id: 'flare', name: 'Flare', hex: '#f2555a', image: 'tee-flare', stock: { XS: 1, S: 4, M: 6, L: 3, XL: 0, XXL: 0 } },
      { id: 'teal', name: 'Coolant', hex: '#4f8a92', image: 'tee-teal', stock: { XS: 0, S: 2, M: 5, L: 4, XL: 2, XXL: 1 } },
    ],
    world: ['concert', 'reading'],
  },
  {
    slug: 'curfew-leather-jacket',
    code: 'VX-07-03',
    name: 'Curfew Leather Jacket',
    category: 'outerwear',
    price: 690,
    line: 'Vegetable-tanned lambskin, asymmetric zip, quilted lining',
    description:
      'Cut for riding through the last hour before curfew. Asymmetric front zip, zipped cuffs and a quilted lining that keeps the cold out without adding bulk. The leather softens and darkens with every month you wear it.',
    fabric: 'Vegetable-tanned lambskin, 0.9 mm. Lining: recycled polyester with 80 g quilting.',
    fit: 'Fitted at the waist, room in the shoulders. If between sizes, size up.',
    care: 'Specialist leather clean only. Condition twice a year.',
    sizes: ['S', 'M', 'L', 'XL'],
    colours: [{ id: 'black', name: 'Blackout', hex: '#1b1b1a', image: 'leather-black', stock: { S: 2, M: 3, L: 1, XL: 0 } }],
    world: ['suit', 'rings'],
    isNew: true,
  },
  {
    slug: 'sector-bomber',
    code: 'VX-07-04',
    name: 'Sector Bomber',
    category: 'outerwear',
    price: 340,
    line: 'Waxed cotton shell, funnel collar, 8 pockets',
    description:
      'A utility bomber with a funnel collar that zips up to the chin, two inner pockets sized for a phone and a passport, and a waxed shell that shrugs off drizzle. Graphite, so it goes with everything in the vault.',
    fabric: 'Waxed cotton, 310 gsm. Lining: brushed cotton.',
    fit: 'Relaxed, cropped at the hip. True to size.',
    care: 'Do not wash. Wipe clean, re-wax once a season.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colours: [{ id: 'graphite', name: 'Graphite', hex: '#3d3d3b', image: 'bomber-graphite', stock: { S: 3, M: 7, L: 5, XL: 4, XXL: 2 } }],
    world: ['market-crates', 'holding-orange'],
  },
  {
    slug: 'hazard-shell',
    code: 'VX-07-05',
    name: 'Hazard Shell',
    category: 'outerwear',
    price: 280,
    line: '3-layer waterproof shell in high-visibility acid',
    description:
      'The loudest thing we make. A packable, fully taped 3-layer shell in a colour you can see from the other end of the platform. 20,000 mm waterproof, vents under both arms, packs into its own chest pocket.',
    fabric: '3-layer recycled nylon, 20k / 20k membrane, fully taped seams.',
    fit: 'Regular, cut long at the back to cover a hoodie. True to size.',
    care: 'Wash at 30 °C, tumble dry low to reactivate the water repellency.',
    sizes: ['S', 'M', 'L', 'XL'],
    colours: [{ id: 'acid', name: 'Acid', hex: '#d4f21b', image: 'shell-acid', stock: { S: 4, M: 6, L: 2, XL: 1 } }],
    world: ['yellow-sky', 'offshoulder'],
    isNew: true,
  },
  {
    slug: 'grid-denim',
    code: 'VX-07-06',
    name: 'Grid Denim',
    category: 'denim',
    price: 190,
    line: '14 oz selvedge, straight leg, hand-distressed',
    description:
      'Straight, slightly tapered, made from Japanese 14 oz selvedge and hand-distressed so every pair is a little different. Two washes: deep Indigo and a sun-faded Wash.',
    fabric: '100 % cotton selvedge denim, 14 oz.',
    fit: 'Straight leg with a slight taper. Mid rise. Inside leg 82 cm on size 32.',
    care: 'Wash rarely, cold and inside out. Hang dry.',
    sizes: ['28', '30', '32', '34', '36'],
    colours: [
      { id: 'indigo', name: 'Indigo', hex: '#2c3d5a', image: 'denim-indigo', stock: { '28': 2, '30': 5, '32': 6, '34': 3, '36': 1 } },
      { id: 'wash', name: 'Wash', hex: '#8fa6c2', image: 'denim-wash', stock: { '28': 0, '30': 3, '32': 4, '34': 2, '36': 0 } },
    ],
    world: ['market-veg', 'produce'],
  },
  {
    slug: 'blackout-cap',
    code: 'VX-07-07',
    name: 'Blackout Cap',
    category: 'headwear',
    price: 55,
    line: 'Six-panel twill, flat strap, one size',
    description:
      'A clean six-panel cap with a structured crown and a brim that is pre-curved just enough. A flat cotton strap adjusts at the back. Nothing on the front, on purpose.',
    fabric: 'Cotton twill, 280 gsm. Brass buckle.',
    fit: 'One size, adjustable 54 to 61 cm.',
    care: 'Spot clean. Do not machine wash.',
    sizes: ['One size'],
    colours: [
      { id: 'black', name: 'Blackout', hex: '#1b1b1a', image: 'cap-black', stock: { 'One size': 18 } },
      { id: 'bone', name: 'Bone', hex: '#efeee9', image: 'cap-bone', stock: { 'One size': 0 } },
    ],
    world: ['cover-face', 'orange-dress'],
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const totalStock = (c: Colourway) => Object.values(c.stock).reduce((a, b) => a + b, 0);

export const FREE_SHIPPING_FROM = 200;

export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', detail: '3 to 5 working days, tracked', price: 8, days: [3, 5] },
  { id: 'express', label: 'Express', detail: '1 to 2 working days, tracked and signed', price: 18, days: [1, 2] },
  { id: 'pickup', label: 'Pickup point', detail: '2 to 4 working days, collect within 7 days', price: 4, days: [2, 4] },
] as const;

export type ShippingId = (typeof SHIPPING_METHODS)[number]['id'];

export const PROMO_CODES: Record<string, number> = { VAULT10: 0.1, CURFEW: 0.15 };
