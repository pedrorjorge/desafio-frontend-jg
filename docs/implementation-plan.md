# Plano de implementação do KURIO

O [enunciado](reference/challenge.md) rege os requisitos. O [raster](reference/design.webp) rege a composição e a identidade visual. As dependências abaixo indicam pré-requisitos técnicos. A numeração indica a ordem recomendada de entrega. Após cada etapa com código, executar `npm run lint`, `npm run typecheck` e `npm run build`, além da validação específica de cada etapa.

## 1. Contexto e planejamento

**Status** — Concluída.

- **Objetivo** — estabelecer escopo, sequência e critérios verificáveis.
- **Escopo** — cruzar requisitos com os frames e identificar riscos, lacunas visuais e decisões pendentes.
- **Dependências** — enunciado e referência local.
- **Entregáveis** — Steering revisado, este plano e a [visão geral para estudo](study/01-project-overview.md), vinculada ao índice.
- **Aceite** — 15 etapas rastreáveis, critérios eliminatórios explícitos e prova de conceito planejada antes dos fluxos.
- **Requisitos** — §§ 1–12 mapeadas. A execução técnica ocorre nas etapas seguintes.

## 2. Inicialização do projeto

**Status** — Em andamento. A base foi escrita. A instalação bloqueada pelo acesso ao registro npm impede gerar o lockfile e validar os critérios de execução.

- **Objetivo** — estabelecer uma base reproduzível.
- **Escopo** — Vite, React, TypeScript strict, npm, ESLint, Prettier, Tailwind e shadcn/ui, configuração inicial de Router e Query, base Axios e scripts. Introduzir as demais dependências quando usadas.
- **Dependências** — 1.
- **Entregáveis** — aplicação inicial com nove rotas, lockfile, scripts npm e guias de [React e TypeScript](study/02-react-and-typescript.md) e [navegação](study/04-routing.md).
- **Aceite** — `npm ci` em checkout limpo, build servido em preview e rota desconhecida com tratamento próprio.
- **Requisitos** — §§ 2, 4 e 12, stack de base, navegação e execução reproduzível.

## 3. Identidade visual e componentes compartilhados

**Status** — Em andamento. A fundação visual foi implementada. A instalação indisponível ainda impede executar os critérios de validação no navegador e no build.

- **Objetivo** — reproduzir a linguagem visual e a estrutura comum.
- **Escopo** — inventário de assets originais, tokens CSS/Tailwind, fontes, adaptação shadcn/ui e layouts. Criar AppLayout, Header, Footer, MobileNavigation, Container, NFTCard, PriceDisplay, QuantitySelector, LoadingSkeleton, EmptyState e ErrorState.
- **Dependências** — 1 e 2.
- **Entregáveis** — tema, shell responsivo, arte local de demonstração, decisões em [ARCHITECTURE.md](../ARCHITECTURE.md) e [guia de componentes e estilos](study/03-components-and-styling.md).
- **Aceite** — shell comparado com os frames, navegação e foco coerentes em 390, 768 e 1440 px, tokens centralizados e shimmer respeitando movimento reduzido.
- **Requisitos** — §§ 3 e 8, composição, responsividade, componentes e acessibilidade.

## 4. Contratos REST, MSW, fixtures e prova de conceito de Socket.IO

**Status** — Em andamento. Contratos, handlers, cenários e prova escritos. A interceptação REST e os frames WebSocket foram exercitados em Node. A validação com socket.io-client no navegador e no build demo depende da instalação completa.

- **Objetivo** — validar a integração de rede e tornar cenários reproduzíveis.
- **Escopo** — definir método, rota, entrada, saída, validação, autorização e erros para sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras. Normalizar 400/422, 401, 403, 404, 409 e 5xx e distinguir timeout de falha de conexão. Preparar estado persistido versionado e reset que restaure fixtures, relógio, sequência de falhas e eventos. Implementar handlers à medida que os contratos forem exercitados.
- **Dependências** — 2.
- **Entregáveis** — contratos tipados REST e de evento, bootstrap condicional, fixtures com pelo menos dois usuários e variedade para filtros e paginação, seleção de cenário e prova de conceito com cliente Socket.IO real, [contratos da API](api.md), [cenários](scenarios.md) e [roteiro de estudo](study/README.md).
- **Aceite** — Axios interceptado em desenvolvimento e preview otimizado. Em Chromium, o cliente completa handshake e recebe evento de texto pelo MSW após mudança no estado compartilhado, que também aparece no GET seguinte. Demonstrar desconexão e reconexão, validar carregamento do worker em origem HTTPS de teste e registrar versões e limitações. Resolver incompatibilidades mantendo MSW e Socket.IO no caminho de rede antes de avançar nas partes dependentes.
- **Requisitos** — §§ 2, 4–7 e 12, contratos, controles de latência, timeout, indisponibilidade, erros HTTP e transporte compatível.

