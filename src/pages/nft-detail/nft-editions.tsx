import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { FavoriteButton } from "@/components/common/favorite-button";
import { PriceDisplay } from "@/components/common/price-display";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { Button } from "@/components/ui/button";
import { useChangeCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { readApiError } from "@/services/auth";
import type { NftEdition } from "@/types/api";

import { boundedQuantity } from "./quantity";

export function NFTEditionPanel({
  editions,
  nftId,
  name,
}: {
  editions: NftEdition[];
  nftId: string;
  name: string;
}) {
  const [selection, setSelection] = useState<{
    editionId?: string;
    requested: number;
  }>({ requested: 1 });
  const edition =
    editions.find(({ id }) => id === selection.editionId) ??
    editions.find(({ available }) => available > 0) ??
    editions[0];
  const session = useSession();
  const add = useChangeCart(session.data?.user.id ?? "visitor");
  const navigate = useNavigate();
  const errorMessage =
    readApiError(add.error)?.message ??
    (add.isError
      ? "Não foi possível adicionar ao carrinho. Tente novamente."
      : undefined);
  const available = edition?.available ?? 0;
  const quantity = boundedQuantity(selection.requested, available);

  return (
    <div className="mt-6 grid min-w-0 gap-5 border-t border-border pt-5">
      {edition ? (
        <>
          <div className="text-2xl">
            <PriceDisplay amount={edition.price} />
          </div>
          <label className="grid max-w-sm gap-2 text-sm font-semibold">
            Edição
            <select
              value={edition.id}
              onChange={(event) => {
                add.reset();
                setSelection({
                  editionId: event.currentTarget.value,
                  requested: 1,
                });
              }}
              className="min-w-0 font-normal"
            >
              {editions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.available === 0 ? " — esgotada" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector
              value={quantity}
              max={available}
              disabled={quantity === 0}
              onChange={(next) => {
                if (Number.isSafeInteger(next))
                  setSelection({
                    editionId: edition.id,
                    requested: boundedQuantity(next, available),
                  });
              }}
            />
            <p
              role="status"
              className={
                quantity === 0
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {quantity === 0
                ? "Edição indisponível."
                : available === 1
                  ? "1 unidade disponível"
                  : `${available} unidades disponíveis`}
              {quantity > 0 && selection.requested > available
                ? " A quantidade foi limitada ao estoque atual."
                : null}
            </p>
          </div>
        </>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Este NFT não tem edições disponíveis.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          disabled={
            !edition || !quantity || session.data === undefined || add.isPending
          }
          onClick={() => {
            if (!edition || !quantity) return;
            add.mutate(
              { type: "add", item: { nftId, editionId: edition.id, quantity } },
              {
                onSuccess: () => void navigate({ to: "/cart" }),
              },
            );
          }}
        >
          {add.isPending ? "Adicionando…" : "Adicionar ao carrinho"}
        </Button>
        <FavoriteButton nftId={nftId} name={name} />
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2">
            {errorMessage}
          </p>
        )}
        {session.data === undefined && session.isError && (
          <Button variant="outline" onClick={() => void session.refetch()}>
            Tentar verificar a sessão novamente
          </Button>
        )}
      </div>
    </div>
  );
}
