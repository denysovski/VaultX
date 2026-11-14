import { Link, useParams } from 'react-router';
import { useStore, orderStatus } from '../lib/store';
import { money, deliveryWindow } from '../lib/format';
import { Img } from '../components/Img';

export default function OrderDone() {
  const { id = '' } = useParams();
  const { orders, ready } = useStore();
  const o = orders.find((x) => x.id === id);

  if (!ready) return <div className="order" data-theme="light"><div className="skeleton" style={{ height: 300 }} /></div>;

  if (!o) {
    return (
      <div className="order" data-theme="light">
        <h1 className="page-title">Order not found</h1>
        <div className="empty">
          <p>We cannot find order {id} in this browser. Orders are saved on the device they were placed on.</p>
          <div className="empty__actions">
            <Link to="/help#track" className="btn btn--solid"><span className="btn__label">Track with order number and email</span></Link>
          </div>
        </div>
      </div>
    );
  }

  const { steps, current } = orderStatus(o);
  return (
    <div className="order" data-theme="light">
      <p className="mono muted">Order {o.id}</p>
      <h1 className="mega pulse-in">Locked in</h1>
      <p className="order__lead">
        Thank you, {o.address.name.split(' ')[0]}. A receipt is on its way to <strong>{o.email}</strong>. Expected delivery {deliveryWindow(o.shipping.days, new Date(o.createdAt))}.
      </p>
      {o.payment.type === 'transfer' && (
        <div className="note">
          <p className="mono">Bank transfer details</p>
          <p>IBAN: shown in your receipt email. Reference: <span className="mono">{o.id}</span>. Amount: <span className="mono tnum">{money(o.total)}</span>. Pieces are reserved for 3 days.</p>
        </div>
      )}

      <div className="order__grid">
        <section aria-labelledby="ot">
          <h2 id="ot" className="section-title">Status</h2>
          <ol className="timeline">
            {steps.map((s, i) => (
              <li key={s.label} className={i <= current ? 'is-done' : ''} aria-current={i === current ? 'step' : undefined}>
                {s.label}
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="oi">
          <h2 id="oi" className="section-title">Pieces</h2>
          <ul className="summary__lines">
            {o.lines.map((l) => (
              <li key={`${l.slug}-${l.colour}-${l.size}`}>
                <div className="summary__img"><Img src={`garment/${l.image}`} alt="" sizes="64px" /><span className="summary__qty mono tnum">{l.qty}</span></div>
                <div><p>{l.name}</p><p className="mono muted small">{l.colourName} / {l.size}</p></div>
                <p className="mono tnum">{money(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="totals tnum">
            <div><dt>Shipping</dt><dd className="mono">{o.shipping.price ? money(o.shipping.price) : 'Free'}</dd></div>
            {o.discount > 0 && <div><dt>Discount</dt><dd className="mono">−{money(o.discount)}</dd></div>}
            <div className="totals__total"><dt>Paid</dt><dd className="mono">{money(o.total)}</dd></div>
          </dl>
          <p className="mono muted small">{o.payment.type === 'card' ? `${o.payment.brand} ending ${o.payment.last4}` : 'Bank transfer'}</p>
        </section>
        <section aria-labelledby="oa">
          <h2 id="oa" className="section-title">Delivering to</h2>
          <address className="addr">
            {o.address.name}<br />{o.address.street}<br />{o.address.postcode} {o.address.city}<br />{new Intl.DisplayNames(['en'], { type: 'region' }).of(o.address.country) ?? o.address.country}
          </address>
        </section>
      </div>

      <div className="order__next">
        <Link to="/shop" className="btn btn--solid"><span className="btn__label">Keep browsing</span></Link>
        <Link to="/help#issue" className="text-link">Something wrong with this order?</Link>
      </div>
    </div>
  );
}
