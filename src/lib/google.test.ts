// Verifies the ID-token checks in google.ts with a locally generated RSA key
// standing in for Google's. Run: npm test
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const CLIENT = '1234567890-abc.apps.googleusercontent.com';
let keys: CryptoKeyPair;
let jwk: JsonWebKey;
let mod: typeof import('./google');

const b64url = (b: Uint8Array | string) =>
  Buffer.from(typeof b === 'string' ? b : b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function token(claims: Record<string, unknown>, kid = 'test-key', key = keys.privateKey) {
  const head = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const body = b64url(JSON.stringify(claims));
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

const now = () => Math.floor(Date.now() / 1000);
const good = (nonce: string) => ({ iss: 'https://accounts.google.com', aud: CLIENT, sub: '109876543210987654321', email: 'Jana@Example.cz', email_verified: true, name: 'Jana', iat: now(), exp: now() + 3600, nonce });

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ keys: [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] })));
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', CLIENT);
  mod = await import('./google');
});

let nonce = '';
beforeEach(() => {
  nonce = mod.newNonce();
});

describe('verifyIdToken', () => {
  it('accepts a valid token and normalises the profile', async () => {
    const p = await mod.verifyIdToken(await token(good(nonce)));
    expect(p).toEqual({ sub: '109876543210987654321', email: 'jana@example.cz', name: 'Jana' });
  });
  it('rejects a tampered payload', async () => {
    const t = (await token(good(nonce))).split('.');
    t[1] = b64url(JSON.stringify({ ...good(nonce), email: 'attacker@evil.test' }));
    await expect(mod.verifyIdToken(t.join('.'))).rejects.toThrow(/signature/);
  });
  it('rejects a token signed by another key', async () => {
    const other = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    await expect(mod.verifyIdToken(await token(good(nonce), 'test-key', other.privateKey))).rejects.toThrow(/signature/);
  });
  it('rejects another audience', async () => {
    await expect(mod.verifyIdToken(await token({ ...good(nonce), aud: 'other.apps.googleusercontent.com' }))).rejects.toThrow(/another site/);
  });
  it('rejects another issuer', async () => {
    await expect(mod.verifyIdToken(await token({ ...good(nonce), iss: 'https://evil.test' }))).rejects.toThrow(/issuer/);
  });
  it('rejects an expired token', async () => {
    await expect(mod.verifyIdToken(await token({ ...good(nonce), exp: now() - 3600 }))).rejects.toThrow(/expired/);
  });
  it('rejects a wrong or replayed nonce', async () => {
    await expect(mod.verifyIdToken(await token(good('not-the-nonce')))).rejects.toThrow(/matched/);
    const t = await token(good(nonce));
    nonce = mod.newNonce();
    const t2 = await token(good(nonce));
    await mod.verifyIdToken(t2);
    await expect(mod.verifyIdToken(t2)).rejects.toThrow(/matched/); // nonce is single use
    await expect(mod.verifyIdToken(t)).rejects.toThrow(/matched/);
  });
  it('rejects an unverified email', async () => {
    await expect(mod.verifyIdToken(await token({ ...good(nonce), email_verified: false }))).rejects.toThrow(/verified/);
  });
  it('rejects alg none and malformed tokens', async () => {
    const head = b64url(JSON.stringify({ alg: 'none', kid: 'test-key' }));
    await expect(mod.verifyIdToken(`${head}.${b64url(JSON.stringify(good(nonce)))}.`)).rejects.toThrow(/token type/);
    await expect(mod.verifyIdToken('a.b')).rejects.toThrow(/Malformed/);
  });
});
