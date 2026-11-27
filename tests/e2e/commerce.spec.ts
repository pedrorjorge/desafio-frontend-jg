import type { Cart, Favorites, Order } from "../../src/types/api";

import {
  addFromDetail,
  ana,
  expect,
  loginAs,
  placeOrder,
  prepareCheckout,
  responseFor,
  test,
} from "./fixtures";

test("4 · favoritos persistentes e rollback em falha de inclusão e remoção", async ({
  page,
  mocks,
  isMobile,
}) => {
  await mocks.start("/nfts/exemplo");
  await page
    .getByRole("link", { name: "Entrar para favoritar", exact: true })
    .click();
  if (isMobile) await expect(page).toHaveURL(/\/login\?/);
  else await expect(page.getByRole("dialog", { name: "Entrar" })).toBeVisible();

  await loginAs(page, ana, "/nfts/exemplo");
  const selected = page.getByRole("button", {
    name: "Favorito: Raposa Âmbar",
    exact: true,
  });
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  const deleteResponse = responseFor(page, "DELETE", "/favorites/exemplo");
  await selected.click();
  expect((await deleteResponse).status()).toBe(200);
  await expect(selected).toHaveAttribute("aria-pressed", "false");
  const putResponse = responseFor(page, "PUT", "/favorites/exemplo");
  await selected.click();
  expect((await putResponse).status()).toBe(200);
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(selected).toHaveAttribute("aria-pressed", "true");

  await mocks.start("/nfts/exemplo", "favorite-error");
  await loginAs(page, ana, "/nfts/exemplo");
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  const removalFailed = responseFor(page, "DELETE", "/favorites/exemplo");
  await selected.click();
  await expect(selected).toHaveAttribute("aria-pressed", "false");
  expect((await removalFailed).status()).toBe(500);
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("alert").filter({ hasText: "Falha ao atualizar favoritos" }),
  ).toBeVisible();

  const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
  await page.goto("/");
  const other = catalog.getByRole("button", {
    name: "Favorito: Reflexo de Cobre",
  });
  await expect(other).toHaveAttribute("aria-pressed", "false");
  const additionFailed = responseFor(page, "PUT", "/favorites/nft-2");
  await other.click();
  await expect(other).toHaveAttribute("aria-pressed", "true");
  expect((await additionFailed).status()).toBe(500);
  await expect(other).toHaveAttribute("aria-pressed", "false");
  expect(
    (await mocks.request<Favorites>("GET", "/favorites")).data.nftIds,
  ).toEqual(["exemplo"]);
});

