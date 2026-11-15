import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore, type Order } from '../lib/store';
import { getProduct, SHIPPING_METHODS, FREE_SHIPPING_FROM, PROMO_CODES, type ShippingId } from '../data/products';
import { money, deliveryWindow } from '../lib/format';
import * as v from '../lib/validate';
import { read, write, remove } from '../lib/storage';
import { Field, Select, RadioCards, Check, Button } from '../components/Field';
import { ProductImg } from '../components/Img';

const COUNTRIES = [
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'DE', label: 'Germany' },
  { value: 'AT', label: 'Austria' },
  { value: 'PL', label: 'Poland' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
];

interface Draft {
  email: string;
  updates: boolean;
  name: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  method: ShippingId;
  pay: 'card' | 'transfer';
  promo: string;
}

const EMPTY: Draft = { email: '', updates: true, name: '', street: '', city: '', postcode: '', country: 'CZ', phone: '', method: 'standard', pay: 'card', promo: '' };

type Errors = Partial<Record<string, string>>;

export default function Checkout() {
  const { bag, subtotal, ready, user, saveOrder, clearBag, toast } = useStore();
  const nav = useNavigate();
  const [d, setD] = useState<Draft>(EMPTY);
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'declined'>('idle');
  const [online, setOnline] = useState(true);

  // Restore the draft (session only, card details are never saved).
  useEffect(() => {
    const saved = read<Partial<Draft>>('checkout-draft', {}, 'session');
    setD((x) => ({ ...x, ...saved, email: saved.email || user?.email || '', name: saved.name || user?.name || '' }));
    setPromoInput(saved.promo ?? '');
  }, [user]);
  useEffect(() => {
    if (ready) write('checkout-draft', d, 'session');
  }, [d, ready]);
  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener('online', set);
    window.addEventListener('offline', set);
    return () => { window.removeEventListener('online', set); window.removeEventListener('offline', set); };
  }, []);

  const up = <K extends keyof Draft>(k: K) => (val: Draft[K]) => setD((x) => ({ ...x, [k]: typeof val === 'string' ? v.clean(val as string) : val }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const brand = v.cardBrand(v.digits(cardNum));
  const errors: Errors = useMemo(() => {
    const e: Errors = {
      email: v.email(d.email),
      name: v.name(d.name),
      street: d.street.trim().length < 4 ? 'Enter your street and house number' : '',
      city: v.required('city')(d.city),
      postcode: v.postcode(d.postcode, d.country),
      phone: v.phone(d.phone),
      terms: terms ? '' : 'Accept the terms to place your order',
    };
    if (d.pay === 'card') {
      e.cardNum = v.card(cardNum);
      e.cardName = v.name(cardName) ? 'Enter the name printed on the card' : '';
      e.exp = v.expiry(exp);
      e.cvc = v.cvc(cvc, brand);
    }
    return e;
  }, [d, cardNum, cardName, exp, cvc, brand, terms]);

  const show = (k: string) => (touched[k] || submitted ? errors[k] : '');

  const method = SHIPPING_METHODS.find((m) => m.id === d.method)!;
  const discountRate = PROMO_CODES[d.promo] ?? 0;
  const discount = Math.round(subtotal * discountRate * 100) / 100;
  const shipping = d.method === 'standard' && subtotal - discount >= FREE_SHIPPING_FROM ? 0 : method.price;
  const total = subtotal - discount + shipping;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setD((x) => ({ ...x, promo: code }));
      setPromoErr('');
      toast(`${code} applied: ${Math.round(PROMO_CODES[code] * 100)} % off`, 'ok');
    } else {
      setPromoErr('This code is not valid or has expired');
    }
  };

  const place = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = Object.entries(errors).find(([, msg]) => msg);
    if (first) {
      const el = document.querySelector<HTMLElement>(`[data-field="${first[0]}"] input, [data-field="${first[0]}"] button`);
      el?.focus();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!online) return;
    setState('busy');
    setTimeout(() => {
      // Test card that always declines, so the error state can be tried.
      if (v.digits(cardNum) === '4000000000000002') {
        setState('declined');
        return;
      }
      const id = `VX-${String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')}`;
      const order: Order = {
        id,
        createdAt: new Date().toISOString(),
        email: d.email.trim().toLowerCase(),
        userId: user?.id,
        lines: bag.map((l) => {
          const p = getProduct(l.slug)!;
          return { ...l, name: p.name, price: p.price, image: p.image };
        }),
        shipping: { method: d.method, price: shipping, days: [...method.days] as [number, number] },
        address: { name: d.name.trim(), street: d.street.trim(), city: d.city.trim(), postcode: d.postcode.trim(), country: d.country, phone: d.phone.trim() },
        payment: d.pay === 'card' ? { type: 'card', brand: brand || 'Card', last4: v.digits(cardNum).slice(-4) } : { type: 'transfer' },
        subtotal,
        discount,
        promo: d.promo || undefined,
        total,
      };
      saveOrder(order);
      clearBag();
      remove('checkout-draft', 'session');
      nav(`/order/${id}`, { replace: true });
    }, 1400);
  };

  if (!ready) {
    return (
      <div className="checkout" data-theme="light">
        <h1 className="page-title">Checkout</h1>
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (!bag.length) {
    return (
      <div className="checkout" data-theme="light">
        <h1 className="page-title">Checkout</h1>
        <div className="empty">
          <p className="empty__big">Your bag is empty</p>
          <p>Add a piece first, then come back here to pay.</p>
          <div className="empty__actions">
            <Link to="/shop" className="btn btn--solid"><span className="btn__label">Browse Drop 07</span></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout" data-theme="light">
      <h1 className="page-title">
        Checkout
        {!user && <Link to="/account?next=/checkout" className="text-link page-title__aside">Sign in</Link>}
      </h1>
      <form className="checkout__layout" onSubmit={place} noValidate>
        <div className="checkout__form">
          <section className="step" aria-labelledby="s1">
            <h2 id="s1" className="step__title">Contact</h2>
            <div data-field="email">
              <Field label="Email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={d.email} onChange={up('email')} onBlur={blur('email')} error={show('email')} />
            </div>
            <Check checked={d.updates} onChange={up('updates')} label="Send me delivery updates by email" />
          </section>

          <section className="step" aria-labelledby="s2">
            <h2 id="s2" className="step__title">Delivery</h2>
            <div className="row">
              <div data-field="name" className="col-2"><Field label="Full name" autoComplete="name" required maxLength={80} value={d.name} onChange={up('name')} onBlur={blur('name')} error={show('name')} /></div>
              <div data-field="street" className="col-2"><Field label="Street and house number" autoComplete="street-address" required maxLength={120} value={d.street} onChange={up('street')} onBlur={blur('street')} error={show('street')} /></div>
              <div data-field="city"><Field label="City" autoComplete="address-level2" required maxLength={60} value={d.city} onChange={up('city')} onBlur={blur('city')} error={show('city')} /></div>
              <div data-field="postcode"><Field label="Postcode" autoComplete="postal-code" required maxLength={10} value={d.postcode} onChange={up('postcode')} onBlur={blur('postcode')} error={show('postcode')} hint={v.POSTCODE[d.country] ? `For example ${v.POSTCODE[d.country].hint}` : undefined} /></div>
              <div data-field="country"><Select label="Country" value={d.country} options={COUNTRIES} onChange={up('country')} required /></div>
              <div data-field="phone"><Field label="Phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={d.phone} onChange={up('phone')} onBlur={blur('phone')} error={show('phone')} /></div>
            </div>
            <RadioCards
              legend="Delivery method"
              name="method"
              value={d.method}
              onChange={up('method')}
              options={SHIPPING_METHODS.map((m) => ({
                value: m.id,
                title: m.label,
                detail: `${m.detail}. Arrives ${deliveryWindow(m.days)}`,
                aside: m.id === 'standard' && subtotal - discount >= FREE_SHIPPING_FROM ? 'Free' : money(m.price),
              }))}
            />
          </section>

          <section className="step" aria-labelledby="s3">
            <h2 id="s3" className="step__title">Payment</h2>
            <RadioCards
              legend="Pay with"
              name="pay"
              value={d.pay}
              onChange={up('pay')}
              options={[
                { value: 'card', title: 'Card', detail: 'Visa, Mastercard or American Express' },
                { value: 'transfer', title: 'Bank transfer', detail: 'We ship once the payment arrives, usually next working day' },
              ]}
            />
            {d.pay === 'card' ? (
              <div className="row card-fields">
                <div data-field="cardNum" className="col-2">
                  <Field label="Card number" inputMode="numeric" autoComplete="cc-number" required maxLength={23} value={cardNum} onChange={(x) => setCardNum(v.formatCard(x))} onBlur={blur('cardNum')} error={show('cardNum')} adornment={brand ? <span className="mono">{brand}</span> : null} hint="Demo store: use 4242 4242 4242 4242. 4000 0000 0000 0002 shows a decline." />
                </div>
                <div data-field="cardName" className="col-2"><Field label="Name on card" autoComplete="cc-name" required maxLength={80} value={cardName} onChange={(x) => setCardName(v.clean(x, 80))} onBlur={blur('cardName')} error={show('cardName')} /></div>
                <div data-field="exp"><Field label="Expiry MM / YY" inputMode="numeric" autoComplete="cc-exp" required maxLength={7} value={exp} onChange={(x) => setExp(v.formatExpiry(x))} onBlur={blur('exp')} error={show('exp')} /></div>
                <div data-field="cvc"><Field label="Security code" inputMode="numeric" autoComplete="cc-csc" required maxLength={4} value={cvc} onChange={(x) => setCvc(v.digits(x).slice(0, 4))} onBlur={blur('cvc')} error={show('cvc')} /></div>
              </div>
            ) : (
              <p className="note">IBAN and reference follow after the order. Reserved for 3 days.</p>
            )}
          </section>

          <section className="step" aria-labelledby="s4">
            <h2 id="s4" className="step__title">Confirm</h2>
            <div data-field="terms">
              <Check checked={terms} onChange={setTerms} error={show('terms')} label={<>I accept the <Link to="/terms" className="text-link" target="_blank">terms of sale</Link> and the 30-day return policy.</>} />
            </div>
            {state === 'declined' && (
              <div className="alert" role="alert">
                <p><strong>Your bank declined the payment.</strong> Nothing was charged. Check the card details, try another card, or pay by bank transfer.</p>
              </div>
            )}
            {!online && <p className="alert" role="alert">You are offline. Your details are saved; place the order when you are back online.</p>}
            <Button type="submit" className="btn--wide" busy={state === 'busy'} disabled={!online}>
              {state === 'busy' ? 'Confirming payment' : `Place order and pay ${money(total)}`}
            </Button>
          </section>
        </div>

        <aside className="summary" aria-labelledby="sum-title">
          <h2 id="sum-title" className="step__title">Your order</h2>
          <ul className="summary__lines">
            {bag.map((l) => {
              const p = getProduct(l.slug)!;
              return (
                <li key={`${l.slug}-${l.size}`}>
                  <div className="summary__img"><ProductImg src={p.image} alt="" /><span className="summary__qty mono tnum">{l.qty}</span></div>
                  <div>
                    <p>{p.name}</p>
                    <p className="mono muted small">Size {l.size}</p>
                  </div>
                  <p className="mono tnum">{money(p.price * l.qty)}</p>
                </li>
              );
            })}
          </ul>
          <div className="promo">
            <Field label="Discount code" value={promoInput} onChange={(x) => { setPromoInput(v.clean(x, 20)); setPromoErr(''); }} maxLength={20} error={promoErr} autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }} />
            <Button type="button" variant="ghost" onClick={applyPromo}>Apply</Button>
          </div>
          <dl className="totals tnum">
            <div><dt>Subtotal</dt><dd className="mono">{money(subtotal)}</dd></div>
            {discount > 0 && <div><dt>Discount {d.promo}</dt><dd className="mono">−{money(discount)}</dd></div>}
            <div><dt>Shipping, {method.label.toLowerCase()}</dt><dd className="mono">{shipping ? money(shipping) : 'Free'}</dd></div>
            <div className="totals__total"><dt>Total</dt><dd className="mono">{money(total)}</dd></div>
          </dl>
          <p className="muted small">VAT included. Try VAULT10.</p>
        </aside>
      </form>
    </div>
  );
}
