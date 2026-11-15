// One source of truth for titles, descriptions and structured data.
// Used by the prerender script (static HTML per route) and by the client
// when the route changes inside the single-page app.
import { PRODUCTS, getProduct, CATEGORIES } from './data/products';

export const SITE_URL = 'https://denysovski.github.io/VaultX';
export const SITE_NAME = 'VAULTX';

/** GitHub Pages serves /shop as /shop/ (301), so canonical URLs carry the trailing slash. */
export const canonical = (path: string) => `${SITE_URL}${path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`}`;

export interface Meta {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** image key (images.json) of the largest image above the fold, preloaded in the static HTML */
  lcp?: { src: string; sizes: string };
  /** absolute image URL for social previews */
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: object[];
}

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description: 'Dystopian streetwear label from Prague. Heavy garments for the after-hours city.',
};

const crumbs = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: canonical(path) })),
});

export function getMeta(pathname: string): Meta {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') {
    return {
      path,
      title: 'VAULTX: dystopian streetwear from Prague',
      description: 'Heavy black hoodies, knitwear, leather outerwear, tees, caps and belts. Drop 07 Curfew: tracked shipping, free over €200, 30-day returns.',
      jsonLd: [
        org,
        { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/`, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/shop/?q={query}`, 'query-input': 'required name=query' } },
      ],
    };
  }

  if (path === '/shop') {
    return {
      path,
      title: 'New arrivals | VAULTX',
      description: `All ${PRODUCTS.length} pieces from Drop 07: ${CATEGORIES.map((c) => c.label.toLowerCase()).join(', ')}. Filter by size, price and stock.`,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: canonical(`/shop/${p.slug}`), name: p.name })),
        },
        crumbs([['Home', '/'], ['Shop', '/shop']]),
      ],
    };
  }

  const m = path.match(/^\/shop\/([a-z0-9-]+)$/);
  if (m) {
    const p = getProduct(m[1]);
    if (p) {
      const inStock = Object.values(p.stock).some((n) => n > 0);
      return {
        path,
        title: `${p.name} | VAULTX`,
        description: `${p.name}: ${p.spec}. €${p.price}. ${p.description}`.slice(0, 158),
        ogImage: p.image,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.name,
            sku: p.code,
            description: p.description,
            brand: { '@type': 'Brand', name: SITE_NAME },
            image: [p.image],
            offers: {
              '@type': 'Offer',
              price: p.price,
              priceCurrency: 'EUR',
              availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: canonical(path),
            },
          },
          crumbs([['Home', '/'], ['Shop', '/shop'], [p.name, path]]),
        ],
      };
    }
  }

  const fixed: Record<string, Omit<Meta, 'path'>> = {
    '/lookbook': {
      title: 'The Bloc, lookbook | VAULTX',
      description: 'The people and places around VAULTX. Fifteen frames shot by Christian Agbede, from the market to the back seat at 02:40.',
    },
    '/help': {
      title: 'Help desk: delivery, returns and order tracking | VAULTX',
      description: 'Track an order, report a late, damaged or missing parcel, start a return or message the studio. Replies within one working day.',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
      ],
    },
    '/account': { title: 'Your account | VAULTX', description: 'Sign in or create a VAULTX account to see your orders and check out faster.', noindex: true },
    '/checkout': { title: 'Checkout | VAULTX', description: 'Secure checkout.', noindex: true },
    '/privacy': { title: 'Privacy policy | VAULTX', description: 'What VAULTX stores, where it stays and how to remove it. This shop keeps your data in your own browser only.' },
    '/terms': { title: 'Terms of sale | VAULTX', description: 'Ordering, prices, delivery, returns and warranty terms for the VAULTX store.' },
  };
  if (fixed[path]) return { path, ...fixed[path] };
  if (path.startsWith('/order/')) return { path, title: 'Order confirmed | VAULTX', description: 'Your order is confirmed.', noindex: true };

  return { path, title: 'Page not found | VAULTX', description: 'This page does not exist, or it has been moved.', noindex: true };
}

export const FAQ: [string, string][] = [
  ['Where do you ship?', 'Everywhere in the EU, plus the UK, Switzerland, Norway and the US. Orders leave our Prague warehouse within one working day.'],
  ['How much is shipping?', 'Standard delivery is €8, express €18 and pickup point €4. Standard delivery is free on orders over €200.'],
  ['Will I pay customs?', 'Not inside the EU. Orders to the UK, Switzerland, Norway and the US may be charged import duty by the courier on delivery.'],
  ['How do returns work?', 'You have 30 days from delivery. Start a return from this page, print the label and drop the parcel at any pickup point. Refunds land within 5 working days of us receiving it.'],
  ['My parcel shows delivered but I do not have it', 'Check with neighbours and your building reception first, then report it below within 7 days. We open a claim with the courier and send a replacement or refund once it is confirmed.'],
  ['How do your sizes run?', 'Hoodies and outerwear are boxy, tees are regular. Every product page has measurements and a note on how the model wears it.'],
];
