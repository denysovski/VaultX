import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { GlitchVideo, HudGrid, Type, AroundMark, Mark } from '../components/Hud';
import { Img } from '../components/Img';
import { assetUrl } from '../lib/format';
import { useReveal } from '../lib/hooks';

function Clock() {
  const [t, setT] = useState('--:--:--');
  useEffect(() => {
    const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Prague', hour12: false });
    const tick = () => setT(f.format(new Date()));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="tnum">{t} CET</span>;
}

/**
 * The VX mark in the editorial band leaves its place between the two text
 * halves and travels down as you scroll, growing, and settles above
 * "Bold strokes / soft light". It eases after the scroll (it keeps gliding a
 * moment after you stop), and the text it passes fades out.
 */
function useTravellingMark(section: React.RefObject<HTMLElement | null>, slot: React.RefObject<HTMLSpanElement | null>, mark: React.RefObject<SVGSVGElement | null>, end: React.RefObject<HTMLParagraphElement | null>) {
  useEffect(() => {
    const sec = section.current, from = slot.current, el = mark.current, to = end.current;
    if (!sec || !from || !el || !to) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fades = [...sec.querySelectorAll<HTMLElement>('.hud > :not(.hud--bc):not(.hud--bl):not(.hud--br)')];
    let cur = 0, raf = 0, visible = false;
    const place = (p: number) => {
      const r = sec.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const ax = a.left + a.width / 2 - r.left, ay = a.top + a.height / 2 - r.top;
      const grow = 1 + p * 1.6;
      const bx = b.left + b.width / 2 - r.left, by = b.top - r.top - (a.height * grow) / 2 - 18;
      const x = ax + (bx - ax) * p, y = ay + (by - ay) * p;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${grow.toFixed(3)})`;
      el.style.width = `${a.width}px`;
      fades.forEach((f) => (f.style.opacity = String(1 - p * 0.88)));
    };
    const loop = () => {
      const r = sec.getBoundingClientRect();
      const goal = still ? 0 : Math.min(1, Math.max(0, (innerHeight * 0.2 - r.top) / (r.height * 0.6)));
      cur += (goal - cur) * 0.06; // lags behind the scroll, then catches up
      if (Math.abs(goal - cur) < 0.0005) cur = goal;
      place(cur);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(sec);
    place(0);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [section, slot, mark, end]);
}

export default function Home() {
  const fresh = PRODUCTS.filter((p) => p.isNew).slice(0, 8);
  const outer = PRODUCTS.filter((p) => p.category === 'outerwear').slice(0, 4);
  const band = useReveal<HTMLElement>();
  const slot = useRef<HTMLSpanElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  const bold = useRef<HTMLParagraphElement>(null);
  useTravellingMark(band, slot, mark, bold);

  return (
    <>
      <section className="hero" data-theme="dark" aria-labelledby="hero-title">
        <GlitchVideo src={assetUrl('video/hero.mp4')} srcSmall={assetUrl('video/hero-960.mp4')} poster={assetUrl('video/hero-poster.jpg')} />
        <HudGrid spot />
        <div className="hud hero__hud">
          <p className="hud__t hud--tl mono"><Type>{'The city\nnever sleeps'}</Type><span className="hud__dot" /></p>
          <AroundMark as="h1" className="hud__t hud--tc mono hud__center" text="Clothing for the after-hours city. Heavy, quiet, black. Cut in Prague for the ones who stay out." />
          <p className="hud__t hud--tr mono"><Type delay={200}>{'Drop 07\nCurfew'}</Type></p>
          <p className="hud__t hud--ml mono"><Type delay={400}>{'Machine & human\nTRK 0.92'}</Type></p>
          <p className="hud__pill mono">(C) 2026</p>
          <p className="hud__t hud--mr mono"><Type delay={500}>{'Heavy cloth\n480 to 620 gsm'}</Type></p>
          <Link to="/new" className="hud--bl hud__cta">Shop new arrivals</Link>
          <p className="hud__t hud--bc mono hud__big"><Clock /> / 50.0755 N 14.4378 E</p>
        </div>
      </section>

      <nav className="cats" aria-label="Categories" data-theme="light">
        <div className="cats__row">
          <Link to="/shop?new=1" className="cats__link is-on">New arrivals</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?c=${c.id}`} className="cats__link">{c.label}</Link>
          ))}
        </div>
      </nav>

      <section className="block" data-theme="light" aria-labelledby="new-title">
        <div className="block__head">
          <h2 id="new-title" className="block__title">New arrivals</h2>
          <Link to="/shop" className="block__link">View all {PRODUCTS.length} products <span aria-hidden="true">→</span></Link>
        </div>
        <div className="grid">
          {fresh.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} fx />)}
        </div>
      </section>

      <section ref={band} className="band reveal" data-theme="dark" aria-labelledby="band-title">
        <div className="band__img">
          <Img src="look/skate" alt="A person in a pale cropped top and wide trousers standing alone in a dark, empty building" sizes="100vw" />
          <div className="band__noise" aria-hidden="true" />
        </div>
        <HudGrid spot />
        <Mark ref={mark} className="band__mark" />
        <div className="hud">
          <p className="hud__t hud--tl mono"><Type>{'The future\nis coming'}</Type><span className="hud__dot" /></p>
          <AroundMark as="h2" markRef={slot} className="hud__t hud--tc mono hud__center" text="In the grey of the city we wear the night as a uniform. Cut close, built heavy, made to outlast the trend." />
          <p className="hud__t hud--tr mono"><Type delay={200}>{'Delicate lines\nwool / nylon'}</Type></p>
          <p className="hud__t hud--ml mono"><Type delay={350}>{'Machine & human\nAI 0.98'}</Type></p>
          <p className="hud__pill mono">VAULTX</p>
          <p className="hud__t hud--mr mono"><Type delay={450}>{'Controlled\ncurves'}</Type></p>
          <Link to="/about" className="hud--bl hud__cta">About us</Link>
          <p ref={bold} className="hud__t hud--bc mono hud__big hud__one">Bold strokes / soft light</p>
          <p className="hud--br hud__big mono">
            Photo
            <br />
            <a href="https://unsplash.com/photos/VqsB87zWJcg" target="_blank" rel="noopener noreferrer">Alex Gruber</a>
          </p>
        </div>
      </section>

      <section className="block" data-theme="light" aria-labelledby="outer-title">
        <div className="block__head">
          <h2 id="outer-title" className="block__title">Outerwear</h2>
          <Link to="/shop?c=outerwear" className="block__link">View outerwear <span aria-hidden="true">→</span></Link>
        </div>
        <div className="grid">{outer.map((p) => <ProductCard key={p.slug} product={p} fx />)}</div>
      </section>

      <section className="community" data-theme="light" aria-labelledby="comm-title">
        <h2 id="comm-title" className="community__title">Let us make it together</h2>
        <ul className="community__list">
          <li><Link to="/collab/creators">for creators</Link></li>
          <li><Link to="/collab/artists">for artists</Link></li>
          <li><Link to="/collab/designers">for designers</Link></li>
          <li><Link to="/collab/outsiders">for outsiders</Link></li>
        </ul>
        <p className="community__text">Shoot it, paint on it, redesign it. Pick your group and tell us what you want to make.</p>
      </section>

      <section className="promises" data-theme="light" aria-label="Delivery and returns">
        <p><span className="mono">Tracked shipping</span> Free over €200</p>
        <p><span className="mono">Returns</span> 30 days, free in the EU</p>
        <p><span className="mono">Dispatch</span> Within 24 h from Prague</p>
        <p><Link to="/help#issue" className="text-link">Report a delivery problem</Link></p>
      </section>
    </>
  );
}
