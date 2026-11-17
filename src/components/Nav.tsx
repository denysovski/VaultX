import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useStore } from '../lib/store';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { money } from '../lib/format';

const LINKS = [
  { to: '/new', label: 'New arrivals' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About us' },
];

/** Bag icon: a squared bag with a single strap, drawn in 1.5 px lines. */
function BagIcon() {
  return (
    <svg className="bag-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 8h16v13H4z" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
      <path d="M4 12h16" strokeWidth="0.75" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 21 21" />
    </svg>
  );
}

/** Search right in the header: type, see matches, Enter opens the full results. */
function NavSearch({ onOpen }: { onOpen: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(''); // the query results are listed for (set on Enter)
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const loc = useLocation();

  const hits = useMemo(() => {
    const s = shown.toLowerCase();
    if (!s) return [];
    return PRODUCTS.filter((p) => `${p.name} ${p.category} ${p.spec}`.toLowerCase().includes(s)).slice(0, 6);
  }, [shown]);

  const close = () => { setOpen(false); setQ(''); setShown(''); setActive(-1); };
  useEffect(() => {
    onOpen(open);
    if (open) input.current?.focus({ preventScroll: true });
  }, [open, onOpen]);
  useEffect(() => close(), [loc.pathname, loc.search]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && close();
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const enter = () => {
    const s = q.trim().slice(0, 60);
    if (!s) return;
    if (s !== shown) { setShown(s); setActive(-1); return; } // first Enter: show the results
    if (hits[active]) nav(`/shop/${hits[active].slug}`); // second Enter: open the picked one
    else nav(`/shop?q=${encodeURIComponent(s)}`); // or every match in the shop
    close();
  };

  return (
    <div ref={box} className={`nsearch${open ? ' nsearch--open' : ''}`}>
      <button type="button" className="nav__link nsearch__btn" aria-expanded={open} aria-controls="nsearch-input" aria-label={open ? 'Close search' : 'Search'} onClick={() => (open ? close() : setOpen(true))}>
        <SearchIcon />
        <span className="nsearch__word nav__hide-sm">Search</span>
      </button>
      <div className="nsearch__field">
        <label htmlFor="nsearch-input" className="sr-only">Search products, press Enter</label>
        <input
          ref={input}
          id="nsearch-input"
          type="search"
          role="combobox"
          aria-expanded={!!shown}
          aria-controls="nsearch-list"
          aria-activedescendant={active >= 0 ? `ns-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={60}
          value={q}
          tabIndex={open ? 0 : -1}
          onChange={(e) => { setQ(e.target.value); if (shown) { setShown(''); setActive(-1); } }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowDown' && hits.length) { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
            if (e.key === 'ArrowUp' && hits.length) { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); enter(); }
          }}
        />
      </div>
      {open && shown && (
        <ul key={shown} id="nsearch-list" className="nsearch__list" role="listbox" aria-label={`Results for ${shown}`}>
          {hits.length ? (
            <>
              {hits.map((p, i) => (
                <li key={p.slug} id={`ns-${i}`} style={{ ['--i' as string]: i }} role="option" aria-selected={i === active} className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); nav(`/shop/${p.slug}`); close(); }}>
                  <span>{p.name}</span>
                  <span className="mono tnum">{money(p.price)}</span>
                </li>
              ))}
              <li className="nsearch__all" style={{ ['--i' as string]: hits.length }} onMouseDown={(e) => { e.preventDefault(); nav(`/shop?q=${encodeURIComponent(shown)}`); close(); }}>See all in the shop</li>
            </>
          ) : (
            <li className="nsearch__none">Nothing for "{shown}".</li>
          )}
        </ul>
      )}
    </div>
  );
}

export function Nav() {
  const { count, setBagOpen, user, ready } = useStore();
  const loc = useLocation();
  const home = loc.pathname === '/' || loc.pathname === '/new'; // pages that open on a dark full-screen hero
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [solid, setSolid] = useState(!home);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Big at the very top, compact once scrolled. Opaque once past the hero
  // (on other pages, as soon as you scroll). Hides on scroll down, returns on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setCompact(y > 24);
        setSolid(home ? y > window.innerHeight - 80 : true);
        if (y < 200) setHidden(false);
        else if (y - last > 8) setHidden(true);
        else if (last - y > 8) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [home]);

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', open);
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (to: string) => {
    if (to === '/shop') return loc.pathname.startsWith('/shop');
    return loc.pathname.startsWith(to);
  };

  const cls = ['nav', compact && 'nav--compact', solid || open || searching ? 'nav--solid' : 'nav--over', hidden && !open && !searching && 'nav--hidden', open && 'nav--open'].filter(Boolean).join(' ');

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={cls}>
        <div className="nav__left">
          <button ref={burgerRef} type="button" className="burger" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
            <span />
            <span />
          </button>
          <nav className="nav__links" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={() => `nav__link${isActive(l.to) ? ' is-active' : ''}`} aria-current={isActive(l.to) ? 'page' : undefined}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link to="/" className="nav__logo" aria-label="VAULTX home">
          <span>VAULTX</span>
        </Link>
        <div className="nav__right">
          <NavSearch onOpen={setSearching} />
          <Link to="/account" className="nav__link nav__hide-sm">{ready && user ? user.name.split(' ')[0] : 'Account'}</Link>
          <button type="button" className="nav__link nav__bag" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <BagIcon />
            <span className="nav__count tnum" aria-hidden="true">{count}</span>
          </button>
        </div>
      </header>

      <div id="menu" ref={menuRef} className={`menu${open ? ' menu--open' : ''}`} inert={!open} aria-hidden={!open}>
        <nav aria-label="Menu">
          <ul className="menu__list">
            {[...LINKS, ...CATEGORIES.map((c) => ({ to: `/shop?c=${c.id}`, label: c.label })), { to: '/help', label: 'Help' }, { to: '/account', label: 'Account' }].map((l, i) => (
              <li key={l.to} style={{ '--i': i } as React.CSSProperties}>
                <Link to={l.to} className="menu__link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="menu__foot mono">50.0755 N / 14.4378 E</p>
      </div>
    </>
  );
}
