import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams, Link } from 'react-router';
import { PRODUCTS, CATEGORIES, totalStock, type Category } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useDebounced } from '../lib/hooks';
import { money } from '../lib/format';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '80', '90', '100', 'One size'];
const SORTS = [
  { id: 'new', label: 'Newest' },
  { id: 'low', label: 'Price up' },
  { id: 'high', label: 'Price down' },
];
const MIN = 0;
const MAX = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 50) * 50;
const STEP = 5;

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

/** Runs a DOM update inside a view transition when the browser supports it. */
type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void };
let running: VT | null = null;
function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  // a new change while one is animating: finish the old one instantly instead of letting it throw
  running?.skipTransition();
  const vt = doc.startViewTransition(() => flushSync(update));
  running = vt;
  const quiet = () => undefined;
  vt.ready.catch(quiet); vt.finished.catch(quiet).then(() => { if (running === vt) running = null; }); vt.updateCallbackDone.catch(quiet);
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const cats = list(params.get('c')) as Category[];
  const sizes = list(params.get('size'));
  const onlyNew = params.get('new') === '1';
  const sort = params.get('sort') ?? 'new';
  const stockOnly = params.get('stock') === '1';
  const pMin = Number(params.get('min') ?? MIN);
  const pMax = Number(params.get('max') ?? MAX);
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = useDebounced(q.trim().toLowerCase(), 250);
  const [big, setBig] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (fn: (n: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    fn(next);
    transition(() => setParams(next, { replace: true, preventScrollReset: true }));
  };
  const toggleIn = (key: string, value: string) =>
    update((n) => {
      const cur = list(n.get(key));
      const v = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      if (v.length) n.set(key, v.join(','));
      else n.delete(key);
    });
  const flag = (key: string) => update((n) => (n.get(key) === '1' ? n.delete(key) : n.set(key, '1')));

  useEffect(() => {
    if (params.get('q') !== (query || null)) {
      const next = new URLSearchParams(params);
      if (query) next.set('q', query);
      else next.delete('q');
      setParams(next, { replace: true, preventScrollReset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const base = useMemo(
    () =>
      PRODUCTS.filter((p) => {
        if (onlyNew && !p.isNew) return false;
        if (cats.length && !cats.includes(p.category)) return false;
        if (sizes.length && !sizes.some((s) => s in p.stock && (!stockOnly || p.stock[s] > 0))) return false;
        if (stockOnly && totalStock(p) === 0) return false;
        if (query && !query.split(/\s+/).every((w) => `${p.name} ${p.spec} ${p.category} ${p.code}`.toLowerCase().includes(w.replace(/s$/, '')))) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlyNew, params.get('c'), params.get('size'), stockOnly, query],
  );

  const hits = useMemo(() => {
    let l = base.filter((p) => p.price >= pMin && p.price <= pMax);
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    else l = [...l].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return l;
  }, [base, pMin, pMax, sort]);

  const countFor = (key: 'c' | 'size', value: string) =>
    PRODUCTS.filter((p) => (key === 'c' ? p.category === value : value in p.stock)).length;

  const active = cats.length + sizes.length + (stockOnly ? 1 : 0) + (onlyNew ? 1 : 0) + (pMin > MIN || pMax < MAX ? 1 : 0);
  const title = onlyNew ? 'New arrivals' : cats.length === 1 ? CATEGORIES.find((c) => c.id === cats[0])?.label ?? 'Shop' : 'Shop';

  // empty cells at the end of the last row get a quiet link instead of a card
  const gridRef = useRef<HTMLDivElement>(null);
  const [gap, setGap] = useState(0);
  useLayoutEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const measure = () => {
      const cols = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      const r = hits.length % cols;
      setGap(r ? cols - r : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(g);
    return () => ro.disconnect();
  }, [hits.length, big]);

  const filters = (
    <div className="side">
      <div className="side__group">
        <p className="side__label mono">Search</p>
        <label htmlFor="shop-q" className="sr-only">Search products</label>
        <input id="shop-q" type="search" className="search" placeholder="Type here" value={q} maxLength={60} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" />
      </div>

      <fieldset className="side__group">
        <legend className="side__label mono">Category</legend>
        <button type="button" className={`chk${onlyNew ? ' is-on' : ''}`} aria-pressed={onlyNew} onClick={() => flag('new')}>
          <span className="chk__box" aria-hidden="true" /> New arrivals <span className="chk__n tnum">{PRODUCTS.filter((p) => p.isNew).length}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className={`chk${cats.includes(c.id) ? ' is-on' : ''}`} aria-pressed={cats.includes(c.id)} onClick={() => toggleIn('c', c.id)}>
            <span className="chk__box" aria-hidden="true" /> {c.label} <span className="chk__n tnum">{countFor('c', c.id)}</span>
          </button>
        ))}
      </fieldset>

      <fieldset className="side__group">
        <legend className="side__label mono">Price</legend>
        <PriceRange min={pMin} max={pMax} values={base.map((p) => p.price)} onChange={(a, b) => update((n) => { if (a > MIN) n.set('min', String(a)); else n.delete('min'); if (b < MAX) n.set('max', String(b)); else n.delete('max'); })} />
      </fieldset>

      <fieldset className="side__group">
        <legend className="side__label mono">Size</legend>
        <div className="side__sizes">
          {SIZES.map((s) => (
            <button key={s} type="button" className={`sz${sizes.includes(s) ? ' is-on' : ''}`} aria-pressed={sizes.includes(s)} onClick={() => toggleIn('size', s)}>{s}</button>
          ))}
        </div>
      </fieldset>

      <fieldset className="side__group">
        <legend className="side__label mono">Availability</legend>
        <button type="button" className={`chk${stockOnly ? ' is-on' : ''}`} aria-pressed={stockOnly} onClick={() => flag('stock')}>
          <span className="chk__box" aria-hidden="true" /> In stock only
        </button>
      </fieldset>

      <fieldset className="side__group">
        <legend className="side__label mono">Sort</legend>
        <div className="side__sorts">
          {SORTS.map((s) => (
            <button key={s.id} type="button" className={`srt${sort === s.id ? ' is-on' : ''}`} aria-pressed={sort === s.id} onClick={() => update((n) => (s.id === 'new' ? n.delete('sort') : n.set('sort', s.id)))}>{s.label}</button>
          ))}
        </div>
      </fieldset>

      {active > 0 && (
        <button type="button" className="link-btn side__clear" onClick={() => { setQ(''); transition(() => setParams(new URLSearchParams(), { replace: true })); }}>
          Clear all filters [{active}]
        </button>
      )}
    </div>
  );

  return (
    <div className="shop" data-theme="light">
      <h1 className="sr-only">{title}</h1>
      <nav className="cats cats--page" aria-label="Categories">
        <div className="cats__row">
          <Link to="/shop?new=1" className={`cats__link${onlyNew && !cats.length ? ' is-on' : ''}`}>New arrivals</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?c=${c.id}`} className={`cats__link${cats.length === 1 && cats[0] === c.id && !onlyNew ? ' is-on' : ''}`}>{c.label}</Link>
          ))}
        </div>
      </nav>

      <div className="toolbar">
        <p className="toolbar__count tnum" aria-live="polite">{hits.length} {hits.length === 1 ? 'product' : 'products'}</p>
        <div className="toolbar__right">
          <button type="button" className="toolbar__filter" aria-expanded={mobileOpen} aria-controls="side" onClick={() => setMobileOpen((o) => !o)}>
            Filters{active ? ` [${active}]` : ''}
          </button>
          <div className="toolbar__view" role="group" aria-label="Card size">
            <button type="button" className={`view-btn${big ? ' is-on' : ''}`} aria-pressed={big} onClick={() => transition(() => setBig(true))} aria-label="Two per row">
              <span className="ico ico--big" aria-hidden="true" />
            </button>
            <button type="button" className={`view-btn${!big ? ' is-on' : ''}`} aria-pressed={!big} onClick={() => transition(() => setBig(false))} aria-label="Four per row">
              <span className="ico ico--small" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="shop__body">
        <aside id="side" className={`shop__side${mobileOpen ? ' is-open' : ''}`} aria-label="Filters">{filters}</aside>
        <div className="shop__main">
          <h2 className="sr-only">Products</h2>
          {hits.length ? (
            <div ref={gridRef} className={`grid${big ? ' grid--big' : ''}`}>
              {hits.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} vt />)}
              {gap > 0 && (
                <div className="grid__gap" style={{ gridColumn: `span ${gap}` }}>
                  <Link to={cats.length ? '/shop' : '/shop?c=belts'} className="text-link">{cats.length ? 'Browse other categories' : 'Browse belts and headwear'}</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="empty">
              <p className="empty__big">Nothing matches</p>
              <p>{query ? <>No product matches “{query}”. </> : null}Loosen a filter or widen the price range.</p>
              <div className="empty__actions">
                <button className="btn" onClick={() => { setQ(''); transition(() => setParams(new URLSearchParams(), { replace: true })); }}>Clear all filters</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Two-handle price range over a histogram of the prices in the current
 * selection. Handles move smoothly while dragging; the shop filters on release.
 */
function PriceRange({ min, max, values, onChange }: { min: number; max: number; values: number[]; onChange: (a: number, b: number) => void }) {
  const [a, setA] = useState(min);
  const [b, setB] = useState(max);
  useEffect(() => { setA(min); setB(max); }, [min, max]);
  const BARS = 20;
  const bars = Array.from({ length: BARS }, (_, i) => values.filter((v) => v >= (i * MAX) / BARS && v < ((i + 1) * MAX) / BARS + (i === BARS - 1 ? 1 : 0)).length);
  const top = Math.max(1, ...bars);
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const commit = () => onChange(Math.min(a, b), Math.max(a, b));
  return (
    <div className="range">
      <div className="range__hist" aria-hidden="true">
        {bars.map((n, i) => {
          const mid = ((i + 0.5) * MAX) / BARS;
          return <span key={i} className={mid >= a && mid <= b ? 'is-in' : ''} style={{ height: `${(n / top) * 100}%` }} />;
        })}
      </div>
      <div className="range__track">
        <span className="range__fill" style={{ left: `${pct(Math.min(a, b))}%`, right: `${100 - pct(Math.max(a, b))}%` }} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={a} aria-label="Minimum price" onChange={(e) => setA(Math.min(Number(e.target.value), b - STEP))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={b} aria-label="Maximum price" onChange={(e) => setB(Math.max(Number(e.target.value), a + STEP))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
      </div>
      <p className="range__vals mono tnum"><span>{money(a)}</span><span>{money(b)}</span></p>
    </div>
  );
}
