import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useStore } from '../lib/store';

const LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?c=hoodies', label: 'Hoodies' },
  { to: '/shop?c=outerwear', label: 'Outerwear' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/help', label: 'Help' },
];

export function Nav() {
  const { count, setBagOpen, user, ready } = useStore();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Hide on scroll down, reveal on scroll up. On phones the bar stays put
  // (handled in CSS: the transform is ignored below 900 px).
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (y < 80) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', open);
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>('a');
    first?.focus();
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
    const [p, q] = to.split('?');
    if (q) return loc.pathname === p && loc.search === `?${q}`;
    return loc.pathname === p && (p !== '/shop' || !loc.search.includes('c='));
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={`nav${hidden && !open ? ' nav--hidden' : ''}${open ? ' nav--open' : ''}`}>
        <Link to="/" className="nav__logo" aria-label="VAULTX home">
          VAULTX
        </Link>
        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={() => `nav__link${isActive(l.to) ? ' is-active' : ''}`} aria-current={isActive(l.to) ? 'page' : undefined}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav__tools">
          <Link to="/shop?focus=search" className="nav__link nav__hide-sm">Search</Link>
          <Link to="/account" className="nav__link nav__hide-sm">{ready && user ? user.name.split(' ')[0] : 'Account'}</Link>
          <button type="button" className="nav__link nav__bag" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            Bag <span className="tnum">({count})</span>
          </button>
          <button
            ref={burgerRef}
            type="button"
            className="burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" ref={menuRef} className={`menu${open ? ' menu--open' : ''}`} inert={!open} aria-hidden={!open}>
        <nav aria-label="Mobile">
          <ul className="menu__list">
            {[...LINKS, { to: '/shop?focus=search', label: 'Search' }, { to: '/account', label: 'Account' }].map((l, i) => (
              <li key={l.to} style={{ '--i': i } as React.CSSProperties}>
                <Link to={l.to} className="menu__link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="menu__foot mono">Drop 07 Curfew. Free EU shipping over €200.</p>
      </div>
    </>
  );
}