## 5. Home e catálogo

**Status** — Em andamento. Home e catálogo implementados, com testes de integração em Node para REST, Query, normalização e cancelamento. A validação de refresh, histórico, drawer e build permanece pendente por indisponibilidade de dependências no ambiente.

- **Objetivo** — permitir descoberta e navegação reproduzível.
- **Escopo** — HeroBanner, NFTCard, NFTGrid, CatalogFilters, SearchInput e Pagination. Normalizar busca, filtros, ordenação e página na URL. Reiniciar a paginação ao filtrar. Incluir filtros recolhíveis e destaques.
- **Dependências** — 3 e 4.
- **Entregáveis** — home, serviço e query de listagem, estados vazio, erro, atualização e skeleton.
- **Aceite** — combinar filtros, ordenar e paginar, preservar seleção em refresh e histórico, e manter resultados da busca atual quando uma resposta antiga chega por último.
- **Requisitos** — §§ 3–6 e 8, catálogo, roteamento, cancelamento e feedback.

## 6. Detalhes do NFT

**Status** — Em andamento. Consulta, galeria, edições, quantidade e relacionados implementados. Validação no navegador e build dependem da instalação completa.

- **Objetivo** — consultar uma edição e preparar sua compra.
- **Escopo** — NFTGallery, informações, seletor de edição, QuantitySelector, preço e disponibilidade. Compor ações de favorito e compra com os serviços das etapas 8 e 9 quando disponíveis.
- **Dependências** — 3–5.
- **Entregáveis** — rota paramétrica, consulta e estados de detalhe com skeleton e proporções reservadas.
- **Aceite** — acesso direto e refresh, NFT inexistente com feedback, troca de edição, quantidade inteira limitada pelo estoque e edição indisponível com compra bloqueada. Validar ações integradas nas etapas 8 e 9.
- **Requisitos** — §§ 3–5 e 8, galeria, detalhe, edição, disponibilidade e navegação.

## 7. Login, cadastro e sessão

**Status** — Em andamento. Login, cadastro, logout, guardas e expiração implementados e integração REST verificada em Node. Validação de navegação, refresh, foco e build depende da instalação completa.

- **Objetivo** — autenticar e retomar o fluxo correto.
- **Escopo** — LoginForm e RegisterForm com React Hook Form e Zod, diálogos no desktop e rotas dedicadas no mobile. Consulta inicial de sessão, expiração, logout, proteção e retorno interno validado.
- **Dependências** — 2–4.
- **Entregáveis** — fluxos de autenticação e cadastro, handlers, validação e limpeza do cache privado. Integrar a limpeza de subscriptions na etapa 11.
- **Aceite** — cadastro trata conflito, login retorna ao fluxo anterior, refresh recupera sessão, 401 redireciona com retomada e troca de usuário invalida dados privados e requisições em voo. Diferenciar erro transitório de expiração e usar apenas credenciais fictícias e verificadores sem senha em claro.
- **Requisitos** — §§ 3–6 e 8, conta, expiração, proteção e formulários.

## 8. Perfil, carteiras e favoritos

**Status** — Em andamento. Operações privadas implementadas e integração exercitada em Node. Validação no navegador e build dependem da instalação completa.

- **Objetivo** — completar as operações da conta do colecionador.
- **Escopo** — AccountSidebar, perfil, avatar, senha, cadastro e edição de carteiras principal e secundária e consulta/inclusão/remoção de favoritos com FavoriteButton.
- **Dependências** — 4, 6 e 7.
- **Entregáveis** — telas responsivas, serviços, handlers, erros de campos e mutation otimista de favorito com rollback.
- **Aceite** — alterações confirmadas sobrevivem ao refresh, erros preservam os campos editáveis, falha de favorito restaura o estado e duas contas mantêm dados e favoritos isolados.
- **Requisitos** — §§ 3–6 e 8, perfil, carteira, favoritos e atualização otimista.

## 9. Carrinho e cotação

**Status** — Em andamento. Carrinho e cotação versionada implementados. Integração REST, precisão, mesclagem e isolamento exercitados em Node. Browser e build dependem da instalação completa.

