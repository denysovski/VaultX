import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../data/products';

const LINKS = [
  { to: '/shop', label: 'New arrivals' },
  { to: '/shop?c=outerwear', label: 'Outerwear' },
  { to: '/shop?c=knitwear', label: 'Knitwear' },
  { to: '/lookbook', label: 'Lookbook' },
];

export function Nav() {
  const { count, setBagOpen, user, ready } = useStore();
  const [hidden, setHidden] = useState(false);
  const [top, setTop] = useState(true);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const overHero = loc.pathname === '/' && top && !open;

  // Hide on scroll down, show on scroll up. Phones keep it fixed (CSS).
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setTop(y < window.innerHeight * 0.85);
        if (y < 80) setHidden(false);
        else if (y - last > 6) setHidden(true);
        else if (last - y > 6) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', open);
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const active = (to: string) => {
    const [p, q] = to.split('?');
    if (q) return loc.pathname === p && loc.search === `?${q}`;
    return loc.pathname === p && !loc.search.includes('c=');
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={`nav${hidden && !open ? ' nav--hidden' : ''}${overHero ? ' nav--over' : ''}${open ? ' nav--open' : ''}`}>
        <div className="nav__left">
          <button ref={burgerRef} type="button" className="burger" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
            <span />
            <span />
          </button>
          <nav className="nav__links" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={() => `nav__link${active(l.to) ? ' is-active' : ''}`} aria-current={active(l.to) ? 'page' : undefined}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link to="/" className="nav__logo" aria-label="VAULTX home">
          VAULTX
        </Link>
        <div className="nav__right">
          <Link to="/shop?focus=search" className="nav__link nav__hide-sm">Search</Link>
          <Link to="/account" className="nav__link nav__hide-sm">{ready && user ? user.name.split(' ')[0] : 'Account'}</Link>
          <button type="button" className="nav__link" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            Bag <span className="tnum">[{count}]</span>
          </button>
        </div>
      </header>

      <div id="menu" ref={menuRef} className={`menu${open ? ' menu--open' : ''}`} inert={!open} aria-hidden={!open}>
        <nav aria-label="Menu">
          <ul className="menu__list">
            {[{ to: '/shop', label: 'New arrivals' }, ...CATEGORIES.map((c) => ({ to: `/shop?c=${c.id}`, label: c.label })), { to: '/lookbook', label: 'Lookbook' }, { to: '/help', label: 'Help' }, { to: '/account', label: 'Account' }].map((l, i) => (
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
