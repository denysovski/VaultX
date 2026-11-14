import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  /** shown on the right inside the field, e.g. card brand */
  adornment?: ReactNode;
  textarea?: boolean;
  rows?: number;
}

/**
 * Text field with a floating label. The error is announced and linked to the
 * input with aria-describedby; it only appears after the user leaves the field
 * or submits (the parent decides by passing `error`).
 */
export function Field({ label, value, onChange, error, hint, adornment, textarea, rows = 4, className, id, ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const hintId = `${fid}-hint`;
  const errId = `${fid}-err`;
  const describedBy = [hint ? hintId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined;
  const common = {
    id: fid,
    value,
    placeholder: ' ',
    'aria-invalid': !!error || undefined,
    'aria-describedby': describedBy,
    className: 'field__input',
  };
  return (
    <div className={`field${error ? ' field--error' : ''}${textarea ? ' field--area' : ''} ${className ?? ''}`}>
      <div className="field__box">
        {textarea ? (
          <textarea {...common} rows={rows} maxLength={rest.maxLength ?? 2000} name={rest.name} required={rest.required} onBlur={rest.onBlur as never} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...rest} {...common} onChange={(e) => onChange(e.target.value)} />
        )}
        <label htmlFor={fid} className="field__label">
          {label}
          {rest.required ? '' : <span className="field__opt"> optional</span>}
        </label>
        {adornment && <span className="field__adorn">{adornment}</span>}
      </div>
      {hint && !error && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface Option {
  value: string;
  label: string;
}

/** Custom select: a button that opens a listbox. Arrow keys, Home/End, type-ahead, Enter, Escape. */
export function Select({ label, value, options, onChange, error, required }: { label: string; value: string; options: Option[]; onChange: (v: string) => void; error?: string; required?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ s: '', t: 0 });
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const close = (e: MouseEvent) => {
      if (!btn.current?.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    // keep the highlighted option visible inside the list (only while it is open)
    const l = list.current;
    const o = l?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!open || !l || !o) return;
    if (o.offsetTop < l.scrollTop) l.scrollTop = o.offsetTop;
    else if (o.offsetTop + o.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = o.offsetTop + o.offsetHeight - l.clientHeight;
  }, [active, open]);

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    btn.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') btn.current?.focus(); }
    else if (e.key.length === 1) {
      const now = Date.now();
      typed.current.s = now - typed.current.t > 600 ? e.key : typed.current.s + e.key;
      typed.current.t = now;
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.s.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div className={`field select${open ? ' select--open' : ''}${error ? ' field--error' : ''}`}>
      <span id={`${id}-l`} className="select__label">
        {label}
      </span>
      <button
        ref={btn}
        type="button"
        id={id}
        className="select__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-l ${id}`}
        aria-required={required}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
        }}
      >
        <span>{current?.label ?? 'Choose'}</span>
        <span className="select__chev" aria-hidden="true" />
      </button>
      <ul
        ref={list}
        className="select__list"
        role="listbox"
        tabIndex={-1}
        aria-labelledby={`${id}-l`}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onKeyDown={onKey}
      >
        {options.map((o, i) => (
          <li
            key={o.value}
            id={`${id}-o${i}`}
            data-i={i}
            role="option"
            aria-selected={o.value === value}
            className={`select__opt${i === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => choose(i)}
          >
            {o.label}
          </li>
        ))}
      </ul>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}

/** Radio cards: real radio inputs underneath, so arrow keys and screen readers work as usual. */
export function RadioCards<T extends string>({ legend, name, value, onChange, options }: { legend: string; name: string; value: T; onChange: (v: T) => void; options: { value: T; title: ReactNode; detail?: ReactNode; aside?: ReactNode; disabled?: boolean }[] }) {
  return (
    <fieldset className="radios">
      <legend className="radios__legend">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={`radio${value === o.value ? ' is-checked' : ''}${o.disabled ? ' is-disabled' : ''}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
          <span className="radio__dot" aria-hidden="true" />
          <span className="radio__body">
            <span className="radio__title">{o.title}</span>
            {o.detail && <span className="radio__detail">{o.detail}</span>}
          </span>
          {o.aside && <span className="radio__aside mono tnum">{o.aside}</span>}
        </label>
      ))}
    </fieldset>
  );
}

export function Check({ label, checked, onChange, error }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  const id = useId();
  return (
    <div className={`check${error ? ' field--error' : ''}`}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error || undefined} />
      <label htmlFor={id}>
        <span className="check__box" aria-hidden="true" />
        <span>{label}</span>
      </label>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 5, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        −
      </button>
      <output className="tnum" aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

/** Submit button with a busy state that keeps its width. */
export function Button({ children, busy, variant = 'solid', className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; variant?: 'solid' | 'ghost' | 'light' }) {
  return (
    <button {...rest} className={`btn btn--${variant}${busy ? ' is-busy' : ''} ${className}`} aria-busy={busy || undefined} disabled={rest.disabled || busy}>
      <span className="btn__label">{children}</span>
      {busy && <span className="btn__spin" aria-hidden="true" />}
    </button>
  );
}
