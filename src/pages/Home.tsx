import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { GlitchVideo, HudGrid, Type, AroundMark } from '../components/Hud';
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

export default function Home() {
  const fresh = PRODUCTS.filter((p) => p.isNew).slice(0, 8);
  const outer = PRODUCTS.filter((p) => p.category === 'outerwear').slice(0, 4);
  const band = useReveal<HTMLElement>();

  return (
    <>
      <section className="hero" data-theme="dark" aria-labelledby="hero-title">
        <GlitchVideo src={assetUrl('video/hero.mp4')} srcSmall={assetUrl('video/hero-960.mp4')} poster={assetUrl('video/hero-poster.jpg')} />
        <HudGrid />
        <div className="hud hero__hud">
          <p className="hud__t hud--tl mono"><Type>{'The city\nnever sleeps'}</Type><span className="hud__dot" /></p>
          <AroundMark as="h1" className="hud__t hud--tc mono hud__center" text="Clothing for the after-hours city. Heavy, quiet, black. Cut in Prague for the ones who stay out." />
          <p className="hud__t hud--tr mono"><Type delay={200}>{'Drop 07\nCurfew'}</Type></p>
          <p className="hud__t hud--ml mono"><Type delay={400}>{'Machine & human\nTRK 0.92'}</Type></p>
          <p className="hud__pill mono">(C) 2026</p>
          <p className="hud__t hud--mr mono"><Type delay={500}>{'Heavy cloth\n480 to 620 gsm'}</Type></p>
          <Link to="/shop?new=1" className="hud--bl hud__cta">Shop new arrivals</Link>
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
          <Link to="/shop" className="block__link">View all {PRODUCTS.length} products</Link>
        </div>
        <div className="grid">
          {fresh.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} />)}
        </div>
      </section>

      <section ref={band} className="band reveal" data-theme="dark" aria-labelledby="band-title">
        <div className="band__img">
          <Img src="look/skate" alt="A person in a pale cropped top and wide trousers standing alone in a dark, empty building" sizes="100vw" />
          <div className="band__noise" aria-hidden="true" />
        </div>
        <HudGrid />
        <div className="hud">
          <p className="hud__t hud--tl mono"><Type>{'The future\nis coming'}</Type><span className="hud__dot" /></p>
          <AroundMark as="h2" className="hud__t hud--tc mono hud__center" text="In the grey of the city we wear the night as a uniform. Cut close, built heavy, made to outlast the trend." />
          <p className="hud__t hud--tr mono"><Type delay={200}>{'Delicate lines\nwool / nylon'}</Type></p>
          <p className="hud__t hud--ml mono"><Type delay={350}>{'Machine & human\nAI 0.98'}</Type></p>
          <p className="hud__pill mono">VAULTX</p>
          <p className="hud__t hud--mr mono"><Type delay={450}>{'Controlled\ncurves'}</Type></p>
          <Link to="/about" className="hud--bl hud__cta">About us</Link>
          <p className="hud__t hud--bc mono hud__big">Bold strokes / soft light</p>
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
          <Link to="/shop?c=outerwear" className="block__link">View outerwear</Link>
        </div>
        <div className="grid">{outer.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
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
