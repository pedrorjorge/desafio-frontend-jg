import type {
  CartItemInput,
  CartMergeConflict,
  EthAmount,
  Coupon,
  Nft,
  Order,
  OrderInput,
  Profile,
  Quote,
  Wallet,
} from "@/types/api";

import { createFixtures, mockEpoch } from "./fixtures";

export interface MockAccount {
  profile: Profile;
  salt: string;
  verifier: string;
  favorites: string[];
  wallets: Wallet[];
}

export interface StoredCart {
  items: (CartItemInput & { addedPrice?: EthAmount })[];
  couponCode: string | null;
  mergeConflicts?: CartMergeConflict[];
  revision?: { signature: string; version: number };
}

interface StoredQuote {
  userId: string;
  quote: Quote;
}

export interface StoredOrder {
  userId: string;
  key: string;
  fingerprint: string;
  order: Order;
  quote: Quote;
  wallet: Wallet;
  input: OrderInput;
  readyAt: number;
  outcome: "confirmed" | "declined";
}

export interface Database {
  wallStart: number;
  offsetMs: number;
  nextId: number;
  nfts: Nft[];
  users: MockAccount[];
  coupons: Coupon[];
  sessions: Record<string, { id?: string; userId: string; expiresAt: number }>;
  carts: Record<string, StoredCart>;
  quotes: StoredQuote[];
  orders: StoredOrder[];
}

const key = "kurio.mocks.database.v1";
const visitorKey = "kurio.mocks.visitor.v1";
let fallback = createFixtures();
let fallbackQueue: Promise<unknown> = Promise.resolve();
let visitorId: string | undefined;

type DatabaseListener = (before: Database, after: Database) => void;
const listeners = new Set<DatabaseListener>();

export function observeDatabase(listener: DatabaseListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVisitorId() {
  if (visitorId) return visitorId;

  try {
    const saved = sessionStorage.getItem(visitorKey);
    if (saved?.startsWith("visitor-")) return (visitorId = saved);
    visitorId = `visitor-${crypto.randomUUID()}`;
    sessionStorage.setItem(visitorKey, visitorId);
  } catch {
    visitorId ??= `visitor-${crypto.randomUUID()}`;
  }
  return visitorId;
}

export function readDatabase(): Database {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    const saved: Partial<Database> | null = JSON.parse(raw);
    if (
      saved &&
      Number.isFinite(saved.wallStart) &&
      Number.isFinite(saved.offsetMs) &&
      Number.isSafeInteger(saved.nextId) &&
      Array.isArray(saved.nfts) &&
      Array.isArray(saved.users) &&
      Array.isArray(saved.coupons) &&
      Array.isArray(saved.quotes) &&
      Array.isArray(saved.orders) &&
      saved.carts &&
      saved.sessions
    ) {
      return saved as Database;
    }
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
  return structuredClone(fallback);
}

function saveDatabase(db: Database) {
  fallback = db;
  try {
    localStorage.setItem(key, JSON.stringify(db));
  } catch {
    // Retain the current state in memory for this page.
  }
}

async function serialize<T>(operation: () => Promise<T>): Promise<T> {
  if (globalThis.navigator?.locks) {
    return await navigator.locks.request(key, operation);
  }

  const result = fallbackQueue.then(operation);
  fallbackQueue = result.catch(() => undefined);
  return result;
}

export function transaction<T>(
  operation: (db: Database) => T | Promise<T>,
): Promise<T> {
  return serialize(async () => {
    const db = readDatabase();
    const before = listeners.size ? structuredClone(db) : undefined;
    const result = await operation(db);
    saveDatabase(db);
    if (before)
      queueMicrotask(() => {
        for (const listener of listeners) listener(before, db);
      });
    return result;
  });
}

export function resetDatabase() {
  return serialize(async () => {
    const before = readDatabase();
    const after = createFixtures();
    saveDatabase(after);
    queueMicrotask(() => {
      for (const listener of listeners) listener(before, after);
    });
  });
}

export function now(db: Database) {
  return mockEpoch + Math.max(0, Date.now() - db.wallStart) + db.offsetMs;
}

export function nextId(db: Database, resource: string) {
  const id = `${resource}-${db.nextId}`;
  db.nextId += 1;
  return id;
}
