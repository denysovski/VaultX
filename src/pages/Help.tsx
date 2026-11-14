import { useState } from 'react';
import { Link } from 'react-router';
import { useStore, orderStatus, type Order } from '../lib/store';
import * as v from '../lib/validate';
import { deliveryWindow } from '../lib/format';
import { Field, Select, RadioCards, Button } from '../components/Field';
import { FAQ } from '../seo';

export default function Help() {
  return (
    <div className="help" data-theme="light">
      <header className="help__head">
        <h1 className="page-title">Help</h1>
        <nav className="help__jump" aria-label="On this page">
          <a href="#track">Track an order</a>
          <a href="#issue">Delivery problem</a>
          <a href="#returns">Returns</a>
          <a href="#faq">Questions</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <Track />
      <Issue />
      <Returns />
      <section id="faq" className="help__sec" aria-labelledby="faq-t">
        <h2 id="faq-t" className="section-title">FAQ</h2>
        <div className="accordion">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <Contact />
    </div>
  );
}

function Track() {
  const { orders } = useStore();
  const [id, setId] = useState('');
  const [mail, setMail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Order | null | undefined>(undefined);
  const e = { id: v.orderId(id), mail: v.email(mail) };
  const sub = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    if (e.id || e.mail) return;
    setBusy(true);
    setTimeout(() => {
      setResult(orders.find((o) => o.id === id.trim().toUpperCase() && o.email === mail.trim().toLowerCase()) ?? null);
      setBusy(false);
    }, 500);
  };
  const latest = orders[0];
  return (
    <section id="track" className="help__sec" aria-labelledby="track-t">
      <h2 id="track-t" className="section-title">Track an order</h2>
      <div className="help__cols">
        <form className="stack" onSubmit={sub} noValidate>
          <Field label="Order number" required value={id} onChange={(x) => setId(v.clean(x, 12).toUpperCase())} error={submitted ? e.id : ''} autoComplete="off" />
          <Field label="Email used for the order" type="email" required value={mail} onChange={(x) => setMail(v.clean(x, 254))} error={submitted ? e.mail : ''} autoComplete="email" />
          <Button type="submit" busy={busy}>Find my order</Button>
          {latest && (
            <button type="button" className="link-btn" onClick={() => { setId(latest.id); setMail(latest.email); }}>
              Fill in my last order ({latest.id})
            </button>
          )}
        </form>
        <div aria-live="polite">
          {result === null && (
            <div className="alert">
              <p><strong>No order matches that number and email.</strong> Check both for typos. Orders in this demo exist only in the browser they were placed in. Still stuck? <a href="#contact" className="text-link">Message the studio</a>.</p>
            </div>
          )}
          {result && <TrackResult o={result} />}
        </div>
      </div>
    </section>
  );
}

function TrackResult({ o }: { o: Order }) {
  const { steps, current } = orderStatus(o);
  return (
    <div className="track-result">
      <p className="mono">{o.id}</p>
      <p>Expected {deliveryWindow(o.shipping.days, new Date(o.createdAt))}, to {o.address.city}.</p>
      <ol className="timeline">
        {steps.map((s, i) => (
          <li key={s.label} className={i <= current ? 'is-done' : ''} aria-current={i === current ? 'step' : undefined}>{s.label}</li>
        ))}
      </ol>
      <Link to={`/order/${o.id}`} className="text-link">Open the full order</Link>
    </div>
  );
}

const ISSUES = [
  { value: 'late', title: 'It is late', detail: 'Past the delivery window shown at checkout' },
  { value: 'not-received', title: 'Marked delivered, but I do not have it', detail: 'Check neighbours and reception first' },
  { value: 'damaged', title: 'Arrived damaged', detail: 'Add a photo of the parcel and the piece' },
  { value: 'wrong', title: 'Wrong or missing item', detail: 'Tell us what you expected and what arrived' },
  { value: 'return', title: 'Return or exchange', detail: 'Within 30 days of delivery' },
] as const;

