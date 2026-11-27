# Roteiro de estudo do KURIO

Este roteiro acompanha a construção do marketplace. Ele parte de conhecimentos básicos de HTML, CSS e JavaScript e conecta cada assunto aos fluxos reais do projeto.

## Leitura disponível

Comece pelo [enunciado do desafio](../reference/challenge.md) para entender o que o KURIO precisa fazer. Em seguida, leia o [plano de implementação](../implementation-plan.md) para acompanhar a implementação e as verificações.

A [visão geral do KURIO](01-project-overview.md) é o primeiro guia. Ela percorre os fluxos, a stack e a arquitetura do código.

## Ordem recomendada

Leia os guias na ordem abaixo. Consulte o [checklist](../challenge-checklist.md) para saber quais verificações seguem pendentes.

| Ordem | Tema                                                                                                                                                                                                                                | Etapa do plano |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1     | [Visão geral do KURIO](01-project-overview.md)                                                                                                                                                                                      | 1              |
| 2     | [React e TypeScript](02-react-and-typescript.md) e [navegação com TanStack Router](04-routing.md)                                                                                                                                   | 2              |
| 3     | [Componentes e estilos](03-components-and-styling.md)                                                                                                                                                                               | 3              |
| 4     | [REST e Axios](05-rest-and-axios.md) e [Mock Service Worker](06-msw.md)                                                                                                                                                             | 4              |
| 5     | [TanStack Query no catálogo](07-tanstack-query.md) e [parâmetros de busca](04-routing.md#parâmetros-de-busca-do-catálogo)                                                                                                           | 5              |
| 6     | [Rotas de detalhe](04-routing.md#parâmetros-e-navegação), [galeria, edições e quantidade](03-components-and-styling.md)                                                                                                             | 6              |
| 7     | [Autenticação e sessão](08-authentication.md) e [formulários e validação](09-forms-and-validation.md)                                                                                                                               | 7              |
| 8     | [Dados do colecionador](08-authentication.md#dados-do-colecionador), [avatar](09-forms-and-validation.md#avatar-e-formulários-privados) e [favoritos otimistas](07-tanstack-query.md#mutations-e-atualização-otimista-de-favoritos) | 8              |
| 9     | [Carrinho, mesclagem e cotação](10-cart-and-checkout.md)                                                                                                                                                                            | 9              |
| 10    | [Checkout, idempotência e recuperação](10-cart-and-checkout.md#pagamento-e-recuperação)                                                                                                                                             | 10             |
| 11    | [Tempo real com Socket.IO](11-realtime-and-socket.md)                                                                                                                                                                               | 4 e 11         |
| 12    | [Responsividade, acessibilidade e feedback](03-components-and-styling.md#reflow-foco-e-mensagens-acessíveis)                                                                                                                        | 12             |
| 13    | [Testes automatizados com Playwright](12-testing.md)                                                                                                                                                                                | 13             |
| 14    | [Medição de desempenho com Lighthouse](13-performance.md)                                                                                                                                                                           | 14             |
| 15    | [Build e publicação](14-deployment.md) e [entrevista técnica e exercícios](15-technical-interview.md)                                                                                                                               | 15             |
