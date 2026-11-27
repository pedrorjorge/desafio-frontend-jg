import type { Cart, Nft, Order } from "../../src/types/api";

import {
  addFromDetail,
  bruno,
  expect,
  loginAs,
  placeOrder,
  prepareCheckout,
  responseFor,
  test,
} from "./fixtures";

const editionPath = "/__mock/nfts/exemplo/editions/standard";

async function connected(mocks: {
  request<T>(method: string, path: string): Promise<{ data: T }>;
}) {
  await expect
    .poll(
      async () =>
        (
          await mocks.request<{ connected: number }>(
            "GET",
            "/__mock/realtime/status",
          )
        ).data.connected,
    )
    .toBeGreaterThan(0);
}

test("9 · eventos Socket.IO reprecificam o checkout e bloqueiam edição esgotada", async ({
  page,
  mocks,
}) => {
  await mocks.start();
  await loginAs(page);
  await addFromDetail(page);
  await prepareCheckout(page);
  await connected(mocks);
  const current = await mocks.request<Cart>("GET", "/cart");
  const refreshed = responseFor(page, "GET", "/cart");
  expect(
    (await mocks.request<Nft>("PATCH", editionPath, { price: "0.09" })).status,
  ).toBe(200);
  const cart = await refreshed;
  expect(((await cart.json()) as Cart).version).toBeGreaterThan(
    current.data.version,
  );
  await expect(page.getByText("0,091 ETH", { exact: true })).toBeVisible();
  await expect(page.getByText(/A cotação foi atualizada/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar pedido" }),
  ).toBeDisabled();

  await page
    .getByRole("button", { name: "Confirmar valores da cotação" })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviar pedido" }),
  ).toBeEnabled();
  const requote = responseFor(page, "POST", "/quotes");
  expect(
    (await mocks.request<Nft>("PATCH", editionPath, { available: 0 })).status,
  ).toBe(200);
  expect((await requote).status()).toBe(409);
  await expect(
    page.getByRole("alert").filter({ hasText: "estoque disponível" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar pedido" }),
  ).toBeDisabled();
});

test("10 · eventos repetidos, reconexão e retomada de pedido pendente", async ({
  page,
  mocks,
}) => {
  await mocks.start();
  await loginAs(page);
  await addFromDetail(page);
  await prepareCheckout(page);
  await connected(mocks);
  expect(
    (await mocks.request<Nft>("PATCH", editionPath, { price: "0.09" })).status,
  ).toBe(200);
  await expect(page.getByText("0,091 ETH", { exact: true })).toBeVisible();
  for (const kind of ["duplicate", "older"]) {
    expect(
      (
        await mocks.request("POST", "/__mock/realtime/replay", {
          nftId: "exemplo",
          kind,
        })
      ).status,
    ).toBe(204);
  }
  await expect(page.getByText("0,091 ETH", { exact: true })).toBeVisible();
  await expect(page.getByText("0,076 ETH", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirmar valores da cotação" })
    .click();
  const id = await placeOrder(page);
  await expect(
    page.getByRole("heading", { name: "Pedido pendente" }),
  ).toBeVisible();

  expect(
    (await mocks.request("POST", "/__mock/realtime/disconnect")).status,
  ).toBe(200);
  await expect
    .poll(
      async () =>
        (
          await mocks.request<{ connected: number }>(
            "GET",
            "/__mock/realtime/status",
          )
        ).data.connected,
    )
    .toBe(0);
  await mocks.advance(2000);
  expect(
    (await mocks.request("POST", "/__mock/realtime/reconnect")).status,
  ).toBe(200);
  await connected(mocks);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/orders/${id}$`));
  await page.reload();
  await expect(page.getByText(`Transação simulada: mock-${id}`)).toBeVisible();
  expect(
    (await mocks.request<Order>("GET", `/orders/${id}`)).data.receipt?.total,
  ).toBe("0.091");

  await loginAs(page, bruno, `/orders/${id}`);
  await expect(
    page.getByRole("heading", { name: "Não foi possível consultar o pedido" }),
  ).toBeVisible();
  expect((await mocks.request("GET", `/orders/${id}`)).status).toBe(404);
  await expect(page.getByText(`Transação simulada: mock-${id}`)).toHaveCount(0);
});