test("5 · carrinho, quantidades, remoção, cupons e persistência", async ({
  page,
  mocks,
}) => {
  await mocks.start();
  await addFromDetail(page);
  const list = page.getByRole("list", { name: "NFTs no carrinho" });
  const quantity = list.getByLabel("Quantidade atual");
  const increased = responseFor(page, "PATCH", "/cart/items/exemplo~standard");
  await list.getByRole("button", { name: "Aumentar quantidade" }).click();
  expect((await increased).status()).toBe(200);
  await expect(quantity).toHaveText("2");

  const coupon = page.getByLabel("Código promocional");
  await coupon.fill("VENCIDO");
  const expired = responseFor(page, "PUT", "/cart/coupon");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  expect((await expired).status()).toBe(422);
  await expect(coupon).toHaveAccessibleDescription("Cupom expirado.");
  await coupon.fill("KURIO10");
  const applied = responseFor(page, "PUT", "/cart/coupon");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  expect((await applied).status()).toBe(200);
  await expect(page.getByText("0,136 ETH", { exact: true })).toBeVisible();

  await page.reload();
  await expect(quantity).toHaveText("2");
  await expect(page.getByText("0,136 ETH", { exact: true })).toBeVisible();
  await loginAs(page, ana, "/cart");
  await expect(quantity).toHaveText("2");
  await expect(page.getByText("0,136 ETH", { exact: true })).toBeVisible();
  const active = await mocks.request<Cart>("GET", "/cart");
  expect(active.data.items[0]).toMatchObject({
    id: "exemplo~standard",
    quantity: 2,
  });
  const cleared = responseFor(page, "DELETE", "/cart/coupon");
  await page.getByRole("button", { name: "Remover cupom" }).click();
  expect((await cleared).status()).toBe(200);
  await expect(page.getByText("0,151 ETH", { exact: true })).toBeVisible();
  const removed = responseFor(page, "DELETE", "/cart/items/exemplo~standard");
  await list
    .getByRole("button", { name: "Remover Raposa Âmbar, edição Padrão" })
    .click();
  expect((await removed).status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});

test("6 · compra do catálogo ao recibo confirmado", async ({ page, mocks }) => {
  await mocks.start();
  await loginAs(page);
  const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
  await catalog.getByRole("link", { name: /Raposa Âmbar/ }).click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("link", { name: "Continuar para o pagamento" }).click();
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar valores da cotação" })
    .click();
  const id = await placeOrder(page);
  await expect(
    page.getByRole("heading", { name: "Pedido pendente" }),
  ).toBeVisible();
  await mocks.advance(2000);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  await expect(page.getByText(`Transação simulada: mock-${id}`)).toBeVisible();
  await expect(page.getByText("0,076 ETH", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  expect(
    (await mocks.request<Order>("GET", `/orders/${id}`)).data.receipt?.total,
  ).toBe("0.076");
  expect((await mocks.request<Cart>("GET", "/cart")).data.items).toHaveLength(
    0,
  );
});

test("7a · clique repetido e recusa preservam itens", async ({
  page,
  mocks,
}) => {
  await mocks.start("/", "order-declined");
  await loginAs(page);
  await addFromDetail(page);
  await prepareCheckout(page);
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders"
    ) {
      posts.push(request.headers()["idempotency-key"]);
    }
  });
  const response = responseFor(page, "POST", "/orders");
  await page
    .getByRole("button", { name: "Enviar pedido" })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  expect((await response).status()).toBe(201);
  await expect(
    page.getByRole("heading", { name: "Pedido pendente" }),
  ).toBeVisible();
  await mocks.advance(2000);
  await expect(
    page.getByRole("heading", { name: "Pedido recusado" }),
  ).toBeVisible();
  await expect(
    page.getByText("Transação simulada:", { exact: false }),
  ).toHaveCount(0);
  expect(posts).toHaveLength(1);
  expect(
    (await mocks.request<Cart>("GET", "/cart")).data.items[0].quantity,
  ).toBe(1);
});

test("7b · timeout, refresh e recuperação da mesma tentativa", async ({
  page,
  mocks,
}) => {
  await mocks.start("/", "order-timeout");
  await loginAs(page);
  await addFromDetail(page);
  await prepareCheckout(page);
  const first = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders",
  );
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  const initial = await first;
  await expect(
    page.getByRole("alert").filter({ hasText: /Retome a mesma tentativa/ }),
  ).toBeVisible({ timeout: 15_000 });
  const pending = await mocks.request<Order>("GET", "/orders/pending");
  expect(pending.data.status).toBe("pending");
  await page.reload();
  const resumed = responseFor(page, "POST", "/orders");
  await page.getByRole("button", { name: "Retomar pedido" }).click();
  const recovered = await resumed;
  expect(recovered.status()).toBe(200);
  expect(recovered.request().headers()["idempotency-key"]).toBe(
    initial.headers()["idempotency-key"],
  );
  expect(recovered.request().postData()).toBe(initial.postData());
  expect(((await recovered.json()) as Order).id).toBe(pending.data.id);
  await expect(page).toHaveURL(new RegExp(`/orders/${pending.data.id}$`));
  await mocks.advance(2000);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
});

test("conexão fictícia, desconexão e recusa da carteira", async ({
  page,
  mocks,
}) => {
  const connect = page.getByRole("button", {
    name: "Conectar carteira",
    exact: true,
  });
  const review = page.getByRole("button", {
    name: "Confirmar valores da cotação",
  });
  await mocks.start();
  await loginAs(page);
  await addFromDetail(page);
  await prepareCheckout(page);
  await page.getByRole("button", { name: "Desconectar carteira" }).click();
  await expect(review).toBeDisabled();

  await mocks.start("/", "wallet-declined");
  await loginAs(page);
  await addFromDetail(page);
  await page.goto("/checkout");
  const response = page.waitForResponse(
    (candidate) =>
      candidate.url().endsWith("/api/checkout/wallet-connection") &&
      candidate.request().method() === "POST",
  );
  await connect.click();
  expect((await response).status()).toBe(409);
  await expect(
    page.getByRole("alert").filter({ hasText: "Conexão da carteira recusada" }),
  ).toBeVisible();
  await expect(review).toBeDisabled();
});
