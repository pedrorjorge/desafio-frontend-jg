import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { cartKey, quotePrefix } from "@/hooks/use-cart";
import { orderKey, orderPrefix, pendingOrderKey } from "@/hooks/use-order";
import type { Cart, NftDetail, RealtimeEvents, Session } from "@/types/api";

import { observeNftVersion, observeOrderVersion } from "./live-versions";

export function connectReconciliation(
  client: QueryClient,
  lifetime: AbortSignal,
  session: Session | null,
  orderLifetime = lifetime,
) {
  const owner = session?.user.id ?? "visitor";
  const pricing = cartKey(owner);
  const quotes = quotePrefix(owner);

  async function refresh(keys: QueryKey[]) {
    if (lifetime.aborted) return;
    await Promise.all(
      keys.map((queryKey) => client.cancelQueries({ queryKey })),
    );
    if (lifetime.aborted) return;
    // Reprice from the latest cart snapshot before any quote with an older key can be used.
    await Promise.all(
      keys.map((queryKey) => client.invalidateQueries({ queryKey })),
    );
  }

  async function reprice() {
    if (lifetime.aborted) return;
    await client.cancelQueries({ queryKey: quotes });
    await client.invalidateQueries({ queryKey: quotes, refetchType: "none" });
    await refresh([pricing]);
    if (lifetime.aborted) return;
    const cart = client.getQueryData<Cart>(pricing);
    if (cart?.items.length) {
      await client.refetchQueries({
        queryKey: [...quotes, cart.version],
        exact: true,
        type: "active",
      });
    }
  }

  return {
    reconcile() {
      void refresh([["nfts"], ...(session ? [orderPrefix(owner)] : [])]);
      void reprice();
    },
    onNft(event: RealtimeEvents["nft.updated"]) {
      if (
        lifetime.aborted ||
        !event?.id ||
        event.resource?.id !== event.resourceId ||
        event.resource.version !== event.version ||
        !observeNftVersion(event.resourceId, event.version)
      )
        return;
      const key = ["nfts", "detail", event.resourceId];
      // Cancel before applying a patch so a reverting cancelled query cannot erase it.
      void client.cancelQueries({ queryKey: key, exact: true }).then(() => {
        if (lifetime.aborted) return;
        client.setQueryData<NftDetail>(key, (current) =>
          current && current.version < event.version
            ? { ...current, ...event.resource }
            : current,
        );
        return refresh([key]);
      });
      void refresh([["nfts", "catalog"]]);
      void reprice();
    },
    onOrder(event: RealtimeEvents["order.updated"]) {
      if (
        lifetime.aborted ||
        !session ||
        !event?.id ||
        event.session?.userId !== owner ||
        event.session?.sessionId !== session.id ||
        event.resource?.id !== event.resourceId ||
        event.resource.version !== event.version ||
        !observeOrderVersion(orderLifetime, event.resourceId, event.version)
      )
        return;
      void refresh([orderKey(owner, event.resourceId), pendingOrderKey(owner)]);
      void reprice();
    },
  };
}
