import { expect, responseFor, test } from "./fixtures";

test("1 · busca, filtros combinados, ordenação, paginação e histórico", async ({
  page,
  mocks,
  isMobile,
}) => {
  await mocks.start();
  const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
  await catalog.getByRole("button", { name: "Próxima página" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    catalog.getByRole("button", { name: "Página 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const search = catalog.getByRole("searchbox", { name: "Buscar NFTs" });
  await search.fill("raposa");
  await search.press("Enter");
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("q") === "raposa" && !url.searchParams.has("page"),
  );
  await expect(catalog.getByRole("article")).toHaveCount(1);
  await expect(
    catalog.getByRole("heading", { name: "Raposa Âmbar" }),
  ).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue("raposa");
  await expect(catalog.getByRole("article")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/page=2/);
  await expect(search).toHaveValue("");

  if (isMobile)
    await catalog.getByRole("button", { name: "Filtros", exact: true }).click();
  const filters = isMobile
    ? page.getByRole("dialog", { name: "Filtros" })
    : catalog.getByRole("complementary", { name: "Filtros do catálogo" });
  await filters.getByRole("checkbox", { name: "Retratos" }).check();
  await filters.getByRole("checkbox", { name: "Paisagens" }).check();
  await filters.getByLabel("Máximo").fill("0,13");
  await filters.getByLabel("Disponibilidade").selectOption("true");
  const listed = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/nfts" &&
      url.searchParams.get("maxPrice") === "0.13"
    );
  });
  await filters.getByRole("button", { name: "Aplicar filtros" }).click();
  const response = await listed;
  const params = new URL(response.url()).searchParams;
  expect(params.getAll("category")).toEqual(["retratos", "paisagens"]);
  expect(params.get("maxPrice")).toBe("0.13");
  expect(params.get("available")).toBe("true");
  expect(params.get("page")).toBe("1");
  await catalog.getByLabel("Ordenar por").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(catalog.getByRole("article").first()).toContainText(
    "Sentinela de Bronze",
  );
  await expect(
    catalog.getByRole("heading", { name: "Reflexo de Cobre" }),
  ).toHaveCount(0);
});

test("2 · detalhe direto, edição indisponível e NFT inexistente", async ({
  page,
  mocks,
}) => {
  await mocks.start("/nfts/exemplo");
  await expect(
    page.getByRole("heading", { name: "Raposa Âmbar" }),
  ).toBeVisible();
  const view = page.getByRole("button", { name: "Vista de detalhe" });
  await view.click();
  await expect(view).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Edição").selectOption("limited");
  await expect(page.getByText("Edição indisponível.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Raposa Âmbar" }),
  ).toBeVisible();
  const missing = responseFor(page, "GET", "/nfts/inexistente");
  await page.goto("/nfts/inexistente");
  expect((await missing).status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "NFT não encontrado" }),
  ).toBeVisible();
});

test("12 · skeleton, resultado vazio, falha de rede e recuperação", async ({
  page,
  mocks,
}) => {
  await mocks.start("/", "slow");
  const catalog = page.getByRole("region", { name: "Catálogo de NFTs" });
  await expect(catalog.locator(".skeleton-shimmer").first()).toBeVisible();
  await expect(catalog.getByRole("article")).toHaveCount(6);
  await catalog.getByRole("searchbox").fill("sem resultado 456");
  await catalog.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    catalog.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await mocks.select("offline");
  await page.reload();
  await expect(
    catalog.getByRole("heading", {
      name: "Não foi possível carregar o catálogo",
    }),
  ).toBeVisible();
  await mocks.select("default");
  await catalog.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    catalog.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await catalog.getByRole("button", { name: "Limpar busca e filtros" }).click();
  await expect(catalog.getByRole("article")).toHaveCount(6);
});
