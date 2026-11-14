import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { getProduct, PRODUCTS, SHIPPING_METHODS, FREE_SHIPPING_FROM } from '../data/products';
import { getLook, PHOTOGRAPHER } from '../data/looks';
import { useStore } from '../lib/store';
import { money, deliveryWindow } from '../lib/format';
import { email as validEmail } from '../lib/validate';
import { read, write } from '../lib/storage';
import { Img } from '../components/Img';
import { ProductCard } from '../components/ProductCard';
import { Button, Field } from '../components/Field';
import NotFound from './NotFound';

const CUTOFF_HOUR = 15;

export default function ProductPage() {
  const { slug = '' } = useParams();
  const p = getProduct(slug);
  const [params, setParams] = useSearchParams();
  const { add, setBagOpen, toast } = useStore();
  const colourId = params.get('colour');
  const colour = p?.colours.find((c) => c.id === colourId) ?? p?.colours[0];
  const [size, setSize] = useState<string>('');
  const [sizeErr, setSizeErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [guide, setGuide] = useState(false);
  const [view, setView] = useState<'garment' | string>('garment');
  const buyRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    setSize(p && p.sizes.length === 1 ? p.sizes[0] : '');
    setSizeErr('');
    setView('garment');
  }, [slug, p]);

  // Sticky mobile buy bar appears once the main button scrolls out of view.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);

  if (!p || !colour) return <NotFound />;

  const stockFor = (s: string) => colour.stock[s] ?? 0;
  const soldOut = size ? stockFor(size) === 0 : false;

  const addToBag = () => {
    if (!size) {
      setSizeErr('Choose a size first');
      document.getElementById('size-0')?.focus();
      return;
    }
    if (soldOut) return;
    setBusy(true);
    setTimeout(() => {
      add({ slug: p.slug, colour: colour.id, size });
      setBusy(false);
      setAdded(true);
      toast(`${p.name}, ${colour.name} / ${size} added to your bag`, 'ok');
      setTimeout(() => setAdded(false), 1800);
      setBagOpen(true);
    }, 350);
  };

  const pickColour = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('colour', id);
    setParams(next, { replace: true, preventScrollReset: true });
    setView('garment');
  };

  const related = PRODUCTS.filter((x) => x.slug !== p.slug).slice(0, 4);
  const looks = p.world.map(getLook);

  return (
    <div className="product" data-theme="light">

      <div className="product__layout">
        <div className="gallery">
          <div className={`gallery__stage tone-${colour.id === 'black' || colour.id === 'graphite' ? 'fog' : colour.id === 'bone' ? 'graphite' : 'paper'}`}>
            {view === 'garment' ? (
              <div key={colour.id} className="gallery__swap">
                <Img src={`garment/${colour.image}`} alt={`${p.name} in ${colour.name}, front view`} sizes="(min-width: 900px) 55vw, 100vw" priority />
              </div>
            ) : (
              <figure key={view} className="gallery__swap gallery__photo">
                <Img src={`look/${view}`} alt={getLook(view).alt} sizes="(min-width: 900px) 55vw, 100vw" />
                <figcaption className="mono">
                  Mood: {getLook(view).caption}. Photo by{' '}
                  <a href={getLook(view).unsplash} target="_blank" rel="noopener noreferrer">{PHOTOGRAPHER.name}</a>
                </figcaption>
              </figure>
            )}
            <p className="gallery__code mono">{p.code}</p>
          </div>
          <div className="thumbs" role="group" aria-label="Images">
            <button className={`thumb${view === 'garment' ? ' is-on' : ''}`} onClick={() => setView('garment')} aria-pressed={view === 'garment'} aria-label={`${p.name} product image`}>
              <Img src={`garment/${colour.image}`} alt="" sizes="96px" />
            </button>
            {looks.map((l) => (
              <button key={l.key} className={`thumb${view === l.key ? ' is-on' : ''}`} onClick={() => setView(l.key)} aria-pressed={view === l.key} aria-label={`Mood photo: ${l.caption}`}>
                <Img src={`look/${l.key}`} alt="" sizes="96px" />
              </button>
            ))}
          </div>
        </div>

        <div className="buy">
          <p className="mono muted">{p.code}{p.isNew ? ' / New in Drop 07' : ''}</p>
          <h1 className="buy__title">{p.name}</h1>
          <p className="buy__price mono tnum">{money(p.price)}</p>
          <p className="buy__line">{p.line}</p>

          <fieldset className="swatches">
            <legend className="mono">
              Colour: <span className="ink">{colour.name}</span>
            </legend>
            <div className="swatches__row">
              {p.colours.map((c) => (
                <label key={c.id} className={`swatch${c.id === colour.id ? ' is-on' : ''}`} title={c.name}>
                  <input type="radio" name="colour" value={c.id} checked={c.id === colour.id} onChange={() => pickColour(c.id)} />
                  <span className="swatch__dot" style={{ background: c.hex }} aria-hidden="true" />
                  <span className="sr-only">{c.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={`sizes${sizeErr ? ' field--error' : ''}`} aria-describedby={sizeErr ? 'size-err' : undefined}>
            <legend className="sizes__legend">
              <span className="mono">Size{size ? `: ${size}` : ''}</span>
              <button type="button" className="link-btn" onClick={() => setGuide(true)}>Size guide</button>
            </legend>
            <div className="sizes__row">
              {p.sizes.map((s, i) => {
                const n = stockFor(s);
                return (
                  <label key={s} className={`size${size === s ? ' is-on' : ''}${n === 0 ? ' is-out' : ''}`}>
                    <input id={`size-${i}`} type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setSizeErr(''); }} />
                    <span>{s}</span>
                    {n > 0 && n <= 3 && <span className="size__left mono tnum">{n} left</span>}
                    {n === 0 && <span className="sr-only">, sold out</span>}
                  </label>
                );
              })}
            </div>
            {sizeErr && <p id="size-err" className="field__error" role="alert">{sizeErr}</p>}
          </fieldset>

          <div ref={buyRef} className="buy__cta">
            {soldOut ? (
              <NotifyMe slug={p.slug} colour={colour.id} size={size} />
            ) : (
              <Button className={`btn--wide${added ? ' pulse' : ''}`} busy={busy} onClick={addToBag}>
                {added ? 'Added to bag' : `Add to bag, ${money(p.price)}`}
              </Button>
            )}
          </div>

          <DeliveryEta price={p.price} />

          <div className="accordion">
            <details open>
              <summary>Description</summary>
              <p>{p.description}</p>
            </details>
            <details>
              <summary>Fabric and fit</summary>
              <p>{p.fabric}</p>
              <p>{p.fit}</p>
            </details>
            <details>
              <summary>Delivery and returns</summary>
              <ul className="plain">
                {SHIPPING_METHODS.map((m) => (
                  <li key={m.id}>
                    {m.label}: {m.detail}, <span className="mono tnum">{money(m.price)}</span>
                  </li>
                ))}
              </ul>
              <p>Standard shipping is free over {money(FREE_SHIPPING_FROM)}. Returns are free within 30 days inside the EU. <Link to="/help#returns" className="text-link">How returns work</Link></p>
            </details>
            <details>
              <summary>Care</summary>
              <p>{p.care}</p>
            </details>
          </div>
        </div>
      </div>

      <section className="related" aria-labelledby="related-title">
        <h2 id="related-title" className="page-title">Wear it with</h2>
        <div className="grid">
          {related.map((r) => <ProductCard key={r.slug} product={r} />)}
        </div>
      </section>

      <div className={`buybar${showBar ? ' buybar--on' : ''}`} aria-hidden={!showBar} inert={!showBar}>
        <div>
          <p className="buybar__name">{p.name}</p>
          <p className="mono muted small">{colour.name}{size ? ` / ${size}` : ''}</p>
        </div>
        <Button busy={busy} onClick={() => (size ? addToBag() : buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))} disabled={soldOut}>
          {size ? `Add, ${money(p.price)}` : 'Choose size'}
        </Button>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} category={p.category} />
    </div>
  );
}

