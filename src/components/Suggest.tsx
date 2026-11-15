import { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useStore } from '../lib/store';
import { PRODUCTS, type Category, type Product } from '../data/products';
import { money } from '../lib/format';
import { ProductImg } from './Img';

// What goes well with what is already in the bag.
const PAIRS: Record<Category, Category[]> = {
  hoodies: ['belts', 'headwear', 'outerwear', 'tees'],
  knitwear: ['outerwear', 'belts', 'headwear', 'tees'],
  outerwear: ['knitwear', 'hoodies', 'headwear', 'belts'],
  tees: ['hoodies', 'belts', 'headwear', 'outerwear'],
  headwear: ['hoodies', 'outerwear', 'tees', 'belts'],
  belts: ['tees', 'hoodies', 'knitwear', 'headwear'],
};

const inStock = (p: Product) => p.sizes.filter((s) => (p.stock[s] ?? 0) > 0);

/**
 * "You might like" rail in the bag. Picks pieces that pair with the bag, ranks
 * the ones that would unlock free shipping first, and adds straight from a size chip.
 */
export function Suggest() {
  const { bag, add, freeShippingLeft } = useStore();
  const rail = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const picks = useMemo(() => {
    const inBag = new Set(bag.map((l) => l.slug));
    const cats = bag.map((l) => PRODUCTS.find((p) => p.slug === l.slug)?.category).filter(Boolean) as Category[];
    const wanted = new Map<Category, number>();
    cats.forEach((c) => PAIRS[c].forEach((k, i) => wanted.set(k, Math.max(wanted.get(k) ?? 0, 4 - i))));
    return PRODUCTS.filter((p) => !inBag.has(p.slug) && inStock(p).length)
      .map((p) => {
        const unlocks = freeShippingLeft > 0 && p.price >= freeShippingLeft;
        // pairing first, then "this gets you free shipping", then the cheaper add-on
        const score = (wanted.get(p.category) ?? 0) * 10 + (unlocks ? 15 : 0) - p.price / 100;
        return { p, unlocks, score };
      })
      .sort((a, b) => b.score - a.score)
      // at most two per category so the rail mixes belts, caps, layers...
      .filter(((seen: Record<string, number>) => ({ p }: { p: Product }) => (seen[p.category] = (seen[p.category] ?? 0) + 1) <= 2)({}))
      .slice(0, 8);
  }, [bag, freeShippingLeft]);

  const check = () => {
    const el = rail.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(check, [picks]);
  const move = (dir: number) => {
    const el = rail.current;
    const card = el?.querySelector('li');
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 8), behavior: 'smooth' });
  };

  if (!picks.length) return null;
  return (
    <section className="suggest" aria-labelledby="suggest-t">
      <div className="suggest__head">
        <h3 id="suggest-t" className="mono">You might like</h3>
        <div className="suggest__nav">
          <button type="button" aria-label="Previous" disabled={edge.start} onClick={() => move(-1)}>←</button>
          <button type="button" aria-label="Next" disabled={edge.end} onClick={() => move(1)}>→</button>
        </div>
      </div>
      <ul ref={rail} className="suggest__rail" onScroll={check}>
        {picks.map(({ p, unlocks }) => {
          const sizes = inStock(p);
          return (
            <li key={p.slug} className="suggest__card">
              <Link to={`/shop/${p.slug}`} className="suggest__img" tabIndex={-1} aria-hidden="true">
                <ProductImg src={p.image} alt="" />
              </Link>
              <Link to={`/shop/${p.slug}`} className="suggest__name">{p.name}</Link>
              <p className="suggest__price tnum">{money(p.price)}</p>
              <p className="suggest__why mono">{unlocks ? 'Free shipping with this' : 'Pairs with your bag'}</p>
              <div className="suggest__sizes" role="group" aria-label={`Add ${p.name} in size`}>
                {sizes.map((s) => (
                  <button key={s} type="button" onClick={() => add({ slug: p.slug, size: s })} aria-label={`Add ${p.name}, size ${s}`}>
                    {s === 'One size' ? '+ Add' : s}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
