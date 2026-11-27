import { delay, http, HttpResponse } from "msw";
import { z } from "zod";

import { walletNetworks, type CartItemInput, type Quote } from "@/types/api";

import {
  calculateQuote,
  cartFor,
  editionFor,
  itemId,
  presentCart,
} from "../cart";
import {
  getVisitorId,
  nextId,
  now,
  transaction,
  type Database,
  type StoredCart,
  type StoredOrder,
} from "../database";
import { resolveOrders, updateStock } from "../orders";
import { currentScenario, scenarioGeneration } from "../scenarios";
import {
  account,
  body,
  empty,
  endpoint,
  id,
  name,
  email,
  quantity,
  reject,
  respond,
  sessionRecord,
} from "./shared";

const itemInput = z.object({ nftId: id, editionId: id, quantity });
const updateQuantity = z.object({ quantity });
const couponInput = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((code) => code.toUpperCase()),
});
const orderInput = z.object({
  quoteId: id,
  walletId: id,
  network: z.enum(walletNetworks),
  collector: z.object({ name, email }),
});
const quoteLifetime = 5 * 60 * 1000;

function cartOwner(db: Database, request: Request) {
  const expected = request.headers.get("X-Kurio-Account");
  if (expected && expected !== "visitor")
    return account(db, request).profile.id;
  const userId = sessionRecord(db)?.userId;
  if (expected === "visitor" && userId)
    reject(403, "FORBIDDEN", "A conta ativa mudou durante a operação.");
  return userId ?? getVisitorId();
}

function validateCoupon(db: Database, code: string) {
  const coupon = db.coupons.find((entry) => entry.code === code);
  if (!coupon?.active)
    reject(422, "INVALID_COUPON", "Cupom inválido.", {
      code: "Cupom inválido.",
    });
  if (Date.parse(coupon.expiresAt) <= now(db))
    reject(422, "EXPIRED_COUPON", "Cupom expirado.", {
      code: "Cupom expirado.",
    });
  return coupon;
}

function quoteContents(
  db: Database,
  cart: StoredCart,
): Omit<Quote, "id" | "expiresAt" | "expiresInMs"> {
  const { items, couponCode, version } = presentCart(db, cart);
  for (const item of items) {
    if (item.quantity > item.available)
      reject(
        409,
        "STOCK_CONFLICT",
        "A quantidade excede o estoque disponível.",
      );
  }
  const percent = couponCode
    ? validateCoupon(db, couponCode).discountPercent
    : 0;
  return { items, couponCode, version, ...calculateQuote(items, percent) };
}

function withOrders<T>(work: (db: Database) => T): Promise<T> {
  return transaction((db) => {
    resolveOrders(db);
    return work(db);
  });
}

function ensureStock(db: Database, input: CartItemInput) {
  if (
    input.quantity >
    editionFor(db, input.nftId, input.editionId).edition.available
  ) {
    reject(409, "STOCK_CONFLICT", "A quantidade excede o estoque disponível.", {
      quantity: "Quantidade indisponível.",
    });
  }
}