- **Objetivo** — permitir edição do carrinho e apresentar valores confiáveis.
- **Escopo** — CartItem, QuantitySelector, OrderSummary e CouponInput. Adicionar via detalhe, alterar e remover por NFT/edição, aplicar e remover cupom e persistir carrinho por identidade. Consolidar o carrinho visitante após autenticação com controle de reaplicação e feedback de conflitos de estoque.
- **Dependências** — 4, 6 e 7.
- **Entregáveis** — carrinho persistido, cotação via API, regras de arredondamento e skeleton do resumo.
- **Aceite** — refresh/login preservam os itens disponíveis, repetição da operação de junção mantém as quantidades, conflitos são informados, cupom inválido ou expirado é tratado e subtotal, desconto, taxa e total coincidem com a API em strings decimais. Atualização por evento é aceita na etapa 11.
- **Requisitos** — §§ 3–6 e 8, carrinho, cupom, persistência, precisão e disponibilidade.

## 10. Checkout, pedidos e confirmação

**Status** — Em andamento. Revisão, submissão idempotente, consulta de status e recibo foram integrados para exercitar tempo real. A revisão integral dos requisitos da tela e a validação no navegador permanecem pendentes.

- **Objetivo** — concluir a compra com revisão, idempotência e recibo.
- **Escopo** — campos do colecionador, WalletSelector, NetworkSelector, conexão/recusa/desconexão simuladas, revisão, envio e rotas de consulta e confirmação. Revalidar preço, disponibilidade, cupom e taxas no envio. Vincular tentativa e chave ao usuário e recuperar via consulta ou reenvio da mesma tentativa.
- **Dependências** — 4, 7–9.
- **Entregáveis** — checkout protegido, handlers de pedido, persistência de tentativa, estados pendente/confirmado/recusado e recibo com transação simulada, itens, taxas e total.
- **Aceite** — cotação alterada exige nova revisão. Clique repetido ou timeout após criação recupera o mesmo pedido. Mesma chave com outro conteúdo retorna conflito. Refresh recupera tentativa ou pedido. Confirmação é exclusiva do estado confirmado e usa snapshot imutável. Falha preserva itens e confirmação desconta uma vez apenas itens e quantidades comprados.
- **Requisitos** — §§ 3–6 e 8, pagamento, revisão, idempotência, estados e confirmação.

## 11. Tempo real e sincronização

**Status** — Em andamento. Publicação e reconciliação exercitadas em Node com o cliente Socket.IO 4.8.1. A instalação completa e a validação no navegador e no build demo estão pendentes.

- **Objetivo** — refletir mudanças externas e recuperar lacunas após desconexão.
- **Escopo** — `nft.updated` para catálogo, detalhe, carrinho e invalidação de cotação. `order.updated` para transições do pedido. Aplicar ID estável, versão e escopo de sessão, controlar listeners, reconciliar consultas ativas via REST na reconexão e preservar estados terminais. Mudanças persistidas no mock precedem a emissão.
- **Dependências** — prova de conceito da etapa 4 e fluxos 5–10.
- **Entregáveis** — integração do serviço Socket.IO com Query e cenários determinísticos de alteração, duplicata, atraso e interrupção.
- **Aceite** — evento atualiza catálogo, detalhe e carrinho, avisa alteração e invalida a revisão do checkout. Duplicatas e versões antigas não regridem estado. Reconexão e refresh recuperam pedido pendente sem duplicar compra. Logout, expiração e troca de usuário encerram subscriptions e impedem que mensagens antigas alterem dados privados.
- **Requisitos** — §§ 4, 6, 7 e 8, eventos reais no cliente, reconciliação REST e feedback.

## 12. Revisão visual, responsividade e acessibilidade

**Status** — Em andamento. Revisão do código contra os frames e ajustes aplicados. Validação visual em 390, 768 e 1440 px, teclado e zoom depende da instalação e do build.

- **Objetivo** — revisar toda a aplicação contra a referência.
- **Escopo** — comparar frames e adaptar perfil, carteiras e confirmação mobile, tablet e estados ausentes. Auditar teclado, foco, zoom, contraste, semântica, labels, textos alternativos e anúncios de alterações.
- **Dependências** — 3 e 5–11.
- **Entregáveis** — correções de composição e acessibilidade, registro de desvios e substituições.
- **Aceite** — operar os fluxos em 390, 768 e 1440 px sem overflow indevido ou perda de conteúdo com zoom. Diálogos e drawers gerenciam e restauram foco. Skeletons do catálogo, detalhe e resumo mantêm dimensões e respeitam movimento reduzido.
- **Requisitos** — §§ 3 e 8, fidelidade, responsividade e acessibilidade.

