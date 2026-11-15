import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { PRODUCTS, CATEGORIES, totalStock, type Category } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useDebounced } from '../lib/hooks';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '80', '90', '100', 'One size'];
const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'low', label: 'Price, low to high' },
  { id: 'high', label: 'Price, high to low' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('c') as Category | null;
  const size = params.get('size');
  const sort = params.get('sort') ?? 'new';
  const stockOnly = params.get('stock') === '1';
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = useDebounced(q.trim().toLowerCase(), 250);
  const [panel, setPanel] = useState(false);
  const [big, setBig] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    next.delete('focus');
    if (value == null || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  useEffect(() => {
    if (params.get('focus') === 'search') searchRef.current?.focus();
  }, [params]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (query) next.set('q', query);
    else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', panel);
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  const hits = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (size && !(size in p.stock)) return false;
      if (stockOnly && (size ? (p.stock[size] ?? 0) === 0 : totalStock(p) === 0)) return false;
      if (query) {
        const hay = `${p.name} ${p.spec} ${p.category} ${p.code}`.toLowerCase();
        if (!query.split(/\s+/).every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, '')))) return false;
      }
      return true;
    });
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return list;
  }, [cat, size, sort, stockOnly, query]);

  const active = [size, stockOnly ? '1' : null, sort !== 'new' ? sort : null].filter(Boolean).length;
  const title = cat ? CATEGORIES.find((c) => c.id === cat)?.label ?? 'Shop' : 'New arrivals';

  return (
    <div className="shop" data-theme="light">
      <h1 className="sr-only">{title}</h1>
      <nav className="cats cats--page" aria-label="Categories">
        <div className="cats__row">
          <Link to="/shop" className={`cats__link${!cat ? ' is-on' : ''}`} aria-current={!cat ? 'page' : undefined}>New arrivals</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?c=${c.id}`} className={`cats__link${cat === c.id ? ' is-on' : ''}`} aria-current={cat === c.id ? 'page' : undefined}>
              {c.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="toolbar">
        <p className="toolbar__count tnum" aria-live="polite">{hits.length} {hits.length === 1 ? 'product' : 'products'}</p>
        <div className="toolbar__search">
          <label htmlFor="shop-q" className="sr-only">Search products</label>
          <input ref={searchRef} id="shop-q" type="search" className="search" placeholder="Search" value={q} maxLength={60} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" />
        </div>
        <div className="toolbar__right">
          <div className="toolbar__view" role="group" aria-label="Card size">
            <button type="button" className={`view-btn${big ? ' is-on' : ''}`} aria-pressed={big} onClick={() => setBig(true)} aria-label="Bigger cards">
              <span className="ico ico--big" aria-hidden="true" />
            </button>
            <button type="button" className={`view-btn${!big ? ' is-on' : ''}`} aria-pressed={!big} onClick={() => setBig(false)} aria-label="Smaller cards">
              <span className="ico ico--small" aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="toolbar__filter" onClick={() => setPanel(true)} aria-expanded={panel} aria-controls="filters">
            Filter and sort{active ? ` [${active}]` : ''}
          </button>
        </div>
      </div>

      <h2 className="sr-only">Products</h2>
      {hits.length ? (
        <div className={`grid${big ? ' grid--big' : ''}`}>
          {hits.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} />)}
        </div>
      ) : (
        <div className="empty">
          <p className="empty__big">Nothing matches</p>
          <p>{query ? <>No product matches “{query}”. </> : null}Try fewer filters, or search for hoodie, knit, jacket or belt.</p>
          <div className="empty__actions">
            <button className="btn" onClick={() => { setQ(''); setParams(new URLSearchParams(), { replace: true }); }}>Clear search and filters</button>
          </div>
        </div>
      )}

      <div id="filters" className={`panel${panel ? ' panel--open' : ''}`} role="dialog" aria-modal="true" aria-label="Filter and sort" inert={!panel} aria-hidden={!panel}>
        <button className="panel__scrim" tabIndex={-1} aria-label="Close filters" onClick={() => setPanel(false)} />
        <div className="panel__body">
          <div className="panel__head">
            <p className="mono">Filter and sort</p>
            <button className="link-btn" onClick={() => setPanel(false)}>Close</button>
          </div>
          <fieldset className="fset">
            <legend className="mono">Sort</legend>
            {SORTS.map((s) => (
              <button key={s.id} type="button" className={`opt${sort === s.id ? ' is-on' : ''}`} aria-pressed={sort === s.id} onClick={() => set('sort', s.id === 'new' ? null : s.id)}>{s.label}</button>
            ))}
          </fieldset>
          <fieldset className="fset">
            <legend className="mono">Size</legend>
            <div className="fset__wrap">
              {SIZES.map((s) => (
                <button key={s} type="button" className={`opt opt--box${size === s ? ' is-on' : ''}`} aria-pressed={size === s} onClick={() => set('size', s)}>{s}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="fset">
            <legend className="mono">Availability</legend>
            <button type="button" className={`opt${stockOnly ? ' is-on' : ''}`} aria-pressed={stockOnly} onClick={() => set('stock', '1')}>In stock only</button>
          </fieldset>
          <div className="panel__foot">
            <button className="link-btn" onClick={() => { const n = new URLSearchParams(); if (cat) n.set('c', cat); setParams(n, { replace: true }); }}>Clear</button>
            <button className="btn" onClick={() => setPanel(false)}>Show {hits.length} {hits.length === 1 ? 'product' : 'products'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
