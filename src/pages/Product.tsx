import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getProduct, PRODUCTS, SHIPPING_METHODS, FREE_SHIPPING_FROM, CATEGORIES } from '../data/products';
import { useStore } from '../lib/store';
import { money, deliveryWindow } from '../lib/format';
import { email as validEmail } from '../lib/validate';
import { read, write } from '../lib/storage';
import { ProductImg } from '../components/Img';
import { ProductCard } from '../components/ProductCard';
import { Button, Field } from '../components/Field';
import NotFound from './NotFound';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const p = getProduct(slug);
  const { add, setBagOpen, toast } = useStore();
  const [size, setSize] = useState('');
  const [sizeErr, setSizeErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'front' | 'detail'>('front');
  const [guide, setGuide] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState(false);

  useEffect(() => {
    setSize(p && p.sizes.length === 1 ? p.sizes[0] : '');
    setSizeErr('');
    setView('front');
  }, [slug, p]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);

  if (!p) return <NotFound />;

  const left = size ? p.stock[size] ?? 0 : null;
  const soldOut = left === 0;
  const cat = CATEGORIES.find((c) => c.id === p.category)!;

  const addToBag = () => {
    if (!size) {
      setSizeErr('Choose a size');
      document.getElementById('size-0')?.focus();
      return;
    }
    if (soldOut) return;
    setBusy(true);
    setTimeout(() => {
      add({ slug: p.slug, size });
      setBusy(false);
      toast(`${p.name}, ${size}, added to bag`, 'ok');
      setBagOpen(true);
    }, 320);
  };

  const related = PRODUCTS.filter((x) => x.slug !== p.slug && x.category === p.category).concat(PRODUCTS.filter((x) => x.category !== p.category)).slice(0, 4);

  return (
    <div className="product" data-theme="light">
      <div className="product__layout">
        <div className="gallery">
          <div className={`gallery__frame gallery__frame--${view}`}>
            <ProductImg key={view} src={p.image} alt={`${p.name}, ${view === 'front' ? 'front' : 'fabric detail'}`} priority />
            <span className="track track--a" aria-hidden="true"><span className="mono">FABRIC 0.94</span></span>
            <span className="track track--b" aria-hidden="true"><span className="mono">{p.code}</span></span>
            <p className="gallery__spec mono" aria-hidden="true">{p.spec}</p>
          </div>
          <div className="thumbs" role="group" aria-label="Views">
            <button className={`thumb${view === 'front' ? ' is-on' : ''}`} aria-pressed={view === 'front'} onClick={() => setView('front')}>Front</button>
            <button className={`thumb${view === 'detail' ? ' is-on' : ''}`} aria-pressed={view === 'detail'} onClick={() => setView('detail')}>Detail</button>
          </div>
        </div>

        <div className="buy">
          <p className="crumbs mono"><Link to="/shop">Shop</Link> / <Link to={`/shop?c=${p.category}`}>{cat.label}</Link></p>
          <h1 className="buy__title">{p.name}</h1>
          <p className="buy__price tnum">{money(p.price)}</p>
          <p className="buy__spec mono">{p.spec}</p>

          <fieldset className={`sizes${sizeErr ? ' field--error' : ''}`}>
            <legend className="sizes__legend">
              <span>Size{size ? `: ${size}` : ''}</span>
              <button type="button" className="link-btn" onClick={() => setGuide(true)}>Size guide</button>
            </legend>
            <div className="sizes__row">
              {p.sizes.map((s, i) => {
                const n = p.stock[s] ?? 0;
                return (
                  <label key={s} className={`size${size === s ? ' is-on' : ''}${n === 0 ? ' is-out' : ''}`}>
                    <input id={`size-${i}`} type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setSizeErr(''); }} />
                    <span>{s}</span>
                    {n === 0 && <span className="sr-only">, sold out</span>}
                  </label>
                );
              })}
            </div>
            {sizeErr && <p id="size-err" className="field__error" role="alert">{sizeErr}</p>}
          </fieldset>

          <p className="stock mono" aria-live="polite">
            {left == null ? 'Choose a size to see stock' : left === 0 ? 'Sold out in this size' : left <= 2 ? `Only ${left} left` : 'In stock'}
          </p>

          <div ref={buyRef}>
            {soldOut ? (
              <NotifyMe slug={p.slug} size={size} />
            ) : (
              <Button className="btn--wide" busy={busy} onClick={addToBag}>Add to bag</Button>
            )}
          </div>

          <ul className="assure">
            <li>Tracked shipping, standard {deliveryWindow(SHIPPING_METHODS[0].days)}</li>
            <li>Free standard shipping over {money(FREE_SHIPPING_FROM)}</li>
            <li>30 days to return</li>
          </ul>

          <div className="accordion">
            <details open>
              <summary>Description</summary>
              <p>{p.description}</p>
            </details>
            <details>
              <summary>Shipping and delivery</summary>
              <ul className="plain">
                {SHIPPING_METHODS.map((m) => <li key={m.id}>{m.label}: {m.detail}, <span className="tnum">{money(m.price)}</span></li>)}
              </ul>
              <p>Late, damaged or missing? <Link to="/help#issue" className="text-link">Report it here</Link>.</p>
            </details>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="rel-title">
        <div className="block__head">
          <h2 id="rel-title" className="block__title">You may also like</h2>
        </div>
        <div className="grid">{related.map((r) => <ProductCard key={r.slug} product={r} />)}</div>
      </section>

      <div className={`buybar${bar ? ' buybar--on' : ''}`} aria-hidden={!bar} inert={!bar}>
        <div>
          <p className="buybar__name">{p.name}</p>
          <p className="mono small tnum">{money(p.price)}{size ? ` / ${size}` : ''}</p>
        </div>
        <Button busy={busy} disabled={soldOut} onClick={() => (size ? addToBag() : buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))}>
          {size ? 'Add to bag' : 'Choose size'}
        </Button>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} category={p.category} />
    </div>
  );
}

