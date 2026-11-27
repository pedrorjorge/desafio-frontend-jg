import { acceptOrderSnapshot } from "@/lib/live-versions";
import type { Order, OrderInput, WalletNetwork } from "@/types/api";

import { requestFor, type AccountScope } from "./account";
import { api } from "./api";

export async function fetchOrder(
  scope: AccountScope,
  orderId: string,
  signal: AbortSignal,
) {
  const { data } = await api.get<Order>(
    `/orders/${encodeURIComponent(orderId)}`,
    requestFor(scope, signal),
  );
  signal.throwIfAborted();
  acceptOrderSnapshot(scope.lifetime, data);
  return data;
}

export async function submitOrder(
  scope: AccountScope,
  input: OrderInput,
  key: string,
) {
  const config = requestFor(scope);
  const { data } = await api.post<Order>("/orders", input, {
    ...config,
    headers: { ...config.headers, "Idempotency-Key": key },
  });
  return data;
}

export async function fetchPendingOrder(
  scope: AccountScope,
  signal: AbortSignal,
) {
  const { data } = await api.get<Order | null>(
    "/orders/pending",
    requestFor(scope, signal),
  );
  signal.throwIfAborted();
  if (data) acceptOrderSnapshot(scope.lifetime, data);
  return data;
}

export async function connectWallet(
  scope: AccountScope,
  walletId: string,
  network: WalletNetwork,
) {
  await api.post(
    "/checkout/wallet-connection",
    { walletId, network },
    requestFor(scope),
  );
}
