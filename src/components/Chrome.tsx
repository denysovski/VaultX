import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useStore } from '../lib/store';
import { read, write } from '../lib/storage';
import { getMeta, SITE_URL, SITE_NAME, canonical } from '../seo';
import { PHOTOGRAPHER } from '../data/looks';

export function Footer() {
  return (
    <footer className="footer" data-theme="dark">
      <div className="footer__grid">
        <p className="footer__lead">VAULTX</p>
        <nav aria-label="Shop links" className="footer__col">
          <p className="footer__h">Shop</p>
          <Link to="/shop">All pieces</Link>
          <Link to="/shop?c=hoodies">Hoodies</Link>
          <Link to="/shop?c=tees">Tees</Link>
          <Link to="/shop?c=outerwear">Outerwear</Link>
          <Link to="/shop?c=denim">Denim</Link>
        </nav>
        <nav aria-label="Help links" className="footer__col">
          <p className="footer__h">Help</p>
          <Link to="/help#track">Track an order</Link>
          <Link to="/help#issue">Delivery problem</Link>
          <Link to="/help#returns">Returns</Link>
          <Link to="/help#contact">Contact the studio</Link>
        </nav>
        <nav aria-label="Legal links" className="footer__col">
          <p className="footer__h">Vault</p>
          <Link to="/lookbook">Lookbook</Link>
          <Link to="/account">Account</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
      <div className="footer__base mono">
        <p>© {new Date().getFullYear()} VAULTX. Concept store: no real payments are taken.</p>
        <p>
          Photography by{' '}
          <a href={PHOTOGRAPHER.url} target="_blank" rel="noopener noreferrer">
            {PHOTOGRAPHER.name}
          </a>{' '}
          on Unsplash
        </p>
      </div>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className={`toast${t.tone === 'error' ? ' toast--error' : ''}`}>
          {t.text}
        </p>
      ))}
    </div>
  );
}

/** Storage notice. The shop sets no cookies and loads no trackers, so there is nothing to opt into. */
export function StorageNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!read('notice-ok', false)), []);
  if (!show) return null;
  return (
    <div className="notice" role="region" aria-label="Storage notice">
      <p>
        No cookies, no trackers. Your bag, account and orders are saved in this browser only.{' '}
        <Link to="/privacy">Privacy</Link>
      </p>
      <button
        className="btn btn--light btn--sm"
        onClick={() => {
          write('notice-ok', true);
          setShow(false);
        }}
      >
        <span className="btn__label">Understood</span>
      </button>
    </div>
  );
}

export function OfflineBar() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const set = () => setOffline(!navigator.onLine);
    set();
    window.addEventListener('online', set);
    window.addEventListener('offline', set);
    return () => {
      window.removeEventListener('online', set);
      window.removeEventListener('offline', set);
    };
  }, []);
  if (!offline) return null;
  return (
    <p className="offline mono" role="status">
      You are offline. Everything you have seen stays here; checkout waits until you are back.
    </p>
  );
}

function setTag(selector: string, attr: string, value: string, create: () => HTMLElement) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Updates title, description, canonical and social tags when the route changes. */
export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = getMeta(pathname);
    document.title = m.title;
    const url = canonical(m.path);
    const image = `${SITE_URL}${m.image ?? '/og.jpg'}`;
    const meta = (key: string, val: string, prop = false) =>
      setTag(`meta[${prop ? 'property' : 'name'}="${key}"]`, 'content', val, () => {
        const e = document.createElement('meta');
        e.setAttribute(prop ? 'property' : 'name', key);
        return e;
      });
    meta('description', m.description);
    meta('robots', m.noindex ? 'noindex, follow' : 'index, follow');
    meta('og:title', m.title, true);
    meta('og:description', m.description, true);
    meta('og:url', url, true);
    meta('og:image', image, true);
    meta('og:site_name', SITE_NAME, true);
    meta('twitter:card', 'summary_large_image');
    setTag('link[rel="canonical"]', 'href', url, () => {
      const l = document.createElement('link');
      l.rel = 'canonical';
      return l;
    });
  }, [pathname]);
  return null;
}

/** Moves focus to the new page heading after navigation, so screen readers announce it. */
export function RouteFocus() {
  const { pathname } = useLocation();
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) {
      setFirst(false);
      return;
    }
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const h1 = document.querySelector<HTMLElement>('main h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll to #hash targets after render (help page anchors).
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [hash, pathname]);
  return null;
}