## 13. Testes E2E e regressão visual

**Status** — Em andamento. Suítes e configuração implementadas. A execução do build demo e a geração das oito baselines dependem da instalação completa.

- **Objetivo** — entregar evidência executável e reproduzível.
- **Escopo** — ampliar a cobertura incremental dos fluxos com Playwright em Chromium desktop e mobile. Controlar relógio, latência e eventos via cenários de rede, com contexto isolado e reset por teste.
- **Dependências** — 4 e 5–12.
- **Entregáveis** — `tests/e2e`, `tests/visual`, baselines versionadas de início, detalhe, carrinho e pagamento, relatório HTML e traces das falhas.
- **Aceite** — suíte executável com mocks e matriz abaixo completa. Asserções observam a interface e resultados de operações que passam por Axios/MSW e pelo cliente Socket.IO. Capturas usam dados, fontes e ambiente estáveis.
- **Requisitos** — § 9 integral, com evidências das §§ 3–8.

### Matriz Playwright

| Nº  | Cenário obrigatório                                                                           | Etapas      |
| --- | --------------------------------------------------------------------------------------------- | ----------- |
| 1   | Busca, filtros combinados, ordenação, paginação e histórico, incluindo resposta fora de ordem | 4–5         |
| 2   | Acesso direto ao detalhe e NFT inexistente                                                    | 6           |
| 3   | Cadastro, login, expiração inclusive no checkout, logout e troca de usuário                   | 7, 10–11    |
| 4   | Favoritos persistentes, falha e rollback                                                      | 8           |
| 5   | Quantidade, remoção, cupom, persistência no refresh e após login                              | 9           |
| 6   | Compra completa do catálogo ao recibo confirmado e imutável                                   | 5–10        |
| 7   | Pagamento recusado, clique repetido e timeout com recuperação do mesmo pedido                 | 10          |
| 8   | Edição de perfil, avatar, senha e carteiras com falhas de validação                           | 8           |
| 9   | Alteração de preço/estoque via Socket.IO e bloqueio de cotação desatualizada                  | 11          |
| 10  | Eventos duplicados ou antigos, desconexão e retomada de pedido pendente                       | 11          |
| 11  | Teclado, foco de diálogos e validação acessível de formulários                                | 7–8, 10, 12 |
| 12  | Skeletons sob lentidão, feedback de falha e recuperação após repetir                          | 4–6, 9, 12  |

## 14. Performance e Lighthouse

**Status** — Em andamento. Automação disponível. Medições pendentes por falha na instalação das dependências. Consulte o [protocolo de auditoria](performance.md).

- **Objetivo** — medir a versão entregue e corrigir gargalos observados.
- **Escopo** — início e detalhe, perfis mobile e desktop, três medições por combinação, total de 12 execuções no build otimizado com cenário padrão, imagens, fontes e funcionalidades da entrega.
- **Dependências** — 12–13.
- **Entregáveis** — comando e configuração versionada, relatórios HTML/JSON e resumo com medianas por categoria, LCP, CLS, TBT, versões e condições do ambiente.
- **Aceite** — medir contra Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 e SEO ≥ 90. Registrar causas e justificativas de resultados abaixo das metas. Reexecutar as verificações afetadas por otimizações.
- **Requisitos** — §§ 10 e 12, auditorias e reprodução.

## 15. Documentação, revisão e deploy

**Status** — Em andamento. Revisão e configuração Vercel disponíveis. A cópia limpa confirmou ausência de lockfile e a geração falhou por DNS. Deploy e validações finais pendentes. Consulte o [checklist do desafio](challenge-checklist.md).

- **Objetivo** — entregar uma versão pública e verificável a partir de checkout limpo.
- **Escopo** — README com setup, variáveis, credenciais fictícias, seleção/reset e reprodução de falhas, comandos de dev, build, preview, tipos, lint, testes e auditoria. Documentar contratos, sessão, carrinho, cache, retries e reconciliação REST/Socket.IO. Registrar decisões de UX, limitações e desvios no ARCHITECTURE.md.
- **Dependências** — 1–14.
- **Entregáveis** — repositório, lockfile, assets, mocks, fixtures, evidências de testes e auditoria e URL pública. Vercel é a opção inicial.
- **Aceite** — checkout limpo executa com npm. Build publicado corresponde ao código entregue, funciona em HTTPS com MSW e Socket.IO, preserva assets e worker no fallback SPA e suporta acesso direto e refresh de rotas. Validar compra, falhas e reconexão na URL pública, que deve permanecer disponível durante a avaliação.
- **Requisitos** — §§ 11–12 e validação final de toda a stack e dos fluxos principais.

