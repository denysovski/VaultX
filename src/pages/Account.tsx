import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useStore, orderStatus } from '../lib/store';
import { login, register, sessionExpired } from '../lib/auth';
import * as v from '../lib/validate';
import { money } from '../lib/format';
import { Field, Button } from '../components/Field';

export default function Account() {
  const { user, ready, orders, logout } = useStore();

  if (!ready) return <div className="account" data-theme="light"><h1 className="page-title">Account</h1><div className="skeleton" style={{ height: 280 }} /></div>;
  if (!user) return <AuthForms />;

  const mine = orders.filter((o) => o.userId === user.id || o.email === user.email);
  return (
    <div className="account" data-theme="light">
      <h1 className="page-title">{user.name}</h1>
      <div className="account__grid">
        <section aria-labelledby="ord">
          <h2 id="ord" className="section-title">Orders</h2>
          {mine.length === 0 ? (
            <div className="empty empty--inline">
              <p>No orders yet.</p>
              <Link to="/shop" className="text-link">Browse Drop 07</Link>
            </div>
          ) : (
            <ul className="orders">
              {mine.map((o) => {
                const s = orderStatus(o);
                return (
                  <li key={o.id}>
                    <Link to={`/order/${o.id}`} className="orders__row">
                      <span className="mono">{o.id}</span>
                      <span>{new Date(o.createdAt).toLocaleDateString('en-GB')}</span>
                      <span>{s.steps[s.current].label}</span>
                      <span className="mono tnum">{money(o.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="det">
          <h2 id="det" className="section-title">Details</h2>
          <dl className="kv">
            <div><dt className="mono">Name</dt><dd>{user.name}</dd></div>
            <div><dt className="mono">Email</dt><dd>{user.email}</dd></div>
          </dl>
          <button className="btn btn--ghost" onClick={logout}><span className="btn__label">Sign out</span></button>
        </section>
      </div>
    </div>
  );
}

function AuthForms() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [expired, setExpired] = useState(false);
  const { setUser, toast } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const next = v.safeNext(params.get('next'));

  useEffect(() => setExpired(sessionExpired()), []);

  const errs = {
    name: mode === 'up' ? v.name(name) : '',
    mail: v.email(mail),
    pass: mode === 'up' ? v.password(pass) : pass ? '' : 'Enter your password',
  };
  const err = (k: keyof typeof errs) => (touched[k] || submitted ? errs[k] : '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormErr('');
    const first = (Object.keys(errs) as (keyof typeof errs)[]).find((k) => errs[k]);
    if (first) {
      document.getElementById(`auth-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const u = mode === 'up' ? await register(name, mail, pass) : await login(mail, pass);
      setUser(u);
      toast(mode === 'up' ? 'Account created. Welcome to the vault.' : `Signed in as ${u.name.split(' ')[0]}`, 'ok');
      if (next !== '/account') nav(next);
    } catch (x) {
      setFormErr(x instanceof Error ? x.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const strength = pass.length === 0 ? 0 : Math.min(4, [pass.length >= 10, /\d/.test(pass), /[A-Z]/.test(pass) && /[a-z]/.test(pass), /[^A-Za-z0-9]/.test(pass) || pass.length >= 16].filter(Boolean).length);

  return (
    <div className="account account--auth" data-theme="light">
      <h1 className="page-title">Account</h1>
      <div className="auth">
        <div className="auth__tabs" role="tablist" aria-label="Account">
          <button role="tab" aria-selected={mode === 'in'} className={`toggle${mode === 'in' ? ' is-on' : ''}`} onClick={() => { setMode('in'); setFormErr(''); setSubmitted(false); }}>Sign in</button>
          <button role="tab" aria-selected={mode === 'up'} className={`toggle${mode === 'up' ? ' is-on' : ''}`} onClick={() => { setMode('up'); setFormErr(''); setSubmitted(false); }}>Create account</button>
        </div>
        {expired && mode === 'in' && <p className="note" role="status">Your session ended after 7 days. Sign in again; your bag is still here.</p>}
        <form onSubmit={submit} noValidate className="auth__form">
          {mode === 'up' && <Field id="auth-name" label="Full name" autoComplete="name" required maxLength={80} value={name} onChange={(x) => setName(v.clean(x, 80))} onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={err('name')} />}
          <Field id="auth-mail" label="Email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={mail} onChange={(x) => setMail(v.clean(x, 254))} onBlur={() => setTouched((t) => ({ ...t, mail: true }))} error={err('mail')} />
          <Field
            id="auth-pass"
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            required
            maxLength={128}
            value={pass}
            onChange={setPass}
            onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
            error={err('pass')}
            hint={mode === 'up' ? 'At least 10 characters with letters and a number.' : undefined}
            adornment={<button type="button" className="link-btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>}
          />
          {mode === 'up' && (
            <div className="strength" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} className={i < strength ? 'is-on' : ''} />)}
            </div>
          )}
          {formErr && <p className="alert" role="alert">{formErr}</p>}
          <Button type="submit" className="btn--wide" busy={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</Button>
        </form>
      </div>
    </div>
  );
}
