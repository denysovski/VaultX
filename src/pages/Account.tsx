import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useStore, orderStatus } from '../lib/store';
import { login, register, sessionExpired, googleSignIn } from '../lib/auth';
import { googleEnabled, loadGsi, initGoogle, verifyIdToken } from '../lib/google';
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
      <h1 className="page-title">Account</h1>
      <div className="account__grid">
        <section aria-labelledby="ord" className="stagger">
          <h2 id="ord" className="mono">Orders</h2>
          {mine.length === 0 ? (
            <p className="muted">No orders yet. <Link to="/shop" className="text-link">Shop new arrivals</Link></p>
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
            <div><dt className="mono">Sign-in</dt><dd>{user.methods.map((m) => (m === 'google' ? 'Google' : 'Password')).join(' and ')}</dd></div>
          </dl>
          <button className="btn btn--ghost" onClick={logout}>Sign out</button>
        </section>
      </div>
    </div>
  );
}

function GoogleButton({ onDone }: { onDone: (name: string) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'busy'>('idle');
  const [err, setErr] = useState('');
  const { setUser } = useStore();

  useEffect(() => {
    if (!googleEnabled) return;
    let alive = true;
    setState('loading');
    loadGsi()
      .then(() => {
        if (!alive || !slot.current) return;
        const handle = async (jwt: string) => {
          setState('busy');
          setErr('');
          try {
            const profile = await verifyIdToken(jwt);
            const u = googleSignIn(profile);
            setUser(u);
            onDone(u.name);
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Google sign-in failed.');
            setState('ready');
            initGoogle(handle); // fresh nonce for the next attempt
          }
        };
        initGoogle(handle);
        window.google!.accounts.id.renderButton(slot.current, { type: 'standard', theme: 'filled_black', size: 'large', shape: 'rectangular', text: 'continue_with', logo_alignment: 'left', width: Math.min(400, slot.current.clientWidth || 320) });
        setState('ready');
      })
      .catch((e) => {
        if (alive) {
          setErr(e.message);
          setState('idle');
        }
      });
    return () => {
      alive = false;
    };
  }, [onDone, setUser]);

  if (!googleEnabled) {
    return (
      <div className="gbtn">
        <button type="button" className="btn btn--ghost btn--wide" disabled aria-describedby="g-off">Continue with Google</button>
        <p id="g-off" className="small muted">Google sign-in is switched off on this copy of the store.</p>
      </div>
    );
  }
  return (
    <div className="gbtn" aria-busy={state === 'loading' || state === 'busy'}>
      <div ref={slot} className="gbtn__slot" />
      {state === 'loading' && <div className="skeleton gbtn__skel" />}
      {state === 'busy' && <p className="small muted" role="status">Verifying with Google</p>}
      {err && <p className="field__error" role="alert">{err}</p>}
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

  const done = (n: string) => {
    toast(`Signed in as ${n.split(' ')[0]}`, 'ok');
    if (next !== '/account') nav(next);
  };

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
      done(u.name);
    } catch (x) {
      setFormErr(x instanceof Error ? x.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="account account--auth" data-theme="light">
      <h1 className="page-title">Account</h1>
      <div className="auth stagger">
        <div className="auth__tabs" role="tablist" aria-label="Account">
          <button role="tab" aria-selected={mode === 'in'} className={`tab${mode === 'in' ? ' is-on' : ''}`} onClick={() => { setMode('in'); setFormErr(''); setSubmitted(false); }}>Sign in</button>
          <button role="tab" aria-selected={mode === 'up'} className={`tab${mode === 'up' ? ' is-on' : ''}`} onClick={() => { setMode('up'); setFormErr(''); setSubmitted(false); }}>Create account</button>
        </div>
        {expired && mode === 'in' && <p className="note" role="status">Your session ended. Sign in again; your bag is still here.</p>}
        <GoogleButton onDone={done} />
        <p className="or mono" aria-hidden="true"><span>or with email</span></p>
        <form key={mode} onSubmit={submit} noValidate className="auth__form stagger">
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
            hint={mode === 'up' ? 'At least 10 characters, letters and a number.' : undefined}
            adornment={<button type="button" className="link-btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>}
          />
          {formErr && <p className="alert" role="alert">{formErr}</p>}
          <Button type="submit" className="btn--wide" busy={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</Button>
        </form>
      </div>
    </div>
  );
}
