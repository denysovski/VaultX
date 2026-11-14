import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App, { preloadPath } from './App';
import './styles.css';

const el = document.getElementById('root')!;
// Enables the scroll reveals only when JavaScript runs (content stays visible without it).
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('js-motion');
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const tree = (
  <StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Hydrate when the static HTML was rendered for this exact path; otherwise
// (404.html fallback on GitHub Pages, dev server) render from scratch.
const here = (window.location.pathname.slice(base.length) || '/').replace(/\/+$/, '') || '/';
// Load the current page's chunk first, so hydration finds everything ready.
preloadPath(here).finally(() => {
  // Query strings (filters, colour) change the markup, so those loads render fresh.
  if (el.dataset.path === here && !window.location.search && el.firstElementChild) hydrateRoot(el, tree);
  else {
    el.textContent = '';
    createRoot(el).render(tree);
  }
});
