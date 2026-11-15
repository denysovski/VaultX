// Renders every public route to static HTML after `vite build`, so search
// engines and link previews get real content, titles and structured data,
// and GitHub Pages answers each URL with a 200 instead of the SPA fallback.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = path.resolve('dist');
const { render, getMeta, SITE_URL, canonical, PRODUCTS } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const images = JSON.parse(fs.readFileSync(path.resolve('src/data/images.json'), 'utf8'));
const BASE = (process.env.BASE ?? '/VaultX/').replace(/\/$/, '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// JSON-LD lives in a <script>; escape "<" so no value can close the tag.
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const routes = ['/', '/shop', ...PRODUCTS.map((p) => `/shop/${p.slug}`), '/lookbook', '/help', '/account', '/checkout', '/privacy', '/terms'];

function head(m) {
  const url = canonical(m.path);
  const image = m.ogImage ?? `${SITE_URL}${m.image ?? '/og.jpg'}`;
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="robots" content="${m.noindex ? 'noindex, follow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${m.path.startsWith('/shop/') ? 'product' : 'website'}" />`,
    `<meta property="og:site_name" content="VAULTX" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(m.path === '/' ? [`<link rel="preload" as="image" href="${BASE}/video/hero-poster.jpg" fetchpriority="high" />`] : []),
    ...(m.lcp && images[m.lcp.src]
      ? [`<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesrcset="${images[m.lcp.src].sizes.map((w) => `${BASE}/img/${m.lcp.src}-${w}.avif ${w}w`).join(', ')}" imagesizes="${m.lcp.sizes}" />`]
      : []),
    ...(m.jsonLd ?? []).map((o) => `<script type="application/ld+json">${ld(o)}</script>`),
  ].join('\n    ');
}

async function page(route, file, dataPath = route) {
  const html = await render(route);
  const out = template
    .replace('<!--app-head-->', head(getMeta(route)))
    .replace('<!--app-path-->', dataPath)
    .replace('<!--app-html-->', html);
  const target = path.join(DIST, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, out);
}

for (const r of routes) await page(r, r === '/' ? 'index.html' : `${r.slice(1)}/index.html`);
// GitHub Pages serves 404.html for unknown paths; the client re-renders the real route.
await page('/__not-found__', '404.html', '/__not-found__');

const today = new Date().toISOString().slice(0, 10);
const indexable = routes.filter((r) => !getMeta(r).noindex);
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
    .map((r) => `  <url><loc>${canonical(r)}</loc><lastmod>${today}</lastmod><priority>${r === '/' ? '1.0' : r.startsWith('/shop') ? '0.8' : '0.5'}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);
fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
console.log(`prerendered ${routes.length} routes + 404, sitemap with ${indexable.length} urls`);
