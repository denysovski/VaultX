import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useStore } from '../lib/store';
import { read, write } from '../lib/storage';
import { getMeta, SITE_URL, SITE_NAME, canonical } from '../seo';
import { PHOTOGRAPHER } from '../data/looks';
import { email as validEmail } from '../lib/validate';
import { Signal } from './Signal';



export function Footer() {
  const { setBagOpen } = useStore();
  return (
    <footer className="footer" data-theme="dark">
      <div className="footer__top">
        <div className="footer__about">
          <p className="footer__say">Heavy clothes for the after-hours city.</p>
          <p className="footer__lead">VAULTX is a small studio in Prague. We cut in short runs, dye everything black or grey and do not restock. When a piece is gone, it is gone.</p>
        </div>
        <div className="fnews">
          <p className="footer__h">Newsletter</p>
          <p className="fnews__text">One letter a month. New drops first, nothing else.</p>
          <Signal id="foot-mail" label="Email" done="You are on the list. Next letter comes with the next drop." />
        </div>
      </div>
      <div className="footer__grid">
        <nav aria-label="Shop" className="footer__col">
          <p className="footer__h">Shop</p>
          <Link to="/new">New arrivals</Link>
          <Link to="/shop">All products</Link>
          <Link to="/shop?c=hoodies">Hoodies</Link>
          <Link to="/shop?c=knitwear">Knitwear</Link>
          <Link to="/shop?c=outerwear">Outerwear</Link>
          <Link to="/shop?c=tees">Tees</Link>
          <Link to="/shop?c=headwear">Headwear</Link>
          <Link to="/shop?c=belts">Belts</Link>
        </nav>
        <nav aria-label="Help" className="footer__col">
          <p className="footer__h">Help</p>
          <Link to="/help#track">Track an order</Link>
          <Link to="/help#issue">Delivery problem</Link>
          <Link to="/help#returns">Returns</Link>
          <Link to="/help#faq">FAQ</Link>
          <Link to="/help#contact">Contact the studio</Link>
        </nav>
        <nav aria-label="Studio" className="footer__col">
          <p className="footer__h">Studio</p>
          <Link to="/about">About us</Link>
          <Link to="/collab/creators">For creators</Link>
          <Link to="/collab/artists">For artists</Link>
          <Link to="/collab/designers">For designers</Link>
          <Link to="/collab/outsiders">For outsiders</Link>
        </nav>
        <nav aria-label="Account" className="footer__col">
          <p className="footer__h">Account</p>
          <Link to="/account">Sign in</Link>
          <Link to="/account?mode=up">Create account</Link>
          <button type="button" onClick={() => setBagOpen(true)}>Bag</button>
          <Link to="/checkout">Checkout</Link>
        </nav>
        <div className="footer__col">
          <p className="footer__h">Studio hours</p>
          <p>Monday to Friday</p>
          <p>9:00 to 18:00 CET</p>
          <p>Orders leave Prague within 24 h.</p>
          <p>Free tracked shipping over €200.</p>
        </div>
      </div>
      <div className="footer__base mono">
        <p>© {new Date().getFullYear()} VAULTX / Prague. Concept store, no real payments.</p>
        <nav aria-label="Legal" className="footer__legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms of sale</Link>
          <Link to="/terms#returns">Returns policy</Link>
        </nav>
        <p>
          Photos:{' '}
          <a href={PHOTOGRAPHER.url} target="_blank" rel="noopener noreferrer">{PHOTOGRAPHER.name}</a>,{' '}
          <a href="https://unsplash.com/@alex_gruber" target="_blank" rel="noopener noreferrer">Alex Gruber</a> / Unsplash
        </p>
      </div>
    </footer>
  );
}

/**
 * First-visit offer: subscribe and get a code. Bottom right, sharp corners.
 * Closes with X, or by itself after 10 seconds (paused while the visitor
 * hovers it or types in it).
 */
export function PromoPopup() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mail, setMail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(10);

  useEffect(() => {
    if (read('promo-seen', false)) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setClosing(true);
    write('promo-seen', true);
    setTimeout(() => setShow(false), 320);
  };

  useEffect(() => {
    if (!show || paused || closing) return;
    if (left <= 0) {
      close();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, paused, closing, left]);

  if (!show) return null;
  return (
    <aside
      className={`promo${closing ? ' promo--out' : ''}`}
      aria-labelledby="promo-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <button type="button" className="promo__x" onClick={close} aria-label="Close offer">
        <span aria-hidden="true">×</span>
      </button>
      {done ? (
        <div className="promo__done" role="status">
          <p id="promo-title" className="mono">Your code</p>
          <p className="promo__code">VAULT10</p>
          <p className="small">10 % off your first order. Enter it at checkout.</p>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const v = validEmail(mail);
            setErr(v);
            if (v) return;
            write('vault-list', mail.trim().toLowerCase());
            write('promo-seen', true);
            setDone(true);
            setLeft(10);
          }}
        >
          <p id="promo-title" className="mono">Newsletter</p>
          <p className="promo__big">−10 % on your first order</p>
          <p className="small muted">Join the list, get the code. One email per drop.</p>
          <div className="promo__row">
            <label htmlFor="promo-mail" className="sr-only">Email</label>
            <input id="promo-mail" type="email" autoComplete="email" inputMode="email" placeholder="Email" maxLength={254} value={mail} onChange={(e) => { setMail(e.target.value); setErr(''); }} aria-invalid={!!err || undefined} aria-describedby={err ? 'promo-err' : undefined} />
            <button type="submit" className="btn">Get code</button>
          </div>
          {err && <p id="promo-err" className="field__error" role="alert">{err}</p>}
        </form>
      )}
      <span key={String(done)} className="promo__timer" style={{ animationPlayState: paused ? 'paused' : 'running' }} aria-hidden="true" />
    </aside>
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
    const image = m.ogImage ?? `${SITE_URL}${m.image ?? '/og.jpg'}`;
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