## Critérios eliminatórios

| Critério oficial                            | Evidência de aceite                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Falta de uso efetivo da stack obrigatória   | Revisão das integrações e execução de testes e auditoria nas etapas 13–15                           |
| Fluxos principais apenas visuais            | Testes ponta a ponta da descoberta, compra e conta nas etapas 5–13                                  |
| Compra confirmada sem resposta da simulação | Recibo condicionado ao pedido confirmado e verificado via REST ou evento na simulação, etapas 10–13 |
| Exposição de dados entre usuários           | Testes com duas contas, troca de sessão e eventos atrasados, etapas 7–13                            |
| Eventos simulados diretamente na UI         | Prova e testes via MSW e cliente Socket.IO real, etapas 4, 11 e 13                                  |
| Ausência de testes E2E executáveis          | Suíte reproduzível, relatório e traces, etapas 13 e 15                                              |

Deploy público é requisito obrigatório da seção 12 e tem verificação própria na etapa 15.

## Riscos, ambiguidades e limitações

| Ponto                                                    | Tratamento planejado                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibilidade do binding e execução no build publicado | Validar em Chromium, preview e HTTPS cedo. Usar WebSocket explícito, namespace padrão e eventos de texto. O binding documenta limitações para namespaces personalizados, acknowledgements e binários. [Binding oficial](https://github.com/mswjs/socket.io-binding#limitations)                                         |
| Corridas entre REST, eventos, logout e troca de conta    | Escopar queries, pedidos e inscrições por identidade, cancelar requests, descartar respostas tardias e comparar versões do recurso. Reconciliar lacunas na reconexão.                                                                                                                                                   |
| Idempotência, estoque e pedido pendente                  | Persistir a tentativa no cliente e registrar chave, fingerprint e pedido na simulação antes de devolver resposta. Projetar transição e ajuste de carrinho como operação única, com efeito aplicado uma vez mesmo entre refreshes ou solicitações concorrentes.                                                          |
| Persistência do mock no navegador                        | Validar esquema, reset e recuperação com storage inválido ou indisponível. A persistência local é limitada à origem e ao navegador. Definir coordenação de escritas concorrentes e verificar duas abas para prevenir perda de atualizações ou duplo ajuste.                                                             |
| Merge do carrinho e reserva de estoque                   | O enunciado exige preservar itens e respeitar disponibilidade, mas deixa a política aberta. Proposta inicial é somar linhas da mesma edição até o limite disponível e informar divergências, com merge idempotente. Definir na etapa 4 quando o pedido pendente reserva estoque e como a recusa libera a reserva.       |
| Precisão dos valores em ETH                              | Preservar strings decimais no transporte e usar Decimal.js nos cálculos, com escala e arredondamento definidos no contrato. Verificar valores fracionários, descontos e taxas contra a cotação da API e o snapshot do recibo.                                                                                           |
| Regras comerciais e de rede                              | Escala decimal, arredondamento, taxa, validade da cotação, redes, formato de carteiras e regras de cupom são decisões da simulação. Formalizar exemplos nos contratos da etapa 4 e validar com as etapas 8–10.                                                                                                          |
| Referência visual rasterizada e assets                   | O arquivo local é um PNG de 8000 × 7453 com extensão `.webp`. Há frames desktop e mobile, mas faltam metadados de fonte, tokens, espaçamento e assets separados. Usar amostras do Steering como aproximação. Inventariar originais, documentar substituições e adaptar tablet e perfil, carteiras e confirmação mobile. |
| Controles auxiliares presentes nos frames                | Manter composição quando aplicável e definir na etapa 3 o destino ou estado indisponível de links editoriais, suporte e ações auxiliares como login social, sem ampliar os fluxos obrigatórios.                                                                                                                         |
| Instabilidade de baselines e Lighthouse                  | Fixar fixtures, fontes, navegador e condições relevantes. Usar relógio controlado nos testes e publicar ambiente, relatórios e medianas da auditoria sem alterar o comportamento para a medição.                                                                                                                        |
