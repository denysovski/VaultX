// Demo accounts stored in localStorage.
// This is a front-end only shop, so there is no server to keep accounts on.
// Passwords are never stored in plain text: they are hashed with PBKDF2
// (SHA-256, 210 000 iterations, random 16-byte salt) through the Web Crypto API.
// Still: localStorage is readable by any script on the origin, so this is a
// simulation, not a substitute for a real auth backend.
import { read, write, remove } from './storage';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  /** how this account can sign in */
  methods: ('password' | 'google')[];
}

interface StoredUser extends User {
  salt: string;
  hash: string;
  googleSub?: string;
}

interface Session {
  userId: string;
  expires: number;
}

const ITERATIONS = 210_000;
const SESSION_DAYS = 7;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));

async function hash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

/** Constant-time comparison so timing does not reveal how much of a hash matched. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const users = () =>
  read<StoredUser[]>('users', [])
    .filter((u) => u && typeof u.id === 'string' && typeof u.email === 'string')
    .map((u) => ({ ...u, methods: u.methods ?? ['password'] }));
const publicUser = ({ salt: _s, hash: _h, googleSub: _g, ...u }: StoredUser): User => u;

export async function register(name: string, email: string, password: string): Promise<User> {
  const list = users();
  const mail = email.trim().toLowerCase();
  if (list.some((u) => u.email === mail)) throw new Error('An account with this email already exists. Sign in instead.');
  if (password.length > 128) throw new Error('Password is too long.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: mail,
    createdAt: new Date().toISOString(),
    methods: ['password'],
    salt: toHex(salt),
    hash: await hash(password, salt),
  };
  write('users', [...list, user]);
  startSession(user.id);
  return publicUser(user);
}

export async function login(email: string, password: string): Promise<User> {
  const mail = email.trim().toLowerCase();
  const user = users().find((u) => u.email === mail);
  // Hash even when the user does not exist, so both paths take the same time.
  const hasPassword = !!user && user.methods.includes('password') && !!user.salt;
  const candidate = await hash(password.slice(0, 128), hasPassword ? fromHex(user!.salt) : new Uint8Array(16));
  if (!user || !hasPassword || !same(candidate, user.hash)) throw new Error('Email or password is incorrect.');
  startSession(user.id);
  return publicUser(user);
}

/**
 * Opens or creates the local account for a Google profile that has already
 * been verified (signature, audience, expiry, nonce: see google.ts).
 * An existing password account with the same verified email is linked.
 */
export function googleSignIn(g: { sub: string; email: string; name: string }): User {
  const list = users();
  let user = list.find((u) => u.googleSub === g.sub) ?? list.find((u) => u.email === g.email);
  if (user) {
    if (user.googleSub && user.googleSub !== g.sub) throw new Error('This email is linked to a different Google account.');
    user.googleSub = g.sub;
    if (!user.methods.includes('google')) user.methods = [...user.methods, 'google'];
  } else {
    user = { id: crypto.randomUUID(), name: g.name, email: g.email, createdAt: new Date().toISOString(), methods: ['google'], salt: '', hash: '', googleSub: g.sub };
    list.push(user);
  }
  write('users', list);
  startSession(user.id);
  return publicUser(user);
}

function startSession(userId: string) {
  write('session', { userId, expires: Date.now() + SESSION_DAYS * 864e5 } satisfies Session);
}

export function currentUser(): User | null {
  const s = read<Session | null>('session', null);
  if (!s || typeof s.expires !== 'number' || s.expires < Date.now()) {
    if (s) remove('session');
    return null;
  }
  const u = users().find((x) => x.id === s.userId);
  return u ? publicUser(u) : null;
}

export function sessionExpired() {
  const s = read<Session | null>('session', null);
  return !!s && s.expires < Date.now();
}

export function logout() {
  remove('session');
}
