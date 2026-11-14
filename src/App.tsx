import { Suspense } from 'react';
import { lazyPage } from './lib/lazy';
import { Routes, Route } from 'react-router';
import { StoreProvider } from './lib/store';
import { Nav } from './components/Nav';
import { BagDrawer } from './components/Bag';
import { Footer, Toasts, StorageNotice, OfflineBar, Seo, RouteFocus } from './components/Chrome';
import Home from './pages/Home';

// Every page except the landing page is its own chunk (loaded on demand).
const Shop = lazyPage(() => import('./pages/Shop'));
const ProductPage = lazyPage(() => import('./pages/Product'));
const Lookbook = lazyPage(() => import('./pages/Lookbook'));
const Checkout = lazyPage(() => import('./pages/Checkout'));
const OrderDone = lazyPage(() => import('./pages/OrderDone'));
const Account = lazyPage(() => import('./pages/Account'));
const Help = lazyPage(() => import('./pages/Help'));
const Legal = lazyPage(() => import('./pages/Legal'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

/** Loads the chunk for a path before hydration (see main.tsx). */
export function preloadPath(path: string) {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return Promise.resolve();
  if (p === '/shop') return Shop.preload();
  if (p.startsWith('/shop/')) return ProductPage.preload();
  if (p === '/lookbook') return Lookbook.preload();
  if (p === '/checkout') return Checkout.preload();
  if (p.startsWith('/order/')) return OrderDone.preload();
  if (p === '/account') return Account.preload();
  if (p === '/help') return Help.preload();
  if (p === '/privacy' || p === '/terms') return Legal.preload();
  return NotFound.preload();
}

function PageLoading() {
  return (
    <div className="page-loading" aria-busy="true" aria-label="Loading page">
      <div className="skeleton skeleton--title" />
      <div className="skeleton-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton skeleton--card" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Seo />
      <RouteFocus />
      <OfflineBar />
      <Nav />
      <main id="main">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ProductPage />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDone />} />
            <Route path="/account" element={<Account />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BagDrawer />
      <Toasts />
      <StorageNotice />
    </StoreProvider>
  );
}
