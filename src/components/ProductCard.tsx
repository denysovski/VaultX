import { Link } from 'react-router';
import type { Product, Colourway } from '../data/products';
import { totalStock } from '../data/products';
import { money } from '../lib/format';
import { Img } from './Img';

interface Props {
  product: Product;
  colour?: Colourway;
  priority?: boolean;
  sizes?: string;
}

export function ProductCard({ product: p, colour, priority, sizes = '(min-width: 1100px) 25vw, (min-width: 640px) 33vw, 50vw' }: Props) {
  const c = colour ?? p.colours[0];
  const left = totalStock(c);
  return (
    <article className="card">
      <Link to={`/shop/${p.slug}${colour ? `?colour=${c.id}` : ''}`} className="card__link">
        <div className="card__stage">
          <Img src={`garment/${c.image}`} alt={`${p.name} in ${c.name}`} sizes={sizes} priority={priority} className="card__img" />
          {left === 0 ? <span className="card__flag mono">Sold out</span> : left < 8 ? <span className="card__flag mono">Last {left}</span> : null}
        </div>
        <div className="card__meta">
          <h3 className="card__name">{p.name}</h3>
          <p className="card__price mono tnum">{money(p.price)}</p>
          <p className="card__sub mono">
            {colour ? c.name : p.colours.length > 1 ? `${p.colours.length} colours` : c.name}
          </p>
        </div>
      </Link>
    </article>
  );
}
