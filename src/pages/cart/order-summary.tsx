import type { ReactNode } from "react";

import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { PriceDisplay } from "@/components/common/price-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Quote } from "@/types/api";

function SummaryValuesSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-2">
      {["w-20", "w-24", "w-16", "w-12"].map((width, index) => (
        <div
          key={width}
          className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 ${index === 3 ? "mt-2 border-t border-border pt-2" : ""}`}
        >
          <LoadingSkeleton
            announce={false}
            className={`h-5 max-w-full ${width}`}
          />
          <LoadingSkeleton
            announce={false}
            className="h-5 w-20 max-w-full justify-self-end"
          />
        </div>
      ))}
    </div>
  );
}

export function OrderSummarySkeleton() {
  return (
    <Card className="min-w-0 gap-4 p-5" role="status">
      <span className="sr-only">Carregando resumo do carrinho…</span>
      <LoadingSkeleton announce={false} className="h-7 w-40 max-w-full" />
      <LoadingSkeleton announce={false} className="h-11" />
      <div className="border-y border-border py-3">
        <SummaryValuesSkeleton />
      </div>
      <LoadingSkeleton announce={false} className="h-11" />
    </Card>
  );
}

export function OrderSummary({
  quote,
  pending,
  error,
  onRefresh,
  children,
  checkout,
}: {
  quote?: Quote;
  pending: boolean;
  error?: string;
  onRefresh: () => void;
  children?: ReactNode;
  checkout?: ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-4 p-5">
      <h2 className="border-b border-border pb-3 font-display text-xl font-bold">
        Resumo do carrinho
      </h2>
      {children}
      <div className="min-h-36 border-y border-border py-3">
        <p role="status" className="mb-2 min-h-4 text-xs text-muted-foreground">
          {pending ? "Atualizando cotação…" : ""}
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : quote ? (
          <dl className="grid gap-2 text-sm">
            {(
              [
                ["Subtotal", quote.subtotal],
                ["Desconto", quote.discount],
                ["Taxa de rede", quote.networkFee],
                ["Total", quote.total],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className={`flex min-w-0 justify-between gap-3 ${label === "Total" ? "mt-2 border-t border-border pt-2 font-semibold" : ""}`}
              >
                <dt>{label}</dt>
                <dd className="min-w-0 text-right">
                  <PriceDisplay amount={value} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <SummaryValuesSkeleton />
        )}
      </div>
      {checkout}
      <Button variant="outline" disabled={pending} onClick={onRefresh}>
        Atualizar cotação
      </Button>
    </Card>
  );
}
