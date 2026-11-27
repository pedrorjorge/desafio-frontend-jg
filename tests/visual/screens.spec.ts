import type { Page } from "@playwright/test";

import { addFromDetail, expect, loginAs, test } from "../e2e/fixtures";

async function capture(page: Page, name: string) {
  const images = await page.getByRole("main").locator("img").all();
  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: "disabled",
  });
}

test("Home", async ({ page, mocks }) => {
  await mocks.start();
  await expect(
    page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article"),
  ).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "NFTs em destaque" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "NFTs em destaque" }).getByRole("article"),
  ).toHaveCount(4);
  await capture(page, "home.png");
});

test("Detalhe do NFT", async ({ page, mocks }) => {
  await mocks.start("/nfts/exemplo");
  await expect(
    page.getByRole("heading", { name: "Raposa Âmbar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "NFTs relacionados" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "NFTs relacionados" })
      .getByRole("article")
      .first(),
  ).toBeVisible();
  await capture(page, "nft-detail.png");
});

test("Carrinho", async ({ page, mocks }) => {
  await mocks.start();
  await addFromDetail(page);
  await expect(page.getByText("0,076 ETH", { exact: true })).toBeVisible();
  await capture(page, "cart.png");
});

test("Checkout", async ({ page, mocks }) => {
  await mocks.start();
  await loginAs(page);
  await addFromDetail(page);
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar valores da cotação" }),
  ).toBeEnabled();
  await expect(page.getByText("0,076 ETH", { exact: true })).toBeVisible();
  await capture(page, "checkout.png");
});
