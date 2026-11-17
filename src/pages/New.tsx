import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { ProductImg, Img } from '../components/Img';
import { HudGrid, Mark, Type } from '../components/Hud';
import { read, write } from '../lib/storage';
import { email as validEmail } from '../lib/validate';

// Next drop: Friday 4 December 2026, 20:00 Prague time.
const DROP = Date.UTC(2026, 11, 4, 19, 0, 0);
const TEASE = ['signal-zip-hoodie', 'decay-knit', 'fray-knit'].map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean);

/**
 * The piece's name, made secret: a few letters swapped for a big star and one
 * word under a black bar. Fixed per name (no randomness), so the server and
 * the browser render the same thing.
 */
function Secret({ name }: { name: string }) {
  const words = name.toUpperCase().split(' ');
  const hide = words.length > 1 ? words.length - 1 : -1; // the last word goes under a bar
  let h = [...name].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5);
  return (
    <p className="drop__name" aria-label="Name hidden until the drop">
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {i === hide ? <span className="bar">{w}</span> : [...w].map((ch, j) => {
            h = (h * 1103515245 + 12345) >>> 0;
            return j > 0 && h % 3 === 0 ? <span key={j} className="x" aria-hidden="true">✱</span> : <span key={j} aria-hidden="true">{ch}</span>;
          })}
        </span>
      ))}
    </p>
  );
}

function Countdown() {
  const [now, setNow] = useState<number | null>(null); // null until mounted, so the prerender stays stable
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const left = now === null ? null : Math.max(0, DROP - now);
  const part = (ms: number, unit: number, mod: number) => String(Math.floor(ms / unit) % mod).padStart(2, '0');
  const cells = left === null
    ? [['--', 'days'], ['--', 'hours'], ['--', 'min'], ['--', 'sec']]
    : [[String(Math.floor(left / 864e5)).padStart(2, '0'), 'days'], [part(left, 36e5, 24), 'hours'], [part(left, 6e4, 60), 'min'], [part(left, 1e3, 60), 'sec']];
  return (
    <div className="drop__count" role="timer" aria-label="Time until the drop">
      {cells.map(([v, u]) => (
        <p key={u}><span className="tnum">{v}</span><span className="mono">{u}</span></p>
      ))}
    </div>
  );
}

function Notify() {
  const [mail, setMail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => setDone(!!read<string>('drop-07', '')), []);
  if (done) return <p className="drop__done mono">You are on the list for Drop 07.</p>;
  return (
    <form className="drop__form" noValidate onSubmit={(e) => {
      e.preventDefault();
      const v = validEmail(mail);
      if (v) return setErr(v);
      write('drop-07', mail.trim().toLowerCase());
      setDone(true);
    }}>
      <label htmlFor="drop-mail" className="sr-only">Email</label>
      <input id="drop-mail" type="email" autoComplete="email" inputMode="email" maxLength={120} placeholder="Email for early access" value={mail}
        aria-invalid={!!err} aria-describedby={err ? 'drop-err' : undefined} onChange={(e) => { setMail(e.target.value); setErr(''); }} />
      <button type="submit">Notify me</button>
      {err && <p id="drop-err" className="drop__err" role="alert">{err}</p>}
    </form>
  );
}

export default function New() {
  const out = PRODUCTS.filter((p) => p.isNew).slice(0, 8);
  return (
    <div className="drop">
      <section className="drop__hero" data-theme="dark" aria-labelledby="drop-title">
        <Img src="look/cover-face" alt="" sizes="100vw" priority className="drop__bg" />
        <span className="drop__noise" aria-hidden="true" />
        <HudGrid spot circles={false} />
        <div className="drop__inner">
          <p className="mono drop__kicker"><Type>{'Drop 07 / by invitation first'}</Type></p>
          <h1 id="drop-title" className="drop__title">Curfew</h1>
          <p className="drop__date mono">Friday 4 December / 20:00 CET / online only</p>
          <Countdown />
          <Notify />
        </div>
        <Mark className="drop__mark" />
      </section>

      <section className="drop__who" data-theme="light" aria-label="Who made it">
        <p className="drop__line">Nine pieces made for the hours after the city goes quiet. Black, grey, heavy. No restock.</p>
        <dl className="drop__kv">
          <div><dt className="mono">Designed by</dt><dd>Mira Kovář, VAULTX studio</dd></div>
          <div><dt className="mono">Knit with</dt><dd>Ateliér Noc, Brno</dd></div>
          <div><dt className="mono">Hardware by</dt><dd>Kov Works, Prague</dd></div>
          <div><dt className="mono">Run</dt><dd>120 of each piece</dd></div>
        </dl>
      </section>

      <section className="drop__tease" data-theme="dark" aria-label="First look">
        <div className="drop__tease-head">
          <p className="mono">First look</p>
          <p className="mono muted">More on 4 December</p>
        </div>
        <ul className="drop__tease-grid">
          {TEASE.map((p) => (
            <li key={p.slug} className="drop__piece">
              <ProductImg src={p.image} alt="A piece from Drop 07, shown blurred until the release" />
              <Secret name={p.name} />
              <span className="drop__veil mono" aria-hidden="true">Classified</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="block drop__out" data-theme="light" aria-labelledby="out-title">
        <div className="block__head">
          <h2 id="out-title" className="block__title">Out now</h2>
          <Link to="/shop?new=1" className="block__link">Shop new arrivals <span aria-hidden="true">→</span></Link>
        </div>
        <div className="grid">{out.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} fx />)}</div>
      </section>
    </div>
  );
}
