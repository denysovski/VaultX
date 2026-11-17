import { useState } from 'react';
import { Link } from 'react-router';
import type { Product } from '../data/products';
import { totalStock } from '../data/products';
import { money } from '../lib/format';
import { ProductImg } from './Img';

// Thirty terminal fragments. On first hover each card takes its own random
// mix, so the backdrop is different on every page load.
const TERM = [
  '> scan --target garment', 'init vx.core 7.4.1', 'ACCESS GRANTED', 'fabric.density = 0.92',
  'node PRG-01 :: online', 'sync bag.local ... ok', '0x7f3a 0x00c1 0x9e02', 'trace /cut/panel-04',
  'seam.check(stitch=11)', '[ok] dye batch 2207', 'gsm 480 :: verified', 'curfew.flag = true',
  'night_shift.exe', 'rgb -> grey (lossless)', 'signal 0.97 / stable', 'mesh.load(hood.obj)',
  '>>> heat.map --off', 'warn: no restock', 'drop/07 :: armed', 'hash a91f-c0de-77e2',
  'tension 3.2 N/mm', 'run weave --tight', 'pattern.lock(00:42)', 'id VX-9 :: masked',
  'pkt loss 0.00%', 'mem 4096k ok', 'ping prague 4 ms', 'cloak.enable()', 'void > /dev/null',
  'EOF // stay out',
];
const pick = () => {
  const out: string[] = [];
  for (let i = 0; i < 64; i++) {
    const t = TERM[Math.floor(Math.random() * TERM.length)];
    out.push(Math.random() < 0.3 ? `${t}  ${Math.random().toString(16).slice(2, 8)}` : t);
  }
  return out;
};

// Flag text: varied per product but fixed per slug, so the prerendered page
// and the browser agree.
const FLAGS = ['Last restock', 'Limited offer', 'New', null] as const;
function flagFor(p: Product): string | null {
  const left = totalStock(p);
  if (left === 0) return 'Sold out';
  const h = [...p.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const f = FLAGS[h % FLAGS.length];
  if (left < 6 && h % 3 === 0) return left === 1 ? 'Last piece' : `${left} pieces left`;
  if (f === 'New' && !p.isNew) return 'Limited offer';
  return f;
}

export function ProductCard({ product: p, priority, vt, fx }: { product: Product; priority?: boolean; vt?: boolean; fx?: boolean }) {
  const flag = flagFor(p);
  const [term, setTerm] = useState<string[] | null>(null);
  return (
    <article
      className={`card${fx ? ' card--fx' : ''}`}
      style={vt ? ({ viewTransitionName: `card-${p.slug}` } as React.CSSProperties) : undefined}
      onPointerEnter={fx && !term ? () => setTerm(pick()) : undefined}
      onFocus={fx && !term ? () => setTerm(pick()) : undefined}
    >
      <Link to={`/shop/${p.slug}`} className="card__link">
        <div className="card__frame">
          {fx && (
            <div className="card__term mono" aria-hidden="true">
              {term?.map((l, i) => <span key={i} style={{ ['--i' as string]: i }}>{l}</span>)}
            </div>
          )}
          <ProductImg src={p.image} alt={p.name} priority={priority} />
          <span className="card__code mono" aria-hidden="true">{p.code}</span>
          {flag && <span className="card__flag mono">{flag}</span>}
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
