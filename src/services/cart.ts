import type { Cart, CartItemInput, Quote } from "@/types/api";

import { requestFor, type AccountScope } from "./account";
import { api } from "./api";

export type CartChange =
  | { type: "add"; item: CartItemInput }
  | { type: "quantity"; itemId: string; quantity: number }
  | { type: "remove"; itemId: string }
  | { type: "apply-coupon"; code: string }
  | { type: "remove-coupon" };

export async function fetchCart(scope: AccountScope, signal: AbortSignal) {
  const { data } = await api.get<Cart>("/cart", requestFor(scope, signal));
  return data;
}

export async function changeCart(scope: AccountScope, change: CartChange) {
  const config = requestFor(scope);
  switch (change.type) {
    case "add":
      return (await api.post<Cart>("/cart/items", change.item, config)).data;
    case "quantity":
      return (
        await api.patch<Cart>(
          `/cart/items/${encodeURIComponent(change.itemId)}`,
          { quantity: change.quantity },
          config,
        )
      ).data;
    case "remove":
      return (
        await api.delete<Cart>(
          `/cart/items/${encodeURIComponent(change.itemId)}`,
          config,
        )
      ).data;
    case "apply-coupon":
      return (
        await api.put<Cart>("/cart/coupon", { code: change.code }, config)
      ).data;
    case "remove-coupon":
      return (await api.delete<Cart>("/cart/coupon", config)).data;
  }
}

export async function fetchQuote(
  scope: AccountScope,
  version: number,
  signal: AbortSignal,
) {
  const config = requestFor(scope, signal);
  const { data } = await api.post<Quote>("/quotes", undefined, {
    ...config,
    headers: { ...config.headers, "X-Kurio-Cart-Version": String(version) },
  });
  return data;
}
