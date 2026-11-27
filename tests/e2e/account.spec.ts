import { ana, bruno, expect, loginAs, responseFor, test } from "./fixtures";

test("3 · cadastro, retorno protegido, expiração, logout e troca de usuário", async ({
  page,
  mocks,
}) => {
  await mocks.start("/account/profile");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("returnTo") === "/account/profile",
  );
  await page
    .getByRole("main")
    .getByRole("link", { name: "Criar conta" })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Colecionadora Demo");
  await page.getByLabel("E-mail", { exact: true }).fill(ana.email);
  await page.getByLabel("Senha", { exact: true }).fill("SenhaNova!2026");
  let registered = responseFor(page, "POST", "/auth/register");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  expect((await registered).status()).toBe(409);
  await expect(
    page.getByLabel("E-mail", { exact: true }),
  ).toHaveAccessibleDescription("E-mail já cadastrado.");

  await page
    .getByLabel("E-mail", { exact: true })
    .fill("collector@example.test");
  registered = responseFor(page, "POST", "/auth/register");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  expect((await registered).status()).toBe(201);
  await expect(page).toHaveURL(/\/account\/profile$/);
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Colecionadora Demo",
  );
  await page.reload();
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Colecionadora Demo",
  );

  await mocks.advance(3_600_001);
  await page.goto("/account/wallets");
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("returnTo") === "/account/wallets",
  );
  await loginAs(page, ana, "/account/profile");
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    ana.email,
  );
  const loggedOut = responseFor(page, "POST", "/auth/logout");
  await page.getByRole("button", { name: "Sair", exact: true }).first().click();
  expect((await loggedOut).status()).toBe(204);
  await expect(page).toHaveURL(/\/$/);
  await loginAs(page, bruno, "/account/profile");
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    bruno.email,
  );
  const session = await mocks.request<{ user: { id: string } }>(
    "GET",
    "/auth/session",
  );
  expect(session.data.user.id).toBe("user-bruno");
});

test("8 · perfil, avatar, senha e carteira com erros de campo", async ({
  page,
  mocks,
}) => {
  await mocks.start();
  await loginAs(page, ana, "/account/profile");
  const displayName = page.getByLabel("Nome de exibição");
  await displayName.fill("A");
  const saveProfile = page.getByRole("button", { name: "Salvar perfil" });
  await saveProfile.click();
  await expect(displayName).toHaveAttribute("aria-invalid", "true");
  await displayName.fill("Ana Colecionadora");
  await page.getByLabel("E-mail", { exact: true }).fill(bruno.email);
  const conflict = responseFor(page, "PATCH", "/profile");
  await saveProfile.click();
  expect((await conflict).status()).toBe(409);
  await expect(
    page.getByLabel("E-mail", { exact: true }),
  ).toHaveAccessibleDescription("E-mail já cadastrado.");
  await page.getByLabel("E-mail", { exact: true }).fill(ana.email);

  const avatar = page.getByLabel("Avatar", { exact: true });
  await avatar.setInputFiles({
    name: "texto.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("fixture"),
  });
  await expect(avatar).toHaveAttribute("aria-invalid", "true");
  await avatar.setInputFiles("src/assets/amber-fox.webp");
  await expect(
    page.getByRole("img", { name: "Prévia do avatar" }),
  ).toBeVisible();
  const updated = responseFor(page, "PATCH", "/profile");
  await saveProfile.click();
  expect((await updated).status()).toBe(200);
  await expect(page.getByText("Perfil atualizado.")).toBeVisible();

  await page.getByLabel("Senha atual").fill("SenhaErrada!42");
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha!2026");
  await page.getByLabel("Confirmar nova senha").fill("NovaSenha!2026");
  const invalidPassword = responseFor(page, "PUT", "/profile/password");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  expect((await invalidPassword).status()).toBe(422);
  await expect(page.getByLabel("Senha atual")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Senha atual").fill(ana.password);
  const password = responseFor(page, "PUT", "/profile/password");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  expect((await password).status()).toBe(204);

  await page.reload();
  await expect(displayName).toHaveValue("Ana Colecionadora");
  await expect(
    page.getByRole("img", { name: "Prévia do avatar" }),
  ).toBeVisible();
  await page.goto("/account/wallets");
  const primary = page
    .getByRole("heading", { name: "Carteira principal" })
    .locator("..")
    .locator("..");
  const address = primary.getByLabel("Endereço fictício da carteira");
  await address.fill("invalido");
  await primary.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(address).toHaveAttribute("aria-invalid", "true");
  await address.fill(`0x${"a".repeat(40)}`);
  await primary.getByLabel("Apelido da carteira").fill("Carteira revisada");
  const wallet = responseFor(page, "PATCH", "/wallets/wallet-ana-primary");
  await primary.getByRole("button", { name: "Salvar carteira" }).click();
  expect((await wallet).status()).toBe(200);
  await page.reload();
  await expect(primary.getByLabel("Apelido da carteira")).toHaveValue(
    "Carteira revisada",
  );
  const secondary = page
    .getByRole("heading", { name: "Carteira secundária" })
    .locator("..")
    .locator("..");
  await secondary.getByLabel("Apelido da carteira").fill("Secundária revisada");
  const secondarySave = responseFor(
    page,
    "PATCH",
    "/wallets/wallet-ana-secondary",
  );
  await secondary.getByRole("button", { name: "Salvar carteira" }).click();
  expect((await secondarySave).status()).toBe(200);
  await page.reload();
  await expect(secondary.getByLabel("Apelido da carteira")).toHaveValue(
    "Secundária revisada",
  );
  await loginAs(
    page,
    { ...ana, password: "NovaSenha!2026" },
    "/account/profile",
  );
});

test("11 · teclado, foco modal e validação", async ({
  page,
  mocks,
  isMobile,
}) => {
  await mocks.start();
  const trigger = page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Entrar", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const form = isMobile
    ? page.getByRole("main")
    : page.getByRole("dialog", { name: "Entrar" });
  await expect(
    form.getByRole("heading", { name: "Entrar", exact: true }),
  ).toBeVisible();
  const email = form.getByLabel("E-mail", { exact: true });
  if (!isMobile) {
    await expect(email).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(form.getByLabel("Senha", { exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(email).toBeFocused();
  }
  await form.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAccessibleDescription("Informe um e-mail válido.");
  if (!isMobile) {
    await page.keyboard.press("Escape");
    await expect(form).toHaveCount(0);
    await expect(trigger).toBeFocused();
  } else {
    await page.goBack();
    const filters = page.getByRole("button", { name: "Filtros", exact: true });
    await filters.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Filtros" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(filters).toBeFocused();
  }
});
