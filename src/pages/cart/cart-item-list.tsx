import type { CartItem as Item } from "@/types/api";

import { CartItem } from "./cart-item";

export function CartItemList({
  items,
  busy,
  onQuantity,
  onRemove,
}: {
  items: Item[];
  busy: boolean;
  onQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div
        aria-hidden="true"
        className="mb-2 hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_4.5rem] gap-3 border-b border-border px-3 pb-2 text-sm text-muted-foreground lg:grid"
      >
        <span>NFTs</span>
        <span>Preço</span>
        <span>Quantidade</span>
        <span>Total</span>
        <span />
      </div>
      <ul aria-label="NFTs no carrinho" className="grid gap-3">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            busy={busy}
            onQuantity={(quantity) => onQuantity(item.id, quantity)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </ul>
    </div>
  );
}
