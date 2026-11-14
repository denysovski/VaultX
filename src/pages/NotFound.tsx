import { Link } from 'react-router';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export default function NotFound() {
  return (
    <div className="notfound" data-theme="light">
      <p className="notfound__code" aria-hidden="true">404</p>
      <h1 className="mega">This door stays shut</h1>
      <p>The page you asked for does not exist, or it moved in the last drop.</p>
      <div className="empty__actions">
        <Link to="/" className="btn btn--solid"><span className="btn__label">Back to the start</span></Link>
        <Link to="/shop?focus=search" className="text-link">Search the shop</Link>
        <Link to="/help" className="text-link">Help desk</Link>
      </div>
      <h2 className="sr-only">Popular pieces</h2>
      <div className="grid notfound__grid">
        {PRODUCTS.slice(0, 4).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
