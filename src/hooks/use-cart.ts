import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { keepNewestVersion } from "@/lib/live-versions";
import { privateQueryKey, privateSessionSignal } from "@/lib/session";
import type { AccountScope } from "@/services/account";
import {
  changeCart,
  fetchCart,
  fetchQuote,
  type CartChange,
} from "@/services/cart";

export const cartKey = (owner: string) => privateQueryKey(owner, "cart");
export const quotePrefix = (owner: string) => privateQueryKey(owner, "quote");

export function cartOptions(scope: AccountScope) {
  return queryOptions({
    queryKey: cartKey(scope.userId),
    queryFn: ({ signal }) => fetchCart(scope, signal),
    retry: false,
    refetchInterval: 15_000,
    structuralSharing: keepNewestVersion,
  });
}

export function quoteOptions(scope: AccountScope, version: number | undefined) {
  return queryOptions({
    queryKey: [...quotePrefix(scope.userId), version],
    queryFn: ({ signal }) => {
      if (version === undefined)
        throw new Error("O carrinho não tem uma versão para cotar.");
      return fetchQuote(scope, version, signal);
    },
    enabled: version !== undefined,
    retry: false,
    staleTime: 60_000,
    refetchInterval: (query) =>
      query.state.data && query.state.status !== "error"
        ? Math.max(
            1000,
            query.state.dataUpdatedAt +
              query.state.data.expiresInMs -
              Date.now(),
          )
        : false,
  });
}

export function useCart(owner: string) {
  return useQuery(
    cartOptions({ userId: owner, lifetime: privateSessionSignal() }),
  );
}

export function useQuote(owner: string, version?: number) {
  return useQuery(
    quoteOptions({ userId: owner, lifetime: privateSessionSignal() }, version),
  );
}

export function useChangeCart(owner: string) {
  const client = useQueryClient();
  const scope = { userId: owner, lifetime: privateSessionSignal() };

  return useMutation({
    mutationKey: privateQueryKey(owner, "change-cart"),
    scope: { id: `cart:${owner}` },
    mutationFn: (change: CartChange) => changeCart(scope, change),
    onSuccess: async (cart) => {
      if (scope.lifetime.aborted) return;
      // A fresh GET started before the mutation may still describe the old cart.
      await client.cancelQueries({ queryKey: cartKey(owner), exact: true });
      if (scope.lifetime.aborted) return;
      client.setQueryData(cartKey(owner), cart);
    },
    onError: (error) => {
      if (
        !scope.lifetime.aborted &&
        isAxiosError(error) &&
        error.response?.status === 409
      ) {
        return client.invalidateQueries({
          queryKey: cartKey(owner),
          exact: true,
        });
      }
    },
  });
}
