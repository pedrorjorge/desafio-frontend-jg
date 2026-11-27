import { Link } from "@tanstack/react-router";

import { PriceDisplay } from "@/components/common/price-display";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { Button } from "@/components/ui/button";
import type { CartItem as Item } from "@/types/api";

export function CartItem({
  item,
  busy,
  onQuantity,
  onRemove,
}: {
  item: Item;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const shortStock = item.quantity > item.available;

  return (
    <li className="grid min-w-0 grid-cols-1 items-center min-[23rem]:grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-panel border border-border bg-card p-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.image.src}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-control object-cover"
        />
        <div className="min-w-0">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: item.nftId }}
            className="font-display font-bold wrap-break-word hover:text-primary"
          >
            {item.name}
          </Link>
          <p className="text-sm wrap-break-word text-muted-foreground">
            Edição {item.editionName}
          </p>
        </div>
      </div>
      <div className="col-start-1 min-w-0 text-sm lg:col-auto">
        <span className="text-muted-foreground lg:sr-only">
          Preço unitário{" "}
        </span>
        <PriceDisplay amount={item.price} />
        <p role="status" className="text-xs text-muted-foreground">
          {item.priceChanged ? "Preço alterado" : ""}
        </p>
      </div>
      <div className="min-w-0 min-[23rem]:col-start-2 min-[23rem]:row-span-2 min-[23rem]:row-start-1 lg:col-auto lg:row-auto">
        {shortStock ? (
          <div className="grid gap-2">
            <p className="text-xs text-destructive">
              {item.available
                ? `Disponíveis: ${item.available} de ${item.quantity}`
                : `${item.quantity} no carrinho · esgotado`}
            </p>
            {item.available > 0 && (
              <Button
                variant="outline"
                className="w-fit px-2"
                disabled={busy}
                onClick={() => onQuantity(item.available)}
              >
                Ajustar para {item.available}
              </Button>
            )}
          </div>
        ) : (
          <QuantitySelector
            value={item.quantity}
            max={item.available}
            disabled={busy}
            onChange={onQuantity}
          />
        )}
      </div>
      <div className="col-start-1 min-w-0 text-sm lg:col-auto">
        <span className="text-muted-foreground lg:sr-only">Total do item </span>
        <PriceDisplay amount={item.lineTotal} />
      </div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={onRemove}
        aria-label={`Remover ${item.name}, edição ${item.editionName}`}
        className="w-fit px-2"
      >
        Remover
      </Button>
    </li>
  );
}
