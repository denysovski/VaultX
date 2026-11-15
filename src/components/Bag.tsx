import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '../lib/store';
import { getProduct, FREE_SHIPPING_FROM } from '../data/products';
import { money } from '../lib/format';
import { ProductImg } from './Img';
import { Stepper } from './Field';

export function BagDrawer() {
  const { bag, bagOpen, setBagOpen, setQty, removeLine, subtotal, freeShippingLeft, count, ready } = useStore();
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', bagOpen);
    if (!bagOpen) {
      lastFocus.current?.focus?.();
      return;
    }
    lastFocus.current = document.activeElement as HTMLElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBagOpen(false);
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>('a, button:not([disabled]), input')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bagOpen, setBagOpen]);

  const progress = Math.min(1, subtotal / FREE_SHIPPING_FROM);

  return (
    <div className={`drawer${bagOpen ? ' drawer--open' : ''}`} inert={!bagOpen} aria-hidden={!bagOpen}>
      <button className="drawer__scrim" aria-label="Close bag" tabIndex={-1} onClick={() => setBagOpen(false)} />
      <div ref={panel} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="bag-title" tabIndex={-1}>
        <div className="drawer__head">
          <h2 id="bag-title" className="mono">Bag [{count}]</h2>
          <button className="link-btn" onClick={() => setBagOpen(false)}>Close</button>
        </div>

        {!ready ? (
          <div className="drawer__body"><div className="skeleton" style={{ height: 96 }} /></div>
        ) : bag.length === 0 ? (
          <div className="drawer__empty">
            <p>Your bag is empty.</p>
            <Link to="/shop" className="btn" onClick={() => setBagOpen(false)}>Shop new arrivals</Link>
          </div>
        ) : (
          <>
            <div className="ship-meter" aria-live="polite">
              <p className="mono">{freeShippingLeft > 0 ? <><span className="tnum">{money(freeShippingLeft)}</span> to free shipping</> : 'Free shipping unlocked'}</p>
              <div className="ship-meter__bar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>
            <ul className="drawer__body">
              {bag.map((l, i) => {
                const p = getProduct(l.slug)!;
                return (
                  <li key={`${l.slug}-${l.size}`} className="bag-line">
                    <Link to={`/shop/${p.slug}`} className="bag-line__img" onClick={() => setBagOpen(false)} tabIndex={-1} aria-hidden="true">
                      <ProductImg src={p.image} alt="" />
                    </Link>
                    <div className="bag-line__info">
                      <Link to={`/shop/${p.slug}`} className="bag-line__name" onClick={() => setBagOpen(false)}>{p.name}</Link>
                      <p className="mono muted">Size {l.size}</p>
                      <div className="bag-line__row">
                        <Stepper value={l.qty} onChange={(q) => setQty(i, q)} label={`Quantity of ${p.name}`} />
                        <button className="link-btn muted" onClick={() => removeLine(i)}>Remove</button>
                      </div>
                    </div>
                    <p className="tnum">{money(p.price * l.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="drawer__foot">
              <p className="sum-row"><span>Subtotal</span><span className="tnum">{money(subtotal)}</span></p>
              <p className="muted small">Shipping and codes at checkout. VAT included.</p>
              <button className="btn btn--wide" onClick={() => { setBagOpen(false); nav('/checkout'); }}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
