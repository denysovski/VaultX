import { Suspense } from 'react';
import { lazyPage } from './lib/lazy';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { StoreProvider } from './lib/store';
import { Nav } from './components/Nav';
import { BagDrawer } from './components/Bag';
import { Footer, Toasts, PromoPopup, OfflineBar, Seo, RouteFocus } from './components/Chrome';
import Home from './pages/Home';

// Every page except the landing page is its own chunk (loaded on demand).
const Shop = lazyPage(() => import('./pages/Shop'));
const ProductPage = lazyPage(() => import('./pages/Product'));
const About = lazyPage(() => import('./pages/About'));
const New = lazyPage(() => import('./pages/New'));
const Collab = lazyPage(() => import('./pages/Collab'));
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
  if (p === '/about') return About.preload();
  if (p === '/new') return New.preload();
  if (p.startsWith('/collab/')) return Collab.preload();
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

/** Each page enters with a short fade, lift and un-blur when the route changes. */
function Page({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
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
          <Page>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<ProductPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/new" element={<New />} />
            <Route path="/collab/:group" element={<Collab />} />
            <Route path="/lookbook" element={<Navigate to="/about" replace />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDone />} />
            <Route path="/account" element={<Account />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Page>
        </Suspense>
      </main>
      <Footer />
      <BagDrawer />
      <Toasts />
      <PromoPopup />
    </StoreProvider>
  );
}
