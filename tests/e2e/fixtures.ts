import {
  expect,
  test as base,
  type Page,
  type Response,
} from "@playwright/test";

import type { Scenario } from "../../src/mocks/scenarios";

const epoch = new Date("2026-01-01T12:00:00Z");

export const ana = { email: "ana@example.test", password: "DemoAna!2026" };
export const bruno = {
  email: "bruno@example.test",
  password: "DemoBruno!2026",
};

export const test = base.extend<{ mocks: ReturnType<typeof mockControls> }>({
  mocks: async ({ page }, use) => {
    // The mock uses Date.now() to derive its clock. Timers and latency still run normally.
    await page.clock.setFixedTime(epoch);
    await use(mockControls(page));
  },
});

function mockControls(page: Page) {
  async function ready() {
    await page.waitForFunction(() => !!window.kurioMocks);
  }

  async function select(scenario: Scenario) {
    await ready();
    await page.evaluate((name) => window.kurioMocks!.select(name), scenario);
  }

  return {
    async start(path = "/", scenario: Scenario = "default") {
      await page.goto("/");
      await select(scenario);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await ready();
    },
    select,
    async advance(ms: number) {
      await page.evaluate(
        (value) => window.kurioMocks!.advanceClock(value),
        ms,
      );
    },
    async request<T>(method: string, path: string, data?: unknown) {
      const response = await page.evaluate(
        async ({ method, path, data }) => {
          const response = await window.kurioMocks!.http.request({
            method,
            url: path,
            data,
            validateStatus: () => true,
          });
          return { status: response.status, data: response.data };
        },
        { method, path, data },
      );
      return response as { status: number; data: T };
    },
  };
}

export function responseFor(page: Page, method: string, pathname: string) {
  return page.waitForResponse((response) =>
    matchesResponse(response, method, pathname),
  );
}

function matchesResponse(response: Response, method: string, pathname: string) {
  return (
    response.request().method() === method &&
    new URL(response.url()).pathname === `/api${pathname}`
  );
}

export async function loginAs(
  page: Page,
  credentials = ana,
  returnTo?: string,
) {
  await page.goto(
    returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login",
  );
  await page.getByLabel("E-mail", { exact: true }).fill(credentials.email);
  await page.getByLabel("Senha", { exact: true }).fill(credentials.password);
  const response = responseFor(page, "POST", "/auth/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL((url) => url.pathname !== "/login");
}

export async function addFromDetail(page: Page) {
  await page.goto("/nfts/exemplo");
  await expect(
    page.getByRole("heading", { name: "Raposa Âmbar" }),
  ).toBeVisible();
  const changed = responseFor(page, "POST", "/cart/items");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  expect((await changed).status()).toBeLessThan(300);
  await expect(page).toHaveURL(/\/cart$/);
}

export async function prepareCheckout(page: Page) {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Pagamento" })).toBeVisible();
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar valores da cotação" })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviar pedido" }),
  ).toBeEnabled();
}

export async function placeOrder(page: Page) {
  const posted = responseFor(page, "POST", "/orders");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  const response = await posted;
  expect(response.status()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  await expect(page).toHaveURL(new RegExp(`/orders/${id}$`));
  return id;
}

export { expect };