function Issue() {
  const { saveTicket, toast } = useStore();
  const [id, setId] = useState('');
  const [mail, setMail] = useState('');
  const [kind, setKind] = useState<(typeof ISSUES)[number]['value']>('late');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const needsPhoto = kind === 'damaged';
  const e = {
    id: v.orderId(id),
    mail: v.email(mail),
    text: text.trim().length < 15 ? 'Describe what happened in a sentence or two' : '',
    file: needsPhoto && !file ? 'Add a photo so the courier claim can go through' : fileErr,
  };

  const onFile = (f: File | null) => {
    setFileErr('');
    if (!f) return setFile(null);
    if (!/^image\/(jpeg|png|webp|heic)$/.test(f.type)) return setFileErr('Use a JPG, PNG, WebP or HEIC photo');
    if (f.size > 8 * 1024 * 1024) return setFileErr('Photo must be under 8 MB');
    setFile(f);
  };

  const sub = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    if (Object.values(e).some(Boolean)) {
      const first = Object.entries(e).find(([, m]) => m)![0];
      document.getElementById(`issue-${first}`)?.focus();
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const ticket = `T-${String(crypto.getRandomValues(new Uint16Array(1))[0]).padStart(5, '0')}`;
      saveTicket({ id: ticket, createdAt: new Date().toISOString(), kind: 'delivery', topic: kind, orderId: id.trim().toUpperCase(), email: mail.trim().toLowerCase() });
      setBusy(false);
      setDone(ticket);
      toast(`Report ${ticket} sent`, 'ok');
    }, 800);
  };

  return (
    <section id="issue" className="help__sec" aria-labelledby="issue-t">
      <h2 id="issue-t" className="section-title">Delivery problem</h2>
      {done ? (
        <div className="success" role="status">
          <p className="success__big pulse">Report {done} received</p>
          <p>Reply to {mail} within one working day.</p>
          <button className="text-link link-btn" onClick={() => { setDone(''); setSubmitted(false); setText(''); setFile(null); }}>Report another problem</button>
        </div>
      ) : (
        <form className="help__cols" onSubmit={sub} noValidate>
          <div className="stack">
            <RadioCards legend="What went wrong?" name="issue" value={kind} onChange={setKind} options={ISSUES.map((i) => ({ ...i }))} />
          </div>
          <div className="stack">
            <Field id="issue-id" label="Order number" required value={id} onChange={(x) => setId(v.clean(x, 12).toUpperCase())} error={submitted ? e.id : ''} autoComplete="off" />
            <Field id="issue-mail" label="Email used for the order" type="email" required value={mail} onChange={(x) => setMail(v.clean(x, 254))} error={submitted ? e.mail : ''} autoComplete="email" />
            <Field id="issue-text" textarea label="What happened" required value={text} onChange={(x) => setText(v.clean(x, 1500))} maxLength={1500} error={submitted ? e.text : ''} hint={`${text.length} / 1500`} />
            <div className={`file${submitted && e.file ? ' field--error' : ''}`}>
              <input id="issue-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(x) => onFile(x.target.files?.[0] ?? null)} aria-describedby="issue-file-hint" aria-invalid={!!(submitted && e.file) || undefined} />
              <label htmlFor="issue-file" className="file__label">
                <span>{file ? file.name : needsPhoto ? 'Add a photo' : 'Add a photo (optional)'}</span>
                <span className="mono muted">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'JPG, PNG, WebP, max 8 MB'}</span>
              </label>
              <p id="issue-file-hint" className="field__hint">The photo stays on your device in this demo.</p>
              {submitted && e.file && <p className="field__error" role="alert">{e.file}</p>}
            </div>
            <Button type="submit" busy={busy}>Send the report</Button>
          </div>
        </form>
      )}
    </section>
  );
}

function Returns() {
  return (
    <section id="returns" className="help__sec" aria-labelledby="ret-t">
      <h2 id="ret-t" className="section-title">Returns</h2>
      <ol className="service__list">
        <li><span className="mono">30 days</span><p>Unworn, tags on</p></li>
        <li><span className="mono">Request</span><p>Pick “Return or exchange” above</p></li>
        <li><span className="mono">Drop off</span><p>Free label, any pickup point</p></li>
        <li><span className="mono">Refund</span><p>Within 5 working days</p></li>
      </ol>
    </section>
  );
}

const TOPICS = [
  { value: 'order', label: 'An order I placed' },
  { value: 'sizing', label: 'Sizing and fit' },
  { value: 'product', label: 'A product question' },
  { value: 'press', label: 'Press and collaborations' },
  { value: 'other', label: 'Something else' },
];

function Contact() {
  const { saveTicket } = useStore();
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [topic, setTopic] = useState('order');
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const e = { name: v.name(name), mail: v.email(mail), msg: msg.trim().length < 10 ? 'Write at least a short sentence' : '' };
  const sub = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    setTimeout(() => {
      saveTicket({ id: `C-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), kind: 'contact', topic, email: mail.trim().toLowerCase() });
      setBusy(false);
      setDone(true);
    }, 700);
  };
  return (
    <section id="contact" className="help__sec help__contact" data-theme="dark" aria-labelledby="contact-t">
      <div>
        <h2 id="contact-t" className="section-title">Contact</h2>
        <dl className="kv kv--light">
          <div><dt className="mono">Reply time</dt><dd>Within one working day</dd></div>
          <div><dt className="mono">Hours</dt><dd>Mon to Fri, 9:00 to 18:00 CET</dd></div>
          <div><dt className="mono">Studio</dt><dd>Prague, Czech Republic</dd></div>
        </dl>
      </div>
      {done ? (
        <div className="success" role="status">
          <p className="success__big pulse">Message sent</p>
          <p>Reply to {mail} within one working day.</p>
        </div>
      ) : (
        <form className="stack" onSubmit={sub} noValidate>
          <Field label="Name" required autoComplete="name" value={name} onChange={(x) => setName(v.clean(x, 80))} error={submitted ? e.name : ''} />
          <Field label="Email" type="email" required autoComplete="email" value={mail} onChange={(x) => setMail(v.clean(x, 254))} error={submitted ? e.mail : ''} />
          <Select label="Topic" value={topic} options={TOPICS} onChange={setTopic} />
          <Field textarea label="Message" required value={msg} onChange={(x) => setMsg(v.clean(x, 2000))} error={submitted ? e.msg : ''} />
          <Button type="submit" variant="light" busy={busy}>Send message</Button>
        </form>
      )}
    </section>
  );
}
