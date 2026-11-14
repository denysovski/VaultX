import { Link } from 'react-router';
import { LOOKS, PHOTOGRAPHER } from '../data/looks';
import { Img } from '../components/Img';

export default function Lookbook() {
  return (
    <div className="lookbook" data-theme="dark">
      <header className="lookbook__head">
        <h1 className="page-title">Lookbook</h1>
        <p className="mono muted">
          Photos:{' '}
          <a href={PHOTOGRAPHER.url} target="_blank" rel="noopener noreferrer" className="text-link">{PHOTOGRAPHER.name}</a>
        </p>
      </header>
      <ul className="looks">
        {LOOKS.map((l, i) => (
          <li key={l.key} className={`looks__item looks__item--${i % 5}`}>
            <figure>
              <Img src={`look/${l.key}`} alt={l.alt} sizes="(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw" priority={i < 2} />
              <figcaption>
                <span className="mono">{String(i + 1).padStart(2, '0')} / {l.caption}</span>
                <a href={l.unsplash} target="_blank" rel="noopener noreferrer" className="mono muted">Unsplash</a>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="lookbook__foot">
        <Link to="/shop" className="btn btn--light"><span className="btn__label">Shop Drop 07</span></Link>
      </div>
    </div>
  );
}
