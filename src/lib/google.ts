// Sign in with Google (Google Identity Services), front end only.
//
// Google returns a signed ID token (a JWT). Because there is no server, the
// browser verifies it itself before trusting anything inside it:
//   1. RS256 signature checked with Google's published public keys (JWKS)
//   2. issuer is accounts.google.com
//   3. audience is exactly this site's client ID
//   4. not expired, not issued in the future
//   5. nonce matches the one-time value this tab generated (no replays)
//   6. email is verified by Google
// Only then is a local account created or opened. The token itself is never
// stored; the account keeps Google's stable user id (sub), name and email.

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
export const googleEnabled = !!CLIENT_ID && /^[\w-]+\.apps\.googleusercontent\.com$/.test(CLIENT_ID);

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const NONCE_KEY = 'vaultx:g-nonce';

interface GoogleId {
  initialize(cfg: Record<string, unknown>): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
  cancel(): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

let gsiPromise: Promise<void> | null = null;
export function loadGsi() {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error('Google sign-in could not load. Check your connection or blockers.'));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

const b64urlBytes = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

export function newNonce() {
  const n = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(NONCE_KEY, n);
  return n;
}

let jwks: { keys: (JsonWebKey & { kid: string })[] } | null = null;
async function keyFor(kid: string) {
  if (!jwks || !jwks.keys.some((k) => k.kid === kid)) {
    const r = await fetch(JWKS_URL, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('Could not reach Google to verify the sign-in.');
    jwks = await r.json();
  }
  const jwk = jwks!.keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error('Unknown signing key.');
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

export async function verifyIdToken(jwt: string): Promise<GoogleProfile> {
  if (!googleEnabled || !CLIENT_ID) throw new Error('Google sign-in is not available.');
  const parts = jwt.split('.');
  if (parts.length !== 3 || jwt.length > 8192) throw new Error('Malformed sign-in response.');
  const header = b64urlJson(parts[0]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Unexpected token type.');

  const key = await keyFor(header.kid);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!ok) throw new Error('The sign-in signature is not valid.');

  const p = b64urlJson(parts[1]);
  const now = Date.now() / 1000;
  const expected = sessionStorage.getItem(NONCE_KEY);
  sessionStorage.removeItem(NONCE_KEY); // one use only
  if (!ISSUERS.includes(p.iss)) throw new Error('Wrong issuer.');
  if (p.aud !== CLIENT_ID) throw new Error('This sign-in was meant for another site.');
  if (typeof p.exp !== 'number' || p.exp < now - 60) throw new Error('The sign-in expired. Try again.');
  if (typeof p.iat !== 'number' || p.iat > now + 300) throw new Error('The sign-in has an invalid date.');
  if (!expected || p.nonce !== expected) throw new Error('The sign-in could not be matched to this page. Try again.');
  if (p.email_verified !== true || typeof p.email !== 'string') throw new Error('Your Google email is not verified.');
  if (typeof p.sub !== 'string' || !/^\d{5,40}$/.test(p.sub)) throw new Error('Unexpected account id.');

  return { sub: p.sub, email: p.email.toLowerCase().slice(0, 254), name: String(p.name ?? p.email.split('@')[0]).replace(/[<>]/g, '').slice(0, 80) };
}

export function initGoogle(onCredential: (jwt: string) => void) {
  window.google!.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (r: { credential?: string }) => r.credential && onCredential(r.credential),
    nonce: newNonce(),
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin',
    ux_mode: 'popup',
    use_fedcm_for_button: true,
    itp_support: true,
  });
}