function NotifyMe({ slug, size }: { slug: string; size: string }) {
  const key = `notify:${slug}:${size}`;
  const [mail, setMail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => setDone(!!read(key, '')), [key]);
  if (done) return <p className="note" role="status">We will email you if {size} comes back.</p>;
  return (
    <form className="notify" noValidate onSubmit={(e) => { e.preventDefault(); const v = validEmail(mail); setErr(v); if (v) return; write(key, mail.trim().toLowerCase()); setDone(true); }}>
      <Field label="Email me if it comes back" type="email" autoComplete="email" required value={mail} onChange={setMail} error={err} />
      <Button type="submit" variant="ghost" className="btn--wide">Notify me</Button>
    </form>
  );
}

const GUIDE: Record<string, { head: string[]; rows: string[][]; note: string }> = {
  tops: { head: ['Size', 'Chest', 'Length', 'Sleeve'], rows: [['XS', '58', '68', '60'], ['S', '61', '70', '62'], ['M', '64', '72', '64'], ['L', '67', '74', '66'], ['XL', '70', '76', '67']], note: 'Garment measurements in cm, laid flat.' },
  belts: { head: ['Size', 'Waist', 'Total length'], rows: [['80', '70 to 80', '95'], ['90', '80 to 90', '105'], ['100', '90 to 100', '115']], note: 'Measure a belt you own from the buckle to the hole you use.' },
  headwear: { head: ['Size', 'Head'], rows: [['One size', '54 to 61']], note: 'Stretch knit or adjustable strap.' },
};

function SizeGuide({ open, onClose, category }: { open: boolean; onClose: () => void; category: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const g = GUIDE[category === 'belts' ? 'belts' : category === 'headwear' ? 'headwear' : 'tops'];
  return (
    <dialog ref={ref} className="modal" aria-labelledby="sg-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal__inner">
        <div className="modal__head">
          <h2 id="sg-title" className="mono">Size guide</h2>
          <button className="link-btn" onClick={onClose}>Close</button>
        </div>
        <table className="table tnum">
          <thead><tr>{g.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{g.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>)}</tbody>
        </table>
        <p className="small muted">{g.note}</p>
      </div>
    </dialog>
  );
}
