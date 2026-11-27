import { queryOptions, useQuery } from "@tanstack/react-query";

import { preserveTerminalOrder } from "@/lib/live-versions";
import { retryNftRead } from "@/lib/nft-query-policy";
import { privateQueryKey, privateSessionSignal } from "@/lib/session";
import type { AccountScope } from "@/services/account";
import { fetchOrder, fetchPendingOrder } from "@/services/orders";

export const orderPrefix = (userId: string) => privateQueryKey(userId, "order");
export const orderKey = (userId: string, orderId: string) => [
  ...orderPrefix(userId),
  orderId,
];

export function orderOptions(scope: AccountScope, orderId: string) {
  return queryOptions({
    queryKey: orderKey(scope.userId, orderId),
    queryFn: ({ signal }) => fetchOrder(scope, orderId, signal),
    refetchInterval: ({ state }) =>
      state.data?.status === "pending" ? 5000 : false,
    retry: retryNftRead,
    structuralSharing: preserveTerminalOrder,
  });
}

export function useOrder(userId: string, orderId: string) {
  return useQuery(
    orderOptions({ userId, lifetime: privateSessionSignal() }, orderId),
  );
}

export const pendingOrderKey = (userId: string) => [
  ...orderPrefix(userId),
  "pending",
];

export function usePendingOrder(userId: string) {
  const scope = { userId, lifetime: privateSessionSignal() };
  return useQuery({
    queryKey: pendingOrderKey(userId),
    queryFn: ({ signal }) => fetchPendingOrder(scope, signal),
    retry: retryNftRead,
  });
}
