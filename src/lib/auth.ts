// Accounts and sessions stored in the browser (no server).
//
// - Passwords are hashed with PBKDF2 (SHA-256, 210 000 rounds, random salt).
//   The password itself is never saved.
// - "Remember me" keeps the session in localStorage for 30 days.
//   Without it the session lives in sessionStorage and ends when the browser closes.
// - Any session also ends after 2 hours without activity.
// - After 5 wrong passwords the account is locked for 5 minutes.
import { read, write, remove } from './storage';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StoredUser extends User {
  salt: string;
  hash: string;
}

interface Session {
  token: string;
  userId: string;
  expires: number;
  lastSeen: number;
  remember: boolean;
}

const ITERATIONS = 210_000;
const REMEMBER_DAYS = 30;
const SHORT_HOURS = 12;
const IDLE_MS = 2 * 60 * 60 * 1000;
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

const toHex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));

async function hash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

/** Constant-time comparison, so timing does not reveal how much of a hash matched. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const users = () => read<StoredUser[]>('users', []).filter((u) => u && typeof u.id === 'string' && typeof u.hash === 'string' && u.hash.length === 64);
const publicUser = ({ salt: _s, hash: _h, ...u }: StoredUser): User => u;

export async function register(name: string, email: string, password: string, remember: boolean): Promise<User> {
  const list = users();
  const mail = email.trim().toLowerCase();
  if (list.some((u) => u.email === mail)) throw new Error('An account with this email already exists. Sign in instead.');
  if (password.length > 128) throw new Error('Password is too long.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: mail, createdAt: new Date().toISOString(), salt: toHex(salt), hash: await hash(password, salt) };
  write('users', [...list, user]);
  startSession(user.id, remember);
  return publicUser(user);
}

export async function login(email: string, password: string, remember: boolean): Promise<User> {
  const mail = email.trim().toLowerCase();
  const tries = read<Record<string, { n: number; until: number }>>('login-tries', {});
  const t = tries[mail];
  if (t && t.until > Date.now()) throw new Error(`Too many attempts. Try again in ${Math.ceil((t.until - Date.now()) / 60000)} min.`);

  const user = users().find((u) => u.email === mail);
  // Hash even when the email is unknown, so both cases take the same time.
  const candidate = await hash(password.slice(0, 128), user ? fromHex(user.salt) : new Uint8Array(16));
  if (!user || !same(candidate, user.hash)) {
    const n = (t && !t.until ? t.n : 0) + 1; // a finished lock starts the count again
    tries[mail] = n >= MAX_TRIES ? { n: 0, until: Date.now() + LOCK_MS } : { n, until: 0 };
    write('login-tries', tries);
    throw new Error(n >= MAX_TRIES ? 'Too many attempts. The account is locked for 5 minutes.' : 'Email or password is incorrect.');
  }
  delete tries[mail];
  write('login-tries', tries);
  startSession(user.id, remember);
  return publicUser(user);
}

export async function changePassword(userId: string, current: string, next: string) {
  const list = users();
  const user = list.find((u) => u.id === userId);
  if (!user) throw new Error('Account not found.');
  if (!same(await hash(current.slice(0, 128), fromHex(user.salt)), user.hash)) throw new Error('Current password is incorrect.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  user.salt = toHex(salt);
  user.hash = await hash(next, salt);
  write('users', list);
  // a new session token, so any copy of the old one stops working
  startSession(userId, getSession()?.remember ?? false);
}

function startSession(userId: string, remember: boolean) {
  logout();
  const token = toHex(crypto.getRandomValues(new Uint8Array(24)));
  const now = Date.now();
  const s: Session = { token, userId, remember, lastSeen: now, expires: now + (remember ? REMEMBER_DAYS * 864e5 : SHORT_HOURS * 36e5) };
  write('session', s, remember ? 'local' : 'session');
}

export function getSession(): Session | null {
  return read<Session | null>('session', null, 'session') ?? read<Session | null>('session', null, 'local');
}

/** Returns the signed-in user, ending the session if it expired or sat idle too long. */
export function currentUser(): User | null {
  const s = getSession();
  if (!s) return null;
  const now = Date.now();
  if (typeof s.expires !== 'number' || s.expires < now || now - s.lastSeen > IDLE_MS) {
    logout();
    write('session-ended', true, 'session');
    return null;
  }
  const u = users().find((x) => x.id === s.userId);
  if (!u) {
    logout();
    return null;
  }
  write('session', { ...s, lastSeen: now }, s.remember ? 'local' : 'session');
  return publicUser(u);
}

/** True once, right after a session ended on its own (expired or idle). */
export function sessionEnded() {
  const v = read('session-ended', false, 'session');
  remove('session-ended', 'session');
  return v;
}

export function logout() {
  remove('session', 'local');
  remove('session', 'session');
}
