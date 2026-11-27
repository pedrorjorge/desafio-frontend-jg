import { Link } from "@tanstack/react-router";

import { AuthEntry } from "@/components/auth/auth-entry";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";
import { useCart, useChangeCart, useQuote } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { readApiError } from "@/services/auth";

import { CartItemList } from "./cart-item-list";
import { CouponInput } from "./coupon-input";
import { OrderSummary, OrderSummarySkeleton } from "./order-summary";

const cartColumns = "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]";

function CartSkeleton() {
  return (
    <div className={cartColumns}>
      <div role="status" className="grid gap-3">
        <span className="sr-only">Carregando itens do carrinho…</span>
        <LoadingSkeleton
          announce={false}
          className="h-32 rounded-panel lg:h-[5.75rem]"
        />
        <LoadingSkeleton
          announce={false}
          className="h-32 rounded-panel lg:h-[5.75rem]"
        />
      </div>
      <OrderSummarySkeleton />
    </div>
  );
}

function CartContents({ owner }: { owner: string }) {
  const cart = useCart(owner);
  const data = cart.data;
  const change = useChangeCart(owner);
  const version = data?.items.length ? data.version : undefined;
  const quotation = useQuote(owner, version);
  const quote =
    quotation.data?.version === version ? quotation.data : undefined;
  const quoteError =
    readApiError(quotation.error)?.message ??
    (quotation.isError
      ? "Não foi possível atualizar a cotação. Tente novamente."
      : undefined);
  const changeError =
    readApiError(change.error)?.message ??
    (change.isError
      ? "Não foi possível alterar o carrinho. Confira sua conexão."
      : undefined);

  const couponError =
    change.variables?.type === "apply-coupon" && !!data?.items.length
      ? changeError
      : undefined;

  async function refresh() {
    const refreshed = await cart.refetch();
    if (
      !refreshed.isError &&
      version !== undefined &&
      refreshed.data?.version === version
    )
      await quotation.refetch();
  }

  if (cart.isPending) return <CartSkeleton />;
  if (!data)
    return (
      <ErrorState
        heading="h2"
        title="Não foi possível consultar o carrinho"
        onRetry={() => void cart.refetch()}
      />
    );

  const hasLines = data.items.length > 0;
  const busy =
    change.isPending ||
    cart.isFetching ||
    quotation.isFetching ||
    quotation.isPending;
  const canCheckout = !!quote && !busy && !cart.isError && !quotation.isError;

  return (
    <>
      {data.mergeConflicts.length > 0 && (
        <div
          role="status"
          className="mb-5 rounded-panel border border-input bg-card p-4 text-sm"
        >
          <p className="font-semibold">
            O estoque limitou a mesclagem dos seus carrinhos.
          </p>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            {data.mergeConflicts.map((conflict) => (
              <li key={`${conflict.nftId}~${conflict.editionId}`}>
                <Link
                  to="/nfts/$nftId"
                  params={{ nftId: conflict.nftId }}
                  className="text-primary underline"
                >
                  {conflict.nftName}
                </Link>
                {": "}
                {conflict.accepted} de {conflict.requested} unidades mantidas (
                {conflict.editionName}).
              </li>
            ))}
          </ul>
        </div>
      )}
      {cart.isRefetchError && (
        <div className="mb-5">
          <ErrorState
            heading="h2"
            title="Não foi possível atualizar o carrinho"
            onRetry={() => void refresh()}
          />
        </div>
      )}
      {changeError && !couponError && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {changeError}
        </p>
      )}
      {hasLines ? (
        <div className={cartColumns}>
          <CartItemList
            items={data.items}
            busy={change.isPending}
            onQuantity={(itemId, quantity) =>
              change.mutate({ type: "quantity", itemId, quantity })
            }
            onRemove={(itemId) => change.mutate({ type: "remove", itemId })}
          />
          <OrderSummary
            quote={quote}
            pending={busy}
            error={quoteError}
            onRefresh={() => void refresh()}
            checkout={
              canCheckout ? (
                <AuthEntry
                  privateTo="/checkout"
                  className="inline-flex min-h-control items-center justify-center rounded-control bg-primary px-4 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Continuar para o pagamento
                </AuthEntry>
              ) : (
                <Button disabled>Continuar para o pagamento</Button>
              )
            }
          >
            <CouponInput
              code={data.couponCode}
              error={couponError}
              busy={change.isPending}
              onApply={(code) => change.mutate({ type: "apply-coupon", code })}
              onRemove={() => change.mutate({ type: "remove-coupon" })}
            />
          </OrderSummary>
        </div>
      ) : (
        <EmptyState heading="h2" title="Seu carrinho está vazio">
          <Link to="/" hash="catalogo" className="w-fit text-primary underline">
            Explorar o catálogo
          </Link>
        </EmptyState>
      )}
    </>
  );
}

export function CartPage() {
  const session = useSession();
  const owner = session.data?.user.id ?? "visitor";

  return (
    <>
      <Link
        to="/"
        hash="catalogo"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-primary"
      >
        <span aria-hidden="true">← </span>Continuar explorando
      </Link>
      <h1 className="mb-5 font-display text-3xl font-bold">Carrinho de NFTs</h1>
      {session.isPending ? (
        <CartSkeleton />
      ) : session.data === undefined ? (
        <ErrorState
          heading="h2"
          title="Não foi possível verificar a sessão do carrinho"
          onRetry={() => void session.refetch()}
        />
      ) : (
        <CartContents key={owner} owner={owner} />
      )}
    </>
  );
}
