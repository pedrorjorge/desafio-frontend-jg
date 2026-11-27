import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useRef, useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallets } from "@/hooks/use-account";
import { cartKey, quotePrefix, useCart, useQuote } from "@/hooks/use-cart";
import { orderKey, orderPrefix, usePendingOrder } from "@/hooks/use-order";
import { privateQueryKey, privateSessionSignal } from "@/lib/session";
import { readApiError } from "@/services/auth";
import { connectWallet, submitOrder } from "@/services/orders";
import { walletNetworks, type Session, type WalletNetwork } from "@/types/api";

import { OrderSummary } from "../cart/order-summary";
import {
  loadAttempt,
  persistAttempt,
  type OrderAttempt,
} from "./order-attempt";

export function CheckoutPage({ session }: { session: Session }) {
  const owner = session.user.id;
  const client = useQueryClient();
  const navigate = useNavigate();
  const lifetime = privateSessionSignal();
  const cart = useCart(owner);
  const version = cart.data?.items.length ? cart.data.version : undefined;
  const query = useQuote(owner, version);
  const quote = query.data?.version === version ? query.data : undefined;
  const wallets = useWallets(owner);
  const openOrder = usePendingOrder(owner);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [network, setNetwork] = useState<WalletNetwork>("ethereum");
  const [reviewed, setReviewed] = useState<string>();
  const [attempt, setAttempt] = useState(() => loadAttempt(owner));
  const locked = useRef(false);
  const wallet =
    wallets.data?.find(({ id }) => id === selectedWallet) ?? wallets.data?.[0];
  const connection = useMutation({
    mutationKey: privateQueryKey(owner, "connect-wallet"),
    mutationFn: ({
      walletId,
      network,
    }: {
      walletId: string;
      network: WalletNetwork;
    }) => connectWallet({ userId: owner, lifetime }, walletId, network),
  });
  const connected =
    connection.isSuccess &&
    connection.variables.walletId === wallet?.id &&
    connection.variables.network === network;
  const problem = readApiError(query.error)?.message;
  const pending = cart.isFetching || query.isFetching || query.isPending;
  const reviewChanged =
    reviewed !== undefined && quote !== undefined && reviewed !== quote.id;
  const current =
    !!quote &&
    !pending &&
    !query.isError &&
    !cart.isError &&
    openOrder.isSuccess &&
    !openOrder.data;
  const order = useMutation({
    mutationKey: privateQueryKey(owner, "submit-order"),
    mutationFn: (value: OrderAttempt) =>
      submitOrder({ userId: owner, lifetime }, value.input, value.key),
  });

  async function refresh() {
    const result = await cart.refetch();
    if (
      !result.isError &&
      version !== undefined &&
      result.data?.version === version
    )
      await query.refetch();
  }

  async function send() {
    if (locked.current || lifetime.aborted) return;
    let next = attempt;
    if (!next) {
      const cartState = client.getQueryState(cartKey(owner));
      if (
        !current ||
        !quote ||
        reviewed !== quote.id ||
        !wallet ||
        !connected ||
        client.getQueryState([...quotePrefix(owner), quote.version])
          ?.isInvalidated ||
        cartState?.isInvalidated ||
        cartState?.fetchStatus !== "idle"
      )
        return;
      next = {
        key: crypto.randomUUID(),
        input: {
          quoteId: quote.id,
          walletId: wallet.id,
          network,
          collector: { name: session.user.name, email: session.user.email },
        },
      };
      setAttempt(next);
      persistAttempt(owner, next);
    }

    locked.current = true;
    try {
      const id = next.orderId ?? (await order.mutateAsync(next)).id;
      if (lifetime.aborted) return;
      persistAttempt(owner, { ...next, orderId: id });
      setAttempt({ ...next, orderId: id });
      void client.invalidateQueries({ queryKey: orderKey(owner, id) });
      await navigate({
        to: "/orders/$orderId",
        params: { orderId: id },
        replace: true,
      });
      persistAttempt(owner, null);
    } catch (error) {
      if (lifetime.aborted) return;
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (
        status === 422 ||
        readApiError(error)?.code === "STALE_QUOTE" ||
        readApiError(error)?.code === "STOCK_CONFLICT"
      ) {
        setAttempt(null);
        persistAttempt(owner, null);
        setReviewed(undefined);
        await Promise.all([
          client.invalidateQueries({ queryKey: orderPrefix(owner) }),
          client.invalidateQueries({
            queryKey: quotePrefix(owner),
            refetchType: "none",
          }),
        ]);
        await refresh();
      }
    } finally {
      locked.current = false;
    }
  }

  const sendError =
    readApiError(order.error)?.message ??
    (order.isError
      ? "Não foi possível obter a resposta do pedido. Retome a mesma tentativa."
      : undefined);

  return (
    <>
      <Link
        to="/cart"
        className="mb-4 inline-block text-sm text-primary underline"
      >
        Voltar ao carrinho
      </Link>
      <h1 className="mb-5 font-display text-3xl font-bold">Pagamento</h1>
      {cart.isPending && !attempt ? (
        <LoadingSkeleton label="Carregando o checkout…" className="h-56" />
      ) : cart.isError && !cart.data && !attempt ? (
        <ErrorState
          heading="h2"
          title="Não foi possível consultar o carrinho"
          onRetry={() => void refresh()}
        />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <Card className="min-w-0 gap-4 p-5">
            <h2 className="font-display text-xl font-bold">
              Dados do colecionador
            </h2>
            <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Nome</dt>
                <dd>{session.user.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd>{session.user.email}</dd>
              </div>
            </dl>
            {attempt ? (
              <p role="status" className="text-muted-foreground">
                Há uma tentativa de pedido aguardando resposta. Retome para
                consultar o resultado da mesma tentativa.
              </p>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-semibold">
                  Carteira fictícia
                  <select
                    value={wallet?.id ?? ""}
                    disabled={connection.isPending}
                    onChange={(event) => {
                      connection.reset();
                      setSelectedWallet(event.currentTarget.value);
                      setReviewed(undefined);
                    }}
                  >
                    {!wallet && (
                      <option value="">Nenhuma carteira disponível</option>
                    )}
                    {wallets.data?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {wallets.isError ? (
                  <Button
                    variant="outline"
                    onClick={() => void wallets.refetch()}
                  >
                    Consultar carteiras novamente
                  </Button>
                ) : (
                  !wallet && (
                    <Link
                      to="/account/wallets"
                      className="text-primary underline"
                    >
                      Cadastrar carteira
                    </Link>
                  )
                )}
                <label className="grid gap-2 text-sm font-semibold">
                  Rede fictícia
                  <select
                    value={network}
                    disabled={connection.isPending}
                    onChange={(event) => {
                      const next = walletNetworks.find(
                        (value) => value === event.currentTarget.value,
                      );
                      if (next) {
                        connection.reset();
                        setNetwork(next);
                        setReviewed(undefined);
                      }
                    }}
                  >
                    {walletNetworks.map((value) => (
                      <option key={value} value={value}>
                        {value === "ethereum" ? "Ethereum" : "Polygon"}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {!attempt && wallet && (
              <div className="grid justify-items-start gap-2">
                <p role="status" className="text-sm text-muted-foreground">
                  {connected
                    ? "Carteira fictícia conectada."
                    : "Carteira fictícia desconectada."}
                </p>
                <Button
                  variant="outline"
                  disabled={connection.isPending || wallets.isError}
                  onClick={() => {
                    setReviewed(undefined);
                    if (connected) connection.reset();
                    else connection.mutate({ walletId: wallet.id, network });
                  }}
                >
                  {connected
                    ? "Desconectar carteira"
                    : connection.isPending
                      ? "Conectando…"
                      : "Conectar carteira"}
                </Button>
                {connection.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {readApiError(connection.error)?.message ??
                      "Não foi possível conectar a carteira. Tente novamente."}
                  </p>
                )}
              </div>
            )}
            {openOrder.data && !attempt && (
              <Link
                to="/orders/$orderId"
                params={{ orderId: openOrder.data.id }}
                className="text-primary underline"
              >
                Acompanhar pedido pendente
              </Link>
            )}
            {openOrder.isError && !attempt && (
              <Button
                variant="outline"
                onClick={() => void openOrder.refetch()}
              >
                Verificar pedidos novamente
              </Button>
            )}
            <p
              role="status"
              aria-atomic="true"
              className={reviewChanged ? "text-sm text-primary" : "sr-only"}
            >
              {reviewChanged
                ? "A cotação foi atualizada. Revise os valores novamente antes de enviar."
                : ""}
            </p>
            {cart.data?.items.some(
              ({ priceChanged, quantity, available }) =>
                priceChanged || quantity > available,
            ) && (
              <p role="status" className="text-muted-foreground">
                O preço ou o estoque de pelo menos uma edição mudou. Confira os
                valores e ajuste o carrinho se necessário.
              </p>
            )}
            {sendError && (
              <p role="alert" className="text-sm text-destructive">
                {sendError}
              </p>
            )}
            {attempt ? (
              <Button disabled={order.isPending} onClick={() => void send()}>
                {order.isPending ? "Recuperando…" : "Retomar pedido"}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!quote || !current || !connected}
                  onClick={() => setReviewed(quote?.id)}
                >
                  Confirmar valores da cotação
                </Button>
                <Button
                  disabled={!current || !connected || reviewed !== quote?.id}
                  onClick={() => void send()}
                >
                  Enviar pedido
                </Button>
              </div>
            )}
          </Card>
          <OrderSummary
            quote={quote}
            pending={version !== undefined && pending}
            error={
              version === undefined
                ? "O carrinho está vazio."
                : (problem ??
                  (query.isError
                    ? "Não foi possível consultar a cotação."
                    : undefined))
            }
            onRefresh={() => void refresh()}
          >
            {!!cart.data?.items.length && (
              <ul aria-label="Itens do pedido" className="grid gap-2 text-sm">
                {cart.data.items.map((item) => (
                  <li key={item.id} className="flex min-w-0 items-center gap-2">
                    <img
                      src={item.image.src}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-control object-cover"
                    />
                    <span className="min-w-0">
                      {item.name} · {item.editionName} × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </OrderSummary>
        </div>
      )}
    </>
  );
}
