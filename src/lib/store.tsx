import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { read, write } from './storage';
import { currentUser, logout as doLogout, type User } from './auth';
import { getProduct, FREE_SHIPPING_FROM, type ShippingId } from '../data/products';

export interface BagLine {
  slug: string;
  colour: string;
  size: string;
  qty: number;
}

export interface Order {
  id: string;
  createdAt: string;
  email: string;
  userId?: string;
  lines: (BagLine & { name: string; price: number; colourName: string; image: string })[];
  shipping: { method: ShippingId; price: number; days: [number, number] };
  address: { name: string; street: string; city: string; postcode: string; country: string; phone: string };
  payment: { type: 'card'; brand: string; last4: string } | { type: 'transfer' };
  subtotal: number;
  discount: number;
  promo?: string;
  total: number;
}

export interface Ticket {
  id: string;
  createdAt: string;
  kind: 'delivery' | 'contact';
  topic: string;
  orderId?: string;
  email: string;
}

interface Toast {
  id: number;
  text: string;
  tone?: 'ok' | 'error';
}

interface Store {
  ready: boolean;
  bag: BagLine[];
  bagOpen: boolean;
  setBagOpen: (v: boolean) => void;
  add: (line: Omit<BagLine, 'qty'>, qty?: number) => void;
  setQty: (i: number, qty: number) => void;
  removeLine: (i: number) => void;
  clearBag: () => void;
  count: number;
  subtotal: number;
  freeShippingLeft: number;
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  orders: Order[];
  saveOrder: (o: Order) => void;
  tickets: Ticket[];
  saveTicket: (t: Ticket) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
}

const Ctx = createContext<Store | null>(null);

const MAX_QTY = 5;

const isLine = (l: unknown): l is BagLine =>
  !!l && typeof l === 'object' && typeof (l as BagLine).slug === 'string' && Number.isInteger((l as BagLine).qty);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Start empty on both server and client so prerendered HTML hydrates cleanly,
  // then load the saved state right after mount.
  const [ready, setReady] = useState(false);
  const [bag, setBag] = useState<BagLine[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const saved = read<unknown[]>('bag', []);
    setBag(Array.isArray(saved) ? saved.filter(isLine).filter((l) => getProduct(l.slug)) : []);
    setUser(currentUser());
    setOrders(read<Order[]>('orders', []));
    setTickets(read<Ticket[]>('tickets', []));
    setReady(true);
    // Keep tabs in sync: a bag change in one tab shows up in the others.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vaultx:bag') setBag(read<BagLine[]>('bag', []).filter(isLine));
      if (e.key === 'vaultx:session') setUser(currentUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (ready) write('bag', bag);
  }, [bag, ready]);

  const toast = useCallback((text: string, tone?: Toast['tone']) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const add = useCallback((line: Omit<BagLine, 'qty'>, qty = 1) => {
    setBag((b) => {
      const i = b.findIndex((l) => l.slug === line.slug && l.colour === line.colour && l.size === line.size);
      if (i === -1) return [...b, { ...line, qty: Math.min(qty, MAX_QTY) }];
      return b.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l));
    });
  }, []);

  const setQty = useCallback((i: number, qty: number) => {
    setBag((b) => b.map((l, j) => (j === i ? { ...l, qty: Math.max(1, Math.min(qty, MAX_QTY)) } : l)));
  }, []);

  const removeLine = useCallback((i: number) => setBag((b) => b.filter((_, j) => j !== i)), []);
  const clearBag = useCallback(() => setBag([]), []);

  const saveOrder = useCallback((o: Order) => {
    setOrders((prev) => {
      const next = [o, ...prev].slice(0, 50);
      write('orders', next);
      return next;
    });
  }, []);

  const saveTicket = useCallback((t: Ticket) => {
    setTickets((prev) => {
      const next = [t, ...prev].slice(0, 50);
      write('tickets', next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  const value = useMemo<Store>(() => {
    const count = bag.reduce((a, l) => a + l.qty, 0);
    const subtotal = bag.reduce((a, l) => a + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
    return {
      ready, bag, bagOpen, setBagOpen, add, setQty, removeLine, clearBag, count, subtotal,
      freeShippingLeft: Math.max(0, FREE_SHIPPING_FROM - subtotal),
      user, setUser, logout, orders, saveOrder, tickets, saveTicket, toasts, toast,
    };
  }, [ready, bag, bagOpen, add, setQty, removeLine, clearBag, user, logout, orders, saveOrder, tickets, saveTicket, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

/** Order status is simulated from the time since the order was placed. */
export function orderStatus(o: Order, now = Date.now()) {
  const mins = (now - new Date(o.createdAt).getTime()) / 60000;
  const steps = [
    { label: 'Order placed', at: 0 },
    { label: 'Packed in the vault', at: 2 },
    { label: 'Handed to the courier', at: 10 },
    { label: 'Out for delivery', at: 60 * 24 },
    { label: 'Delivered', at: 60 * 24 * o.shipping.days[0] },
  ];
  const current = steps.filter((s) => mins >= s.at).length - 1;
  return { steps, current };
}
