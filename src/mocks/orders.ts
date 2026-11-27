import type { Quote, Receipt } from "@/types/api";

import { cartFor, editionFor, itemId } from "./cart";
import {
  now,
  observeDatabase,
  readDatabase,
  transaction,
  type Database,
} from "./database";

export function updateStock(
  db: Database,
  items: Quote["items"],
  direction: 1 | -1,
) {
  for (const item of items) {
    const { nft, edition } = editionFor(db, item.nftId, item.editionId);
    edition.available += item.quantity * direction;
    nft.version += 1;
  }
}

export function resolveOrders(db: Database) {
  for (const entry of db.orders) {
    const { order, quote, userId } = entry;
    if (order.status !== "pending" || entry.readyAt > now(db)) continue;

    order.status = entry.outcome;
    order.version += 1;
    if (entry.outcome === "declined") {
      updateStock(db, quote.items, 1);
      continue;
    }

    const cart = cartFor(db, userId);
    for (const purchased of quote.items) {
      const item = cart.items.find(
        (candidate) => itemId(candidate) === purchased.id,
      );
      if (item) item.quantity = Math.max(0, item.quantity - purchased.quantity);
    }
    cart.items = cart.items.filter(({ quantity }) => quantity > 0);

    const receipt: Receipt = {
      orderId: order.id,
      items: quote.items,
      couponCode: quote.couponCode,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      collector: entry.input.collector,
      wallet: entry.wallet,
      network: entry.input.network,
      transactionId: `mock-${order.id}`,
      explorerUrl: `https://explorer.example.test/tx/mock-${order.id}`,
      confirmedAt: new Date(entry.readyAt).toISOString(),
    };
    order.receipt = receipt;
  }
}

export function startOrderSettlement() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function schedule(db: Database) {
    clearTimeout(timer);
    const earliest = Math.min(
      ...db.orders
        .filter(({ order }) => order.status === "pending")
        .map(({ readyAt }) => readyAt),
    );

    if (Number.isFinite(earliest)) {
      timer = setTimeout(
        () => void transaction(resolveOrders),
        Math.max(0, earliest - now(db)),
      );
    }
  }

  observeDatabase((_, after) => schedule(after));
  schedule(readDatabase());
}
