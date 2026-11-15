import { Link } from 'react-router';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export default function NotFound() {
  return (
    <div className="notfound" data-theme="light">
      <p className="notfound__code mono" aria-hidden="true">404 / signal lost</p>
      <h1 className="notfound__title">This page does not exist.</h1>
      <div className="empty__actions">
        <Link to="/" className="btn">Back to the start</Link>
        <Link to="/shop?focus=search" className="text-link">Search the shop</Link>
      </div>
      <h2 className="sr-only">Popular pieces</h2>
      <div className="grid notfound__grid">
        {PRODUCTS.slice(0, 4).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
