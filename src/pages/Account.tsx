import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useStore, orderStatus } from '../lib/store';
import { login, register, sessionEnded, getSession, changePassword } from '../lib/auth';
import * as v from '../lib/validate';
import { money } from '../lib/format';
import { Field, Button, Check } from '../components/Field';
import { Img } from '../components/Img';
import { HudGrid, Mark, Type } from '../components/Hud';

export default function Account() {
  const { user, ready, orders, logout } = useStore();

  if (!ready) return <div className="account" data-theme="light"><h1 className="page-title">Account</h1><div className="skeleton" style={{ height: 280 }} /></div>;
  if (!user) return <AuthForms />;

  const mine = orders.filter((o) => o.userId === user.id || o.email === user.email);
  const s = getSession();
  return (
    <div className="account" data-theme="light">
      <h1 className="page-title">Account</h1>
      <div className="account__grid">
        <section aria-labelledby="ord" className="stagger">
          <h2 id="ord" className="mono">Orders</h2>
          {mine.length === 0 ? (
            <p className="muted">No orders yet. <Link to="/shop" className="text-link">Shop new arrivals</Link></p>
          ) : (
            <ul className="orders">
              {mine.map((o) => {
                const st = orderStatus(o);
                return (
                  <li key={o.id}>
                    <Link to={`/order/${o.id}`} className="orders__row">
                      <span className="mono">{o.id}</span>
                      <span>{new Date(o.createdAt).toLocaleDateString('en-GB')}</span>
                      <span>{st.steps[st.current].label}</span>
                      <span className="tnum">{money(o.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="det" className="stagger">
          <h2 id="det" className="mono">Details</h2>
          <dl className="kv">
            <div><dt className="mono">Name</dt><dd>{user.name}</dd></div>
            <div><dt className="mono">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="mono">Session</dt><dd>{s?.remember ? `Remembered on this device until ${new Date(s.expires).toLocaleDateString('en-GB')}` : 'Ends when you close the browser'}</dd></div>
          </dl>
          <PasswordForm userId={user.id} />
          <button className="btn btn--ghost" onClick={logout}>Sign out</button>
        </section>
      </div>
    </div>
  );
}

function PasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useStore();
  if (!open) return <button className="link-btn pw-toggle" onClick={() => setOpen(true)}>Change password</button>;
  return (
    <form
      className="auth__form pw-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const bad = v.password(next);
        if (!cur) return setErr('Enter your current password');
        if (bad) return setErr(bad);
        setBusy(true);
        try {
          await changePassword(userId, cur, next);
          toast('Password changed', 'ok');
          setOpen(false);
          setCur('');
          setNext('');
          setErr('');
        } catch (x) {
          setErr(x instanceof Error ? x.message : 'Something went wrong.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Current password" type="password" autoComplete="current-password" required maxLength={128} value={cur} onChange={setCur} />
      <Field label="New password" type="password" autoComplete="new-password" required maxLength={128} value={next} onChange={setNext} hint="At least 10 characters, letters and a number." />
      {err && <p className="alert" role="alert">{err}</p>}
      <Button type="submit" busy={busy}>Save password</Button>
    </form>
  );
}

function AuthForms() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'in' | 'up'>(params.get('mode') === 'up' ? 'up' : 'in');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [ended, setEnded] = useState(false);
  const { setUser, toast } = useStore();
  const nav = useNavigate();
  const next = v.safeNext(params.get('next'));

  useEffect(() => setEnded(sessionEnded()), []);

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
      const u = mode === 'up' ? await register(name, mail, pass, remember) : await login(mail, pass, remember);
      setUser(u);
      toast(mode === 'up' ? 'Account created' : `Signed in as ${u.name.split(' ')[0]}`, 'ok');
      if (next !== '/account') nav(next);
    } catch (x) {
      setFormErr(x instanceof Error ? x.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const tab = (m: 'in' | 'up') => () => {
    setMode(m);
    setFormErr('');
    setSubmitted(false);
  };

  return (
    <div className="account account--auth" data-theme="light">
      <aside className="auth__side" aria-hidden="true">
        <Img src="look/suit" alt="" sizes="(min-width: 900px) 50vw, 100vw" priority className="auth__img" />
        <span className="auth__noise" />
        <HudGrid circles={false} />
        <p className="auth__hud auth__hud--tl mono"><Type>{'Access point\nPRG-01'}</Type></p>
        <p className="auth__hud auth__hud--tr mono"><Type delay={200}>{mode === 'in' ? 'Status\nawaiting id' : 'Status\nnew member'}</Type></p>
        <Mark className="auth__mark" />
        <ul className="auth__perks mono">
          <li><Type delay={400}>Track every order</Type></li>
          <li><Type delay={550}>Early access to each drop</Type></li>
          <li><Type delay={700}>Your bag, saved on this device</Type></li>
        </ul>
      </aside>
      <div className="auth stagger">
        <h1 className="auth__title" aria-live="polite">
          {/* both titles share one cell; the box keeps its height and the words cross-fade */}
          <span className={`auth__word${mode === 'in' ? ' is-on' : ''}`} aria-hidden={mode !== 'in'}>Sign in</span>
          <span className={`auth__word${mode === 'up' ? ' is-on' : ''}`} aria-hidden={mode !== 'up'}>Create account</span>
        </h1>
        <div className="auth__tabs" role="tablist" aria-label="Account">
          <button role="tab" aria-selected={mode === 'in'} className={`tab${mode === 'in' ? ' is-on' : ''}`} onClick={tab('in')}>Sign in</button>
          <button role="tab" aria-selected={mode === 'up'} className={`tab${mode === 'up' ? ' is-on' : ''}`} onClick={tab('up')}>Create account</button>
        </div>
        {ended && mode === 'in' && <p className="note" role="status">You were signed out. Sign in again; your bag is still here.</p>}
        <form onSubmit={submit} noValidate className={`auth__form auth__form--${mode}`}>
          <div className="auth__name" inert={mode !== 'up'}>
            <div>
              <Field id="auth-name" label="Full name" autoComplete="name" required={mode === 'up'} maxLength={80} value={name} onChange={(x) => setName(v.clean(x, 80))} onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={mode === 'up' ? err('name') : undefined} />
            </div>
          </div>
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
            hint={mode === 'up' ? 'At least 10 characters, letters and a number.' : undefined}
            adornment={<button type="button" className="link-btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>}
          />
          <Check checked={remember} onChange={setRemember} label="Remember me on this device for 30 days" />
          {formErr && <p className="alert" role="alert">{formErr}</p>}
          <Button type="submit" className="btn--wide" busy={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</Button>
        </form>
      </div>
    </div>
  );
}
