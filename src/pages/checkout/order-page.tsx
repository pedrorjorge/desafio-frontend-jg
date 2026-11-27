import { Link } from "@tanstack/react-router";

import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { PriceDisplay } from "@/components/common/price-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";

export function OrderStatusPage({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) {
  const query = useOrder(userId, orderId);
  const order = query.data;
  if (query.isPending)
    return (
      <LoadingSkeleton
        label="Consultando pedido…"
        className="mx-auto h-52 max-w-xl"
      />
    );
  if (!order)
    return (
      <ErrorState
        title="Não foi possível consultar o pedido"
        onRetry={() => void query.refetch()}
      />
    );
  const receipt = order.status === "confirmed" ? order.receipt : null;

  return (
    <Card className="mx-auto min-w-0 max-w-xl gap-4 border-b-2 border-b-primary p-5 sm:p-6">
      <h1
        aria-live="polite"
        aria-atomic="true"
        className="font-display text-2xl font-bold"
      >
        {receipt
          ? "Pedido confirmado"
          : order.status === "declined"
            ? "Pedido recusado"
            : "Pedido pendente"}
      </h1>
      <p className="text-sm text-muted-foreground">Pedido {order.id}</p>
      {receipt ? (
        <>
          <p>Transação simulada: {receipt.transactionId}</p>
          <ul
            className="grid gap-2 divide-y divide-border border-y border-border py-2"
            aria-label="Itens comprados"
          >
            {receipt.items.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center gap-3 py-2"
              >
                {item.image && (
                  <img
                    src={item.image.src}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-control object-cover"
                  />
                )}
                <span className="min-w-0">
                  {item.name} · {item.editionName} × {item.quantity}
                </span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t border-border pt-3">
            {(
              [
                ["Subtotal", receipt.subtotal],
                ["Desconto", receipt.discount],
                ["Taxa de rede", receipt.networkFee],
                ["Total", receipt.total],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex min-w-0 justify-between gap-3">
                <dt>{label}</dt>
                <dd className="min-w-0 text-right">
                  <PriceDisplay amount={value} />
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : order.status === "declined" ? (
        <p role="status">
          O pagamento simulado foi recusado. Seus itens continuam no carrinho.
        </p>
      ) : (
        <>
          <p role="status">Aguardando o resultado do pagamento simulado.</p>
          {query.isRefetchError && (
            <p role="alert">
              Não foi possível verificar uma atualização do pedido.
            </p>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Consultar status
          </Button>
        </>
      )}
      <Link to="/cart" className="w-fit text-primary underline">
        Voltar ao carrinho
      </Link>
    </Card>
  );
}
