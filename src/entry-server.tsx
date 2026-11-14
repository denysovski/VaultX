import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import App from './App';

export { getMeta, SITE_URL, canonical } from './seo';
export { PRODUCTS } from './data/products';

/** Renders a route to HTML, waiting for every lazy page chunk to resolve. */
export async function render(url: string) {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
    // Never split Suspense boundaries into streamed chunks: the output must be
    // plain HTML with no inline scripts, so the strict CSP (script-src 'self') holds.
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
  );
  return new Response(prelude).text();
}