export const commerceHandlers = [
  http.post(endpoint("/checkout/wallet-connection"), ({ request }) =>
    respond(request, "wallet-connection", async () => {
      const input = await body(
        z.object({ walletId: id, network: z.enum(walletNetworks) }),
        request,
      );
      return transaction((db) => {
        const user = account(db, request);
        if (!user.wallets.some(({ id }) => id === input.walletId))
          reject(403, "FORBIDDEN", "Carteira indisponível para esta conta.");
        if (currentScenario() === "wallet-declined")
          reject(409, "CONFLICT", "Conexão da carteira recusada na simulação.");
        return empty();
      });
    }),
  ),
  http.get(endpoint("/cart"), ({ request }) =>
    respond(request, "cart", () =>
      withOrders((db) =>
        HttpResponse.json(presentCart(db, cartFor(db, cartOwner(db, request)))),
      ),
    ),
  ),
  http.post(endpoint("/cart/items"), ({ request }) =>
    respond(request, "cart", async () => {
      const input = await body(itemInput, request);
      return withOrders((db) => {
        const cart = cartFor(db, cartOwner(db, request));
        const item = cart.items.find(
          (entry) => itemId(entry) === itemId(input),
        );
        const total = {
          ...input,
          quantity: input.quantity + (item?.quantity ?? 0),
        };
        ensureStock(db, total);
        if (item) item.quantity = total.quantity;
        else
          cart.items.push({
            ...total,
            addedPrice: editionFor(db, input.nftId, input.editionId).edition
              .price,
          });
        return HttpResponse.json(presentCart(db, cart), {
          status: item ? 200 : 201,
        });
      });
    }),
  ),
  http.patch(endpoint("/cart/items/:itemId"), ({ request, params }) =>
    respond(request, "cart", async () => {
      const input = await body(updateQuantity, request);
      return withOrders((db) => {
        const cart = cartFor(db, cartOwner(db, request));
        const item = cart.items.find(
          (entry) => itemId(entry) === params.itemId,
        );
        if (!item) reject(404, "NOT_FOUND", "Item não encontrado no carrinho.");
        ensureStock(db, { ...item, ...input });
        item.quantity = input.quantity;
        return HttpResponse.json(presentCart(db, cart));
      });
    }),
  ),
  http.delete(endpoint("/cart/items/:itemId"), ({ request, params }) =>
    respond(request, "cart", () =>
      withOrders((db) => {
        const cart = cartFor(db, cartOwner(db, request));
        cart.items = cart.items.filter(
          (entry) => itemId(entry) !== params.itemId,
        );
        return HttpResponse.json(presentCart(db, cart));
      }),
    ),
  ),
  http.put(endpoint("/cart/coupon"), ({ request }) =>
    respond(request, "coupon", async () => {
      const { code } = await body(couponInput, request);
      return withOrders((db) => {
        const cart = cartFor(db, cartOwner(db, request));
        validateCoupon(db, code);
        cart.couponCode = code;
        return HttpResponse.json(presentCart(db, cart));
      });
    }),
  ),
  http.delete(endpoint("/cart/coupon"), ({ request }) =>
    respond(request, "coupon", () =>
      withOrders((db) => {
        const cart = cartFor(db, cartOwner(db, request));
        cart.couponCode = null;
        return HttpResponse.json(presentCart(db, cart));
      }),
    ),
  ),
  http.post(endpoint("/quotes"), ({ request }) =>
    respond(request, "quote", () =>
      withOrders((db) => {
        const owner = cartOwner(db, request);
        const cart = cartFor(db, owner);
        const requested = request.headers.get("X-Kurio-Cart-Version");
        if (
          requested !== null &&
          requested !== String(presentCart(db, cart).version)
        ) {
          reject(
            409,
            "STALE_QUOTE",
            "O carrinho mudou. Atualize os itens e consulte outra cotação.",
          );
        }
        const contents = quoteContents(db, cart);
        const quote = {
          id: nextId(db, "quote"),
          expiresAt: new Date(now(db) + quoteLifetime).toISOString(),
          expiresInMs: quoteLifetime,
          ...contents,
        };
        db.quotes = db.quotes.filter(
          ({ quote }) => Date.parse(quote.expiresAt) > now(db),
        );
        db.quotes.push({ userId: owner, quote });
        return HttpResponse.json(quote, { status: 201 });
      }),
    ),
  ),
  http.post(endpoint("/orders"), ({ request }) =>
    respond(request, "orders", async () => {
      const generation = scenarioGeneration();
      const input = await body(orderInput, request);
      const key = request.headers.get("Idempotency-Key")?.trim();
      if (!key || key.length > 120)
        reject(
          400,
          "VALIDATION_ERROR",
          "Informe Idempotency-Key com até 120 caracteres.",
        );
      const fingerprint = JSON.stringify(input);

      const result = await withOrders((db) => {
        const user = account(db, request);
        const userId = user.profile.id;
        const existing = db.orders.find(
          (entry) => entry.userId === userId && entry.key === key,
        );
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            reject(
              409,
              "IDEMPOTENCY_CONFLICT",
              "A chave já identifica uma tentativa diferente.",
            );
          return { order: existing.order, created: false };
        }

        if (
          db.orders.some(
            (entry) =>
              entry.userId === userId && entry.order.status === "pending",
          )
        ) {
          reject(409, "CONFLICT", "Existe um pedido pendente nesta conta.");
        }
        const wallet = user.wallets.find(({ id }) => id === input.walletId);
        if (!wallet)
          reject(403, "FORBIDDEN", "Selecione uma carteira da conta.");
        const quote = db.quotes.find(
          (entry) =>
            entry.userId === userId && entry.quote.id === input.quoteId,
        )?.quote;
        if (!quote || Date.parse(quote.expiresAt) <= now(db))
          reject(409, "STALE_QUOTE", "Gere e revise uma nova cotação.");
        const current = quoteContents(db, cartFor(db, userId));
        const previous = {
          items: quote.items,
          couponCode: quote.couponCode,
          version: quote.version,
          subtotal: quote.subtotal,
          discount: quote.discount,
          networkFee: quote.networkFee,
          total: quote.total,
        };
        if (JSON.stringify(current) !== JSON.stringify(previous)) {
          reject(
            409,
            "STALE_QUOTE",
            "Os valores mudaram. Gere e revise uma nova cotação.",
          );
        }
        if (!quote.items.length)
          reject(422, "VALIDATION_ERROR", "O carrinho está vazio.");

        const timestamp = now(db);
        const entry: StoredOrder = {
          userId,
          key,
          fingerprint,
          input,
          wallet: structuredClone(wallet),
          quote,
          readyAt: timestamp + 1500,
          outcome:
            currentScenario() === "order-declined" ? "declined" : "confirmed",
          order: {
            id: nextId(db, "order"),
            status: "pending",
            version: 1,
            createdAt: new Date(timestamp).toISOString(),
            receipt: null,
          },
        };
        updateStock(db, quote.items, -1);
        db.orders.push(entry);
        return { order: entry.order, created: true };
      });

      if (result.created && currentScenario() === "order-timeout") {
        await delay(11_000);
        if (generation !== scenarioGeneration()) return HttpResponse.error();
      }
      return HttpResponse.json(result.order, {
        status: result.created ? 201 : 200,
      });
    }),
  ),
  http.get(endpoint("/orders/pending"), ({ request }) =>
    respond(request, "orders", () =>
      withOrders((db) => {
        const user = account(db, request);
        const entry = db.orders.find(
          ({ order, userId }) =>
            order.status === "pending" && userId === user.profile.id,
        );
        return HttpResponse.json(entry?.order ?? null);
      }),
    ),
  ),
  http.get(endpoint("/orders/:orderId"), ({ request, params }) =>
    respond(request, "orders", () =>
      withOrders((db) => {
        const user = account(db, request);
        const entry = db.orders.find(
          ({ order, userId }) =>
            order.id === params.orderId && userId === user.profile.id,
        );
        if (!entry) reject(404, "NOT_FOUND", "Pedido não encontrado.");
        return HttpResponse.json(entry.order);
      }),
    ),
  ),
  http.get(endpoint("/orders/:orderId/receipt"), ({ request, params }) =>
    respond(request, "orders", () =>
      withOrders((db) => {
        const user = account(db, request);
        const entry = db.orders.find(
          ({ order, userId }) =>
            order.id === params.orderId && userId === user.profile.id,
        );
        if (!entry) reject(404, "NOT_FOUND", "Pedido não encontrado.");
        if (!entry.order.receipt)
          reject(409, "CONFLICT", "O pedido ainda não tem recibo.");
        return HttpResponse.json(entry.order.receipt);
      }),
    ),
  ),
];