function DeliveryEta({ price }: { price: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  // Same two-line shape before and after the clock is known, so nothing shifts.
  if (!now)
    return (
      <div className="eta">
        <p>Leaves Prague within one working day.</p>
        <p className="mono muted small">Standard delivery in 3 to 5 working days. Free over {money(FREE_SHIPPING_FROM)}.</p>
      </div>
    );
  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  const before = !weekend && now < cutoff;
  const mins = Math.round((cutoff.getTime() - now.getTime()) / 60000);
  const std = SHIPPING_METHODS[0];
  return (
    <div className="eta">
      <p>
        {before ? (
          <>Order in the next <strong className="tnum">{Math.floor(mins / 60)} h {mins % 60} min</strong> and it leaves Prague today.</>
        ) : (
          <>Leaves Prague on the next working day.</>
        )}
      </p>
      <p className="mono muted small">
        Standard delivery {deliveryWindow(std.days, now)}. {price >= FREE_SHIPPING_FROM ? 'Free shipping on this piece.' : `Free over ${money(FREE_SHIPPING_FROM)}.`}
      </p>
    </div>
  );
}

function NotifyMe({ slug, colour, size }: { slug: string; colour: string; size: string }) {
  const key = `notify:${slug}:${colour}:${size}`;
  const [mail, setMail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => setDone(!!read(key, '')), [key]);
  if (done) return <p className="notify-done" role="status">We will email you if size {size} comes back. Drops rarely restock, so do not wait on it.</p>;
  return (
    <form
      className="notify"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const v = validEmail(mail);
        setErr(v);
        if (v) return;
        write(key, mail.trim().toLowerCase());
        setDone(true);
      }}
    >
      <p className="mono">Size {size} is sold out in this colour</p>
      <Field label="Email for a restock alert" type="email" autoComplete="email" required value={mail} onChange={setMail} error={err} onBlur={() => mail && setErr(validEmail(mail))} />
      <Button type="submit" variant="ghost" className="btn--wide">Email me if it comes back</Button>
    </form>
  );
}

