import { z } from "zod";

import { walletNetworks, type OrderInput } from "@/types/api";

const attemptSchema = z.object({
  key: z.string().uuid(),
  orderId: z.string().optional(),
  input: z.object({
    quoteId: z.string(),
    walletId: z.string(),
    network: z.enum(walletNetworks),
    collector: z.object({ name: z.string(), email: z.string() }),
  }),
});

export type OrderAttempt = { key: string; orderId?: string; input: OrderInput };
const storageKey = (userId: string) => `kurio.checkout.attempt.v1:${userId}`;

export function loadAttempt(userId: string): OrderAttempt | null {
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    return raw ? (attemptSchema.safeParse(JSON.parse(raw)).data ?? null) : null;
  } catch {
    return null;
  }
}

export function persistAttempt(userId: string, attempt: OrderAttempt | null) {
  try {
    if (attempt)
      sessionStorage.setItem(storageKey(userId), JSON.stringify(attempt));
    else sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Retain the in-flight attempt in the mounted checkout.
  }
}
