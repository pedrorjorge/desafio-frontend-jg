import Decimal from "decimal.js";

import type { Cart, CartItemInput, QuoteTotals } from "@/types/api";

import { type Database, type StoredCart } from "./database";
import { reject } from "./handlers/shared";

const Money = Decimal.clone({ precision: 80 });
const networkFee = "0.001";
const money = (value: Decimal) =>
  value.toDecimalPlaces(18, Decimal.ROUND_HALF_UP).toFixed();

export function cartFor(db: Database, owner: string): StoredCart {
  return (db.carts[owner] ??= { items: [], couponCode: null });
}

export function editionFor(db: Database, nftId: string, editionId: string) {
  const nft = db.nfts.find(({ id }) => id === nftId);
  const edition = nft?.editions.find(({ id }) => id === editionId);
  if (!nft || !edition)
    reject(404, "NOT_FOUND", "NFT ou edição não encontrado.");
  return { nft, edition };
}

export function itemId({ nftId, editionId }: CartItemInput) {
  return `${nftId}~${editionId}`;
}

export function mergeVisitorCart(
  db: Database,
  visitorId: string,
  userId: string,
) {
  const visitor = db.carts[visitorId];
  if (!visitor) return;

  const cart = cartFor(db, userId);
  const conflicts: NonNullable<StoredCart["mergeConflicts"]> = [];
  for (const incoming of visitor.items) {
    const { nftId, editionId } = incoming;
    const nft = db.nfts.find(({ id }) => id === nftId);
    const edition = nft?.editions.find(({ id }) => id === editionId);
    const available = edition?.available ?? 0;
    const existing = cart.items.find(
      (item) => itemId(item) === itemId(incoming),
    );
    const requested = incoming.quantity + (existing?.quantity ?? 0);
    const accepted = Math.min(requested, available);
    if (accepted < requested)
      conflicts.push({
        nftId,
        nftName: nft?.name ?? nftId,
        editionId,
        editionName: edition?.name ?? editionId,
        requested,
        accepted,
      });
    if (existing) existing.quantity = accepted;
    else if (accepted > 0) cart.items.push({ ...incoming, quantity: accepted });
  }

  cart.items = cart.items.filter(({ quantity }) => quantity > 0);
  cart.couponCode ??= visitor.couponCode;
  if (visitor.items.length) cart.mergeConflicts = conflicts;
  delete db.carts[visitorId];
}

export function presentCart(db: Database, cart: StoredCart): Cart {
  const items = cart.items.map((item) => {
    const { nft, edition } = editionFor(db, item.nftId, item.editionId);
    item.addedPrice ??= edition.price;
    return {
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
      id: itemId(item),
      name: nft.name,
      image: nft.image,
      editionName: edition.name,
      price: edition.price,
      lineTotal: money(new Money(edition.price).times(item.quantity)),
      priceChanged: !new Money(edition.price).equals(item.addedPrice),
      available: edition.available,
    };
  });

  const signature = JSON.stringify({
    items: items.map(({ id, quantity, price, available }) => [
      id,
      quantity,
      price,
      available,
    ]),
    couponCode: cart.couponCode,
  });
  if (cart.revision?.signature !== signature) {
    // Use the same persisted counter as the other simulated resources.
    cart.revision = { signature, version: db.nextId++ };
  }

  return {
    version: cart.revision.version,
    items,
    couponCode: cart.couponCode,
    mergeConflicts: cart.mergeConflicts ?? [],
  };
}

export function calculateQuote(
  items: Cart["items"],
  percent: number,
): QuoteTotals {
  const subtotal = items.reduce(
    (total, item) => total.plus(new Money(item.price).times(item.quantity)),
    new Money(0),
  );
  const discount = subtotal
    .times(percent)
    .div(100)
    .toDecimalPlaces(18, Decimal.ROUND_HALF_UP);
  const fee = items.length ? networkFee : "0";
  return {
    subtotal: money(subtotal),
    discount: money(discount),
    networkFee: fee,
    total: money(subtotal.minus(discount).plus(fee)),
  };
}
