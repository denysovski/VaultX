import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { PRODUCTS, CATEGORIES, type Category, type Colourway, type Product } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useDebounced } from '../lib/hooks';

const TONES = [
  { id: 'black', label: 'Black', match: ['black'] },
  { id: 'grey', label: 'Grey', match: ['ash', 'graphite'] },
  { id: 'white', label: 'Bone', match: ['bone'] },
  { id: 'blue', label: 'Blue', match: ['indigo', 'wash'] },
  { id: 'colour', label: 'Colour', match: ['flare', 'teal', 'acid'] },
];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', 'One size'];
const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'low', label: 'Price low' },
  { id: 'high', label: 'Price high' },
];

type Hit = { product: Product; colour?: Colourway };

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('c') as Category | null;
  const tone = params.get('tone');
  const size = params.get('size');
  const sort = params.get('sort') ?? 'new';
  const stockOnly = params.get('stock') === '1';
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = useDebounced(q.trim().toLowerCase(), 250);
  const [sheet, setSheet] = useState(false);
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
    document.documentElement.classList.toggle('is-locked', sheet);
  }, [sheet]);

  const hits = useMemo<Hit[]>(() => {
    const toneMatch = TONES.find((t) => t.id === tone)?.match;
    let list: Hit[] = [];
    for (const p of PRODUCTS) {
      if (cat && p.category !== cat) continue;
      if (query) {
        const hay = [p.name, p.line, p.category, p.code, ...p.colours.map((c) => c.name)].join(' ').toLowerCase();
        if (!query.split(/\s+/).every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, '')))) continue;
      }
      const colours = p.colours.filter((c) => {
        if (toneMatch && !toneMatch.includes(c.id)) return false;
        if (size && !(size in c.stock)) return false;
        if (stockOnly && (size ? (c.stock[size] ?? 0) === 0 : Object.values(c.stock).every((n) => n === 0))) return false;
        return true;
      });
      if (!colours.length) continue;
      // When filtering by colour, show the matching colourway on the card.
      if (toneMatch) list.push(...colours.map((c) => ({ product: p, colour: c })));
      else list.push({ product: p });
    }
    if (sort === 'low') list = [...list].sort((a, b) => a.product.price - b.product.price);
    if (sort === 'high') list = [...list].sort((a, b) => b.product.price - a.product.price);
    if (sort === 'new') list = [...list].sort((a, b) => Number(!!b.product.isNew) - Number(!!a.product.isNew));
    return list;
  }, [cat, tone, size, sort, stockOnly, query]);

  const activeCount = [cat, tone, size, stockOnly ? '1' : null].filter(Boolean).length;
  const title = cat ? CATEGORIES.find((c) => c.id === cat)?.label ?? 'Shop' : 'Shop';

  const filters = (
    <div className="filters__groups">
      <FilterGroup label="Category">
        <Toggle on={!cat} onClick={() => set('c', null)}>All</Toggle>
        {CATEGORIES.map((c) => (
          <Toggle key={c.id} on={cat === c.id} onClick={() => set('c', c.id)}>{c.label}</Toggle>
        ))}
      </FilterGroup>
      <FilterGroup label="Colour">
        {TONES.map((t) => (
          <Toggle key={t.id} on={tone === t.id} onClick={() => set('tone', t.id)}>
            <span className={`dot dot--${t.id}`} aria-hidden="true" />
            {t.label}
          </Toggle>
        ))}
      </FilterGroup>
      <FilterGroup label="Size">
        {SIZES.map((s) => (
          <Toggle key={s} on={size === s} onClick={() => set('size', s)}>{s}</Toggle>
        ))}
      </FilterGroup>
      <FilterGroup label="Sort">
        {SORTS.map((s) => (
          <Toggle key={s.id} on={sort === s.id} onClick={() => set('sort', s.id === 'new' ? null : s.id)}>{s.label}</Toggle>
        ))}
      </FilterGroup>
      <FilterGroup label="Stock">
        <Toggle on={stockOnly} onClick={() => set('stock', '1')}>In stock only</Toggle>
      </FilterGroup>
    </div>
  );

  return (
    <div className="shop" data-theme="light">
      <header className="shop__head">
        <h1 className="page-title">{title}</h1>
        <div className="shop__search">
          <label htmlFor="shop-q" className="sr-only">Search the drop</label>
          <input
            ref={searchRef}
            id="shop-q"
            type="search"
            className="search"
            placeholder="Search: hoodie, black, denim"
            value={q}
            maxLength={60}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          <p className="mono muted tnum" aria-live="polite">
            {hits.length} {hits.length === 1 ? 'result' : 'results'}
          </p>
        </div>
      </header>

      <div className="filters filters--bar">{filters}</div>

      <div className="filters-mobile">
        <button className="btn btn--ghost" onClick={() => setSheet(true)} aria-expanded={sheet} aria-controls="filter-sheet">
          <span className="btn__label">Filters{activeCount ? ` (${activeCount})` : ''}</span>
        </button>
        {activeCount > 0 && (
          <button className="link-btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear all</button>
        )}
      </div>

      <div id="filter-sheet" className={`sheet${sheet ? ' sheet--open' : ''}`} role="dialog" aria-modal="true" aria-label="Filters" inert={!sheet} aria-hidden={!sheet}>
        <button className="sheet__scrim" tabIndex={-1} aria-label="Close filters" onClick={() => setSheet(false)} />
        <div className="sheet__panel">
          <div className="sheet__head">
            <p className="drawer__title">Filters</p>
            <button className="link-btn" onClick={() => setSheet(false)}>Close</button>
          </div>
          {filters}
          <button className="btn btn--solid btn--wide" onClick={() => setSheet(false)}>
            <span className="btn__label">Show {hits.length} {hits.length === 1 ? 'result' : 'results'}</span>
          </button>
        </div>
      </div>

      <h2 className="sr-only">Products</h2>
      {hits.length ? (
        <div className="grid">
          {hits.map((h, i) => (
            <ProductCard key={`${h.product.slug}-${h.colour?.id ?? 'all'}`} product={h.product} colour={h.colour} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p className="empty__big">Nothing in the vault matches</p>
          <p>
            {query ? <>No piece matches “{query}”. </> : null}
            Try fewer filters, or search for hoodie, tee, jacket or denim.
          </p>
          <div className="empty__actions">
            <button className="btn btn--solid" onClick={() => { setQ(''); setParams(new URLSearchParams(), { replace: true }); }}>
              <span className="btn__label">Clear search and filters</span>
            </button>
            <Link to="/shop/bunker-hoodie" className="text-link">Or see the most wanted piece</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fgroup" role="group" aria-label={label}>
      <span className="fgroup__label mono">{label}</span>
      <div className="fgroup__opts">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`toggle${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
