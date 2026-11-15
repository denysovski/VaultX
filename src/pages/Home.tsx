import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { GlitchVideo, HudGrid, Scramble } from '../components/Hud';
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
  const mirror = useReveal<HTMLElement>();

  return (
    <>
      <section className="hero" data-theme="dark" aria-labelledby="hero-title">
        <GlitchVideo src={assetUrl('video/hero.mp4')} srcSmall={assetUrl('video/hero-960.mp4')} poster={assetUrl('video/hero-poster.jpg')} />
        <HudGrid />
        <div className="hud hero__hud">
          <p className="hud__t hud--tl mono">
            <Scramble text={['The city\nnever sleeps', 'Neither do\nwe']} every={6000} />
            <span className="hud__dot" />
          </p>
          <h1 id="hero-title" className="hud__t hud--tc mono hero__title">
            Clothing for the after-hours city. Heavy, quiet, black. Cut in Prague for the ones who stay out.
          </h1>
          <p className="hud__t hud--tr mono">
            Drop 07
            <br />
            Curfew
          </p>
          <p className="hud__t hud--ml mono">
            <Scramble text={['Machine & human\nTRK 0.92', 'Subject in frame\nTRK 0.88', 'Under the bridge\nTRK 0.95']} every={4200} />
          </p>
          <p className="hud__pill mono">(C) 2026</p>
          <p className="hud__t hud--mr mono">
            Heavy cloth
            <br />
            480 to 620 gsm
          </p>
          <Link to="/shop" className="hud__t hud--bl mono hero__cta">
            Shop new arrivals
          </Link>
          <p className="hud__t hud--bc mono">
            <Clock /> / 50.0755 N 14.4378 E
          </p>
          <p className="hud__t hud--br mono">
            Scroll
            <br />
            for more
          </p>
        </div>
      </section>

      <nav className="cats" aria-label="Categories" data-theme="light">
        <div className="cats__row">
          <Link to="/shop" className="cats__link is-on">New arrivals</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?c=${c.id}`} className="cats__link">
              {c.label}
            </Link>
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

      <section ref={mirror} className="mirror reveal" data-theme="dark" aria-labelledby="mirror-title">
        <div className="mirror__img">
          <img src={assetUrl('video/still.jpg')} alt="" width={1280} height={720} loading="lazy" decoding="async" />
          <img src={assetUrl('video/still.jpg')} alt="" width={1280} height={720} loading="lazy" decoding="async" className="mirror__flip" />
        </div>
        <HudGrid />
        <div className="hud">
          <p className="hud__t hud--tl mono">The future<br />is coming<span className="hud__dot" /></p>
          <h2 id="mirror-title" className="hud__t hud--tc mono">In the grey of the city we wear the night as a uniform. Cut close, built heavy, made to outlast the trend.</h2>
          <p className="hud__t hud--tr mono">Delicate lines<br />wool / nylon</p>
          <p className="hud__t hud--ml mono">Machine & human<br />AI 0.98</p>
          <p className="hud__pill mono">VAULTX</p>
          <p className="hud__t hud--mr mono">Controlled<br />curves</p>
          <Link to="/lookbook" className="hud__t hud--bl mono hero__cta">Open the lookbook</Link>
          <p className="hud__t hud--bc mono">Bold strokes / soft light</p>
          <p className="hud__t hud--br mono">Prague<br />2026</p>
        </div>
      </section>

      <section className="block" data-theme="light" aria-labelledby="outer-title">
        <div className="block__head">
          <h2 id="outer-title" className="block__title">Outerwear</h2>
          <Link to="/shop?c=outerwear" className="block__link">View outerwear</Link>
        </div>
        <div className="grid">
          {outer.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="community" data-theme="light" aria-labelledby="comm-title">
        <h2 id="comm-title" className="community__title">Let us make it together</h2>
        <ul className="community__list">
          <li>for creators</li>
          <li>for artists</li>
          <li>for designers</li>
          <li>for outsiders</li>
        </ul>
        <p className="community__text">Wear it, shoot it, send it to the studio. The best frames end up in the lookbook.</p>
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