const GUIDE: Record<string, { head: string[]; rows: string[][]; note: string }> = {
  tops: {
    head: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [['XS', '58', '68', '60'], ['S', '61', '70', '62'], ['M', '64', '72', '64'], ['L', '67', '74', '66'], ['XL', '70', '76', '67'], ['XXL', '73', '78', '68']],
    note: 'Garment measurements in centimetres, laid flat. Chest is measured armpit to armpit.',
  },
  denim: {
    head: ['Size', 'Waist', 'Hip', 'Inside leg'],
    rows: [['28', '72', '96', '80'], ['30', '77', '101', '81'], ['32', '82', '106', '82'], ['34', '87', '111', '83'], ['36', '92', '116', '84']],
    note: 'Garment measurements in centimetres. If you are between sizes, take the larger one: selvedge does not stretch.',
  },
  headwear: { head: ['Size', 'Head'], rows: [['One size', '54 to 61']], note: 'Adjustable strap at the back.' },
};

function SizeGuide({ open, onClose, category }: { open: boolean; onClose: () => void; category: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const g = GUIDE[category === 'denim' ? 'denim' : category === 'headwear' ? 'headwear' : 'tops'];
  return (
    <dialog ref={ref} className="modal" aria-labelledby="sg-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal__inner">
        <div className="modal__head">
          <h2 id="sg-title" className="drawer__title">Size guide</h2>
          <button className="link-btn" onClick={onClose}>Close</button>
        </div>
        <table className="table tnum">
          <thead>
            <tr>{g.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">{g.note}</p>
      </div>
    </dialog>
  );
}
