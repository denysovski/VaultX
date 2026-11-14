// Field validators. Each returns an error message in plain words, or '' when valid.

export const clean = (v: string, max = 200) => v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, max);

export const required = (label: string) => (v: string) => (v.trim() ? '' : `Enter your ${label}`);

export function email(v: string) {
  const s = v.trim();
  if (!s) return 'Enter your email address';
  if (s.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s)) return 'Enter an email like name@domain.com';
  return '';
}

export function name(v: string) {
  const s = v.trim();
  if (!s) return 'Enter your full name';
  if (s.length < 2) return 'Name looks too short';
  if (!/^[\p{L}\p{M}' .-]+$/u.test(s)) return 'Use letters, spaces, hyphens or apostrophes only';
  return '';
}

export function phone(v: string, optional = true) {
  const s = v.replace(/[\s()-]/g, '');
  if (!s) return optional ? '' : 'Enter a phone number';
  if (!/^\+?\d{7,15}$/.test(s)) return 'Use digits only, with an optional + and country code';
  return '';
}

export const POSTCODE: Record<string, { re: RegExp; hint: string }> = {
  CZ: { re: /^\d{3}\s?\d{2}$/, hint: '110 00' },
  SK: { re: /^\d{3}\s?\d{2}$/, hint: '811 01' },
  DE: { re: /^\d{5}$/, hint: '10115' },
  AT: { re: /^\d{4}$/, hint: '1010' },
  PL: { re: /^\d{2}-\d{3}$/, hint: '00-001' },
  FR: { re: /^\d{5}$/, hint: '75001' },
  NL: { re: /^\d{4}\s?[A-Za-z]{2}$/, hint: '1011 AB' },
  GB: { re: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, hint: 'SW1A 1AA' },
  US: { re: /^\d{5}(-\d{4})?$/, hint: '10001' },
};

export function postcode(v: string, country: string) {
  const s = v.trim();
  if (!s) return 'Enter your postcode';
  const rule = POSTCODE[country];
  if (rule && !rule.re.test(s)) return `Postcode should look like ${rule.hint}`;
  return '';
}

export const digits = (v: string) => v.replace(/\D/g, '');

export function luhn(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return num.length > 0 && sum % 10 === 0;
}

export function cardBrand(num: string): 'Visa' | 'Mastercard' | 'Amex' | '' {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'Amex';
  return '';
}

export function formatCard(v: string) {
  const d = digits(v).slice(0, 19);
  if (cardBrand(d) === 'Amex') return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  return d.replace(/(.{4})/g, '$1 ').trim();
}

export function card(v: string) {
  const d = digits(v);
  if (!d) return 'Enter your card number';
  if (d.length < 13) return 'Card number is too short';
  if (!luhn(d)) return 'This card number is not valid. Check for typos';
  return '';
}

export function formatExpiry(v: string) {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

export function expiry(v: string, now = new Date()) {
  const d = digits(v);
  if (d.length !== 4) return 'Enter the expiry date as MM / YY';
  const m = Number(d.slice(0, 2));
  const y = 2000 + Number(d.slice(2));
  if (m < 1 || m > 12) return 'Month must be between 01 and 12';
  const end = new Date(y, m, 0, 23, 59, 59);
  if (end < now) return 'This card has expired';
  return '';
}

export function cvc(v: string, brand: string) {
  const d = digits(v);
  const len = brand === 'Amex' ? 4 : 3;
  if (d.length !== len) return `Enter the ${len}-digit security code`;
  return '';
}

export function password(v: string) {
  if (v.length < 10) return 'Use at least 10 characters';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Mix letters and at least one number';
  return '';
}

export function orderId(v: string) {
  return /^VX-\d{6}$/i.test(v.trim()) ? '' : 'Order numbers look like VX-123456';
}

/** Accepts only same-site paths, so ?next= cannot redirect to another domain. */
export function safeNext(v: string | null) {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return '/account';
  return v;
}
