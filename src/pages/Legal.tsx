import { Link } from 'react-router';

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  return (
    <article className="legal" data-theme="light">
      {kind === 'privacy' ? <Privacy /> : <Terms />}
      <p className="mono muted small">Last updated 15 November 2026. VAULTX is a concept store built as a portfolio project: no goods are sold and no payments are taken.</p>
    </article>
  );
}

function Privacy() {
  return (
    <>
      <h1 className="page-title">Privacy</h1>
      <p className="legal__lead">Short version: everything you enter stays in your own browser. Nothing is sent to a server, and there are no cookies, analytics or ads.</p>
      <h2>What is stored</h2>
      <ul>
        <li>Your bag, saved so it is still there when you come back.</li>
        <li>Your account, if you create one: name, email and a salted PBKDF2 hash of your password. Never the password itself.</li>
        <li>Orders and help requests you submit, so you can track them.</li>
        <li>A checkout draft (contact and address, not card details) for the current tab only. It is deleted when the tab closes or the order is placed.</li>
      </ul>
      <h2>What is never stored</h2>
      <p>Card numbers, expiry dates and security codes. They live in the page memory while you type and are discarded after checkout; only the last four digits are kept on the order.</p>
      <h2>Where it lives</h2>
      <p>In your browser's local storage under this site's address. Other sites cannot read it. Anyone using the same browser profile can.</p>
      <h2>How to delete it</h2>
      <p>Sign out, then clear site data for this site in your browser settings. That removes the bag, account and orders at once.</p>
      <h2>Images and fonts</h2>
      <p>All photos and fonts are served from this site. No requests go to third parties while you browse.</p>
      <p>Questions: <Link to="/help#contact" className="text-link">contact the studio</Link>.</p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1 className="page-title">Terms of sale</h1>
      <p className="legal__lead">The rules for buying from VAULTX, written to be read.</p>
      <h2>Orders</h2>
      <p>An order is confirmed when you see the confirmation page and receive the receipt email. We may cancel and fully refund an order if a piece sells out before it is packed.</p>
      <h2>Prices and payment</h2>
      <p>Prices are in euro and include VAT. Shipping is shown before you pay. Card payments are taken when the order is placed; bank transfers must arrive within 3 days.</p>
      <h2>Delivery</h2>
      <p>Orders leave Prague within one working day. Delivery windows on the product and checkout pages are estimates from the courier. Duties outside the EU are paid by the recipient.</p>
      <h2 id="returns">Returns and refunds</h2>
      <p>You can return unworn pieces within 30 days of delivery, as described on the <Link to="/help#returns" className="text-link">help desk</Link>. EU customers keep their statutory 14-day right of withdrawal on top of this.</p>
      <h2>Warranty</h2>
      <p>Every piece carries the statutory 24-month warranty against manufacturing defects. Normal wear, fading of garment-dyed colours and damage from ignoring the care label are not defects.</p>
      <h2>Problems</h2>
      <p>Late, damaged or missing parcels: <Link to="/help#issue" className="text-link">report them here</Link> within 7 days of the expected delivery date.</p>
    </>
  );
}
