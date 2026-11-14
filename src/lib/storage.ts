// Small, defensive wrapper around localStorage / sessionStorage.
// Storage can be missing (SSR prerender), full, or blocked (private mode),
// so every call is guarded and values are validated by the caller.

const PREFIX = 'vaultx:';

function store(kind: 'local' | 'session'): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function read<T>(key: string, fallback: T, kind: 'local' | 'session' = 'local'): T {
  const s = store(kind);
  if (!s) return fallback;
  try {
    const raw = s.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown, kind: 'local' | 'session' = 'local') {
  const s = store(kind);
  if (!s) return;
  try {
    s.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode: the app keeps working in memory */
  }
}

export function remove(key: string, kind: 'local' | 'session' = 'local') {
  try {
    store(kind)?.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
