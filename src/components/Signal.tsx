import { useEffect, useId, useState } from 'react';
import { read, write } from '../lib/storage';
import { email as validEmail } from '../lib/validate';

/**
 * Newsletter field, terminal style: a prompt, a big single line, a rule that
 * draws itself on focus, and a status line underneath instead of a toast.
 */
export function Signal({ id, label = 'Your email', cta = 'Subscribe', done = 'You are on the list.', className = '' }: { id?: string; label?: string; cta?: string; done?: string; className?: string }) {
  const auto = useId();
  const fid = id ?? `sig-${auto}`;
  const [mail, setMail] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const sync = () => setOk(!!read<string>('vault-list', ''));
    sync();
    // another sign-up form on the page (or another tab) subscribed: show done here too
    window.addEventListener('vaultx:list', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('vaultx:list', sync); window.removeEventListener('storage', sync); };
  }, []);

  const status = ok ? done : err ? err : mail ? 'Press enter to send' : 'Waiting for input';
  return (
    <form
      className={`signal${ok ? ' is-done' : ''}${err ? ' is-err' : ''} ${className}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const v = validEmail(mail);
        if (v) return setErr(v);
        write('vault-list', mail.trim().toLowerCase());
        write('promo-seen', true);
        setOk(true);
        window.dispatchEvent(new Event('vaultx:list'));
      }}
    >
      <label htmlFor={fid} className="signal__label mono">{label}</label>
      <div className="signal__row">
        <span className="signal__prompt mono" aria-hidden="true">&gt;</span>
        <input
          id={fid}
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={120}
          placeholder="name@domain.com"
          value={ok ? read<string>('vault-list', '') : mail}
          readOnly={ok}
          aria-invalid={!!err}
          aria-describedby={`${fid}-st`}
          onChange={(e) => { setMail(e.target.value); setErr(''); }}
        />
        <button type="submit" className="signal__go" disabled={ok}>
          <span>{ok ? 'Done' : cta}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <span className="signal__rule" aria-hidden="true" />
      </div>
      <p id={`${fid}-st`} className="signal__status mono" role={err ? 'alert' : 'status'}>
        <span className="signal__dot" aria-hidden="true" />{status}
      </p>
    </form>
  );
}
