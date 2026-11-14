import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PRODUCTS, getProduct } from '../data/products';
import { getLook, PHOTOGRAPHER } from '../data/looks';
import { Img } from '../components/Img';
import { ProductCard } from '../components/ProductCard';
import { Field, Button, Check } from '../components/Field';
import { money } from '../lib/format';
import { email as validEmail } from '../lib/validate';
import { read, write } from '../lib/storage';
import { useReveal } from '../lib/hooks';

const HERO = [
  { slug: 'bunker-hoodie', colour: 'black', tone: 'fog' },
  { slug: 'hazard-shell', colour: 'acid', tone: 'ink' },
  { slug: 'curfew-leather-jacket', colour: 'black', tone: 'paper' },
  { slug: 'ration-tee', colour: 'flare', tone: 'graphite' },
];

export default function Home() {
  const units = PRODUCTS.reduce((a, p) => a + p.colours.reduce((b, c) => b + Object.values(c.stock).reduce((x, y) => x + y, 0), 0), 0);

  return (
    <>
      {/* The run: the VAULTX wordmark is sticky at the bottom of the viewport
          and travels with the reader until it docks at the end of this block. */}
      <div className="run">
        <section className="hero" aria-labelledby="hero-title" data-theme="light">
          <div className="hero__top">
            <h1 id="hero-title" className="hero__title">
              Uniforms for the <span className="hero__title-alt">after-hours</span> city
            </h1>
            <div className="hero__side">
              <p className="mono muted">
                Drop 07 / <span className="tnum">{units}</span> units / no restock
              </p>
              <Link to="/shop" className="btn btn--solid">
                <span className="btn__label">Shop Drop 07</span>
              </Link>
            </div>
          </div>

          <ul className="hero__row">
            {HERO.map((h, i) => {
              const p = getProduct(h.slug)!;
              const c = p.colours.find((x) => x.id === h.colour)!;
              return (
                <li key={h.slug} className={`hero__item tone-${h.tone}`} style={{ '--i': i } as React.CSSProperties}>
                  <Link to={`/shop/${p.slug}?colour=${c.id}`} className="hero__link">
                    <Img src={`garment/${c.image}`} alt={`${p.name} in ${c.name}`} sizes="(min-width: 900px) 25vw, 50vw" priority={i < 2} className="hero__img" />
                    <span className="hero__label">
                      <span>{p.name}</span>
                      <span className="mono tnum">{money(p.price)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="manifesto" data-theme="dark" aria-labelledby="manifesto-title">
          <h2 id="manifesto-title" className="manifesto__title">
            Built heavy. Worn nightly.
          </h2>
          <dl className="facts">
            <div>
              <dt className="mono">Heaviest hoodie</dt>
              <dd className="tnum">520 gsm</dd>
            </div>
            <div>
              <dt className="mono">Dispatch</dt>
              <dd>24 h</dd>
            </div>
            <div>
              <dt className="mono">Returns</dt>
              <dd>30 days</dd>
            </div>
          </dl>
        </section>

        <div className="run__dock">
          <p className="run__mark" aria-hidden="true">
            VAULTX
          </p>
        </div>
      </div>

      <TheBloc />

      <section className="drop" aria-labelledby="drop-title" data-theme="light">
        <div className="section-head">
          <h2 id="drop-title" className="mega">
            Drop 07
          </h2>
          <Link to="/shop" className="text-link section-head__side">
            All pieces
          </Link>
        </div>
        <div className="grid">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
          <Link to="/lookbook" className="promo-tile" data-theme="dark">
            <Img src="look/concert" alt={getLook('concert').alt} sizes="(min-width: 1100px) 25vw, 50vw" />
            <span className="promo-tile__text">
              <span className="promo-tile__big">The bloc</span>
            </span>
          </Link>
        </div>
      </section>

      <Feature />

      <Ticker />

      <section className="service" data-theme="light" aria-labelledby="service-title">
        <h2 id="service-title" className="sr-only">Delivery and returns</h2>
        <ol className="service__list">
          <li>
            <span className="mono">Dispatch</span>
            <p>Within 24 h from Prague</p>
          </li>
          <li>
            <span className="mono">Shipping</span>
            <p>Free over €200</p>
          </li>
          <li>
            <span className="mono">Returns</span>
            <p>30 days, free in the EU</p>
          </li>
          <li>
            <span className="mono">Problem?</span>
            <p><Link to="/help#issue" className="text-link">Report it</Link></p>
          </li>
        </ol>
      </section>

      <VaultList />
    </>
  );
}

function TheBloc() {
  const ref = useReveal<HTMLElement>();
  const big = getLook('yellow-sky');
  const small = ['car', 'suit', 'market-crates'].map(getLook);
  return (
    <section ref={ref} className="bloc reveal" data-theme="dark" aria-labelledby="bloc-title">
      <figure className="bloc__big">
        <Img src={`look/${big.key}`} alt={big.alt} sizes="(min-width: 900px) 60vw, 100vw" />
        <figcaption className="mono">{big.caption}</figcaption>
      </figure>
      <div className="bloc__text">
        <h2 id="bloc-title" className="bloc__title">
          The bloc
        </h2>
        <p>Grey uniforms, loud people.</p>
        <Link to="/lookbook" className="text-link">
          Lookbook
        </Link>
        <p className="mono muted small">
          Photos:{' '}
          <a href={PHOTOGRAPHER.url} target="_blank" rel="noopener noreferrer">
            {PHOTOGRAPHER.name}
          </a>
        </p>
      </div>
      <div className="bloc__small">
        {small.map((l) => (
          <figure key={l.key}>
            <Img src={`look/${l.key}`} alt={l.alt} sizes="(min-width: 900px) 20vw, 33vw" />
            <figcaption className="mono">{l.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Feature() {
  const p = getProduct('hazard-shell')!;
  const look = getLook('offshoulder');
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="feature reveal" data-theme="dark" aria-labelledby="feature-title">
      <div className="feature__garment">
        <Img src={`garment/${p.colours[0].image}`} alt={`${p.name} in ${p.colours[0].name}`} sizes="(min-width: 900px) 40vw, 90vw" />
      </div>
      <div className="feature__text">
        <p className="mono muted">{p.code}</p>
        <h2 id="feature-title" className="feature__title">
          Seen from the other end of the platform
        </h2>
        <dl className="specs">
          <div>
            <dt className="mono">Waterproof</dt>
            <dd className="tnum">20 000 mm</dd>
          </div>
          <div>
            <dt className="mono">Layers</dt>
            <dd className="tnum">3</dd>
          </div>
          <div>
            <dt className="mono">Price</dt>
            <dd className="tnum">{money(p.price)}</dd>
          </div>
        </dl>
        <Link to={`/shop/${p.slug}`} className="btn btn--light">
          <span className="btn__label">Choose your size</span>
        </Link>
      </div>
      <figure className="feature__photo">
        <Img src={`look/${look.key}`} alt={look.alt} sizes="(min-width: 900px) 25vw, 60vw" />
      </figure>
    </section>
  );
}

/** One line of giant type that shifts sideways with scroll. Transform only, rAF-throttled. */
function Ticker() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const tick = () => {
      if (visible) {
        const r = el.getBoundingClientRect();
        const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        el.style.setProperty('--shift', `${(-p * 30).toFixed(2)}%`);
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className="ticker" data-theme="light" aria-hidden="true">
      <p className="ticker__line">Curfew 23:00 / No restock / Curfew 23:00 / No restock</p>
    </div>
  );
}

function VaultList() {
  const [mail, setMail] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const err = touched ? validEmail(mail) : '';
  const agreeErr = touched && !agree ? 'Tick the box so we can email you' : '';

  useEffect(() => {
    if (read('vault-list', '')) setState('done');
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validEmail(mail) || !agree) {
      (document.getElementById('vl-email') as HTMLInputElement | null)?.focus();
      return;
    }
    setState('busy');
    setTimeout(() => {
      write('vault-list', mail.trim().toLowerCase());
      setState('done');
    }, 700);
  };

  return (
    <section className="vaultlist" data-theme="dark" aria-labelledby="vl-title">
      <h2 id="vl-title" className="mega mega--light">
        Vault list
      </h2>
      {state === 'done' ? (
        <div className="vaultlist__done" role="status">
          <p className="pulse">You are on the list.</p>
        </div>
      ) : (
        <form className="vaultlist__form" onSubmit={submit} noValidate>
          <Field id="vl-email" label="Email" type="email" autoComplete="email" inputMode="email" required value={mail} onChange={setMail} onBlur={() => setTouched(true)} error={err} maxLength={254} />
          <Check checked={agree} onChange={setAgree} label="Email me 24 h before each drop." error={agreeErr} />
          <Button type="submit" variant="light" busy={state === 'busy'}>
            Join the vault list
          </Button>
        </form>
      )}
    </section>
  );
}
