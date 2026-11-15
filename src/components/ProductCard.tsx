import { Link } from 'react-router';
import type { Product } from '../data/products';
import { totalStock } from '../data/products';
import { money } from '../lib/format';
import { ProductImg } from './Img';

export function ProductCard({ product: p, priority }: { product: Product; priority?: boolean }) {
  const left = totalStock(p);
  return (
    <article className="card">
      <Link to={`/shop/${p.slug}`} className="card__link">
        <div className="card__frame">
          <ProductImg src={p.image} alt={p.name} priority={priority} />
          <span className="card__code mono" aria-hidden="true">{p.code}</span>
          {left === 0 ? <span className="card__flag mono">Sold out</span> : left < 6 ? <span className="card__flag mono">Low stock</span> : p.isNew ? <span className="card__flag mono">New</span> : null}
          <span className="card__track" aria-hidden="true">
            <span className="mono">{p.spec}</span>
          </span>
        </div>
        <div className="card__meta">
          <h3 className="card__name">{p.name}</h3>
          <p className="card__price tnum">{money(p.price)}</p>
        </div>
      </Link>
    </article>
  );
}
