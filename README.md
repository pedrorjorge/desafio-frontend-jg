# KURIO

Marketplace simulado de NFTs criado para um desafio frontend júnior e para estudo. O código reúne descoberta, conta do colecionador e compra com cotação, carteira fictícia, acompanhamento de pedido e recibo. Dados, pagamentos e eventos são simulados no navegador.

**Publicação pendente.** O projeto tem [configuração Vercel](vercel.json). A entrega depende das pendências do [checklist do desafio](docs/challenge-checklist.md).

## Tecnologias

React, TypeScript, Vite, TanStack Router e Query, Axios e REST, Socket.IO Client, MSW, Tailwind CSS e componentes locais shadcn/ui. React Hook Form e Zod validam formulários, Decimal.js calcula valores em ETH, Playwright cobre fluxos e regressão visual e Lighthouse audita qualidade e performance. ESLint e Prettier verificam o código.

## Instalação e execução

Use Node.js 22 a partir de 22.12 ou Node.js 24, com npm. Use Chromium instalado pelo Playwright para os testes e Google Chrome para o Lighthouse.

O lockfile ainda está pendente. Em um ambiente com acesso ao registro público npm, rode `npm install` para gerar `package-lock.json` e versione-o. Em checkout limpo com o lockfile versionado, execute:

```sh
npm ci
cp .env.example .env.local
# Defina VITE_ENABLE_MOCKS=true em .env.local
npm run dev
```

Abra o endereço exibido pelo Vite. Para testar o artefato que será publicado, execute `npm run build:demo` e `npm run preview`. O build demo gera o worker e mantém os mocks ativos mesmo sem `.env.local`.

| Variável            | Uso                                                    |
| ------------------- | ------------------------------------------------------ |
| `VITE_ENABLE_MOCKS` | Ative com `true`. O modo `demo` já fornece esse valor. |
| `VITE_API_BASE_URL` | Base REST. O padrão é `/api`.                          |
| `CHROME_PATH`       | Caminho opcional do Chrome para o Lighthouse.          |

Valores `VITE_*` são públicos no bundle. Use apenas dados e credenciais fictícios.

## Contas e cenários

| Conta fictícia       | Senha            |
| -------------------- | ---------------- |
| `ana@example.test`   | `DemoAna!2026`   |
| `bruno@example.test` | `DemoBruno!2026` |

Com a aplicação aberta e os mocks ativos, selecione um cenário no console:

```js
await window.kurioMocks.select("slow");
location.reload();
```

Para restaurar o cenário atual, execute `await window.kurioMocks.reset()` e recarregue a página. Selecione `default` para voltar ao comportamento padrão. Selecionar ou resetar restaura a base daquela origem, incluindo as sessões e os carrinhos. Use um contexto de navegador separado por teste manual.

- **Catálogo e conexão** — use `slow`, `empty` ou `offline` para observar carregamento, lista vazia e recuperação.
- **Sessão** — entre no cenário padrão, avance o relógio do mock uma hora e acesse uma rota privada.
- **Favoritos** — use `favorite-error`, autentique e altere um favorito. A alteração otimista deve reverter.
- **Cupom e carteira** — use `VENCIDO` no carrinho ou selecione `wallet-declined` antes de fazer login e tentar conectar no checkout.
- **Pedido e tempo real** — use `order-declined` ou `order-timeout` e retome a tentativa pelo checkout. O roteiro de eventos explica como alterar estoque durante a revisão e reconectar com pedido pendente. [Cenários completos](docs/scenarios.md) · [Eventos](docs/events.md)

## Comandos

| Comando                      | Resultado                                                             |
| ---------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                | Inicia o Vite e gera o Service Worker.                                |
| `npm run build`              | Verifica tipos e cria o build de produção.                            |
| `npm run build:demo`         | Cria o build otimizado com os mocks ativos.                           |
| `npm run preview`            | Serve localmente o conteúdo de `dist/`.                               |
| `npm run lint`               | Executa o ESLint, com falha para avisos.                              |
| `npm run typecheck`          | Verifica os tipos.                                                    |
| `npm run format`             | Formata o código e os documentos.                                     |
| `npm run test:e2e`           | Executa os cenários E2E em desktop e mobile.                          |
| `npm run test:visual`        | Compara as quatro telas com as baselines.                             |
| `npm run test:visual:update` | Captura ou atualiza as baselines para revisão.                        |
| `npm run test:report`        | Abre o relatório HTML do Playwright.                                  |
| `npm run audit:lighthouse`   | Audita Home e detalhe em mobile e desktop, três vezes por combinação. |

Instale o navegador com `npx playwright install chromium`. O Playwright sobe o build demo na porta 4174 e usa contexto isolado por teste. Use `-- --project=chromium-mobile` ou `-- --project=chromium-desktop` para escolher um perfil. Relatórios, traces e capturas de falha ficam em `playwright-report/` e `test-results/`. Gere e revise as oito capturas antes de versioná-las em `tests/visual/baselines/`. [Guia de testes](docs/study/12-testing.md)

A auditoria usa a porta 4175 e grava HTML, JSON e medianas em `lighthouse-reports/<data>/`. [Protocolo e estado das medições](docs/performance.md)

## Estrutura e entrega

- `src/routes`, `src/pages` e `src/components` organizam navegação e interface.
- `src/hooks`, `src/services`, `src/types` e `src/lib` cuidam de estado, transporte e contratos.
- `src/mocks`, `src/styles` e `src/assets` reúnem simulação, tema e artes.
- `tests/e2e`, `tests/visual` e `scripts` contêm as verificações automatizadas.
- `docs` contém os contratos, a revisão do desafio e o material de estudo.

Depois de validar o lockfile e o build demo, importe o repositório em uma conta Vercel autorizada. A configuração instala via `npm ci`, usa `build:demo`, publica `dist/` e mantém as rotas do aplicativo no Router. Verifique o worker, acesso direto, refresh e o roteiro Socket.IO antes de adicionar a URL pública aqui. [Deploy](docs/study/14-deployment.md) · [Arquitetura](ARCHITECTURE.md) · [Contratos REST](docs/api.md) · [Roteiro de estudo](docs/study/README.md)
