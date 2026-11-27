# 15. Entrevista técnica e prática

Use as perguntas para explicar decisões do KURIO com exemplos. Tente responder antes de abrir os arquivos e compare com o código.

## React

### 1. O que é estado local?

**Resposta.** É memória de uma instância de componente.

**Explicação.** O setter agenda outra renderização. Cada instância controla seu próprio valor.

**No KURIO.** A galeria guarda o ID da imagem selecionada. [nft-gallery.tsx](../../src/pages/nft-detail/nft-gallery.tsx)

### 2. Para que serve um provider?

**Resposta.** Disponibiliza uma instância aos componentes descendentes.

**Explicação.** A árvore usa o contexto para encontrar serviços compartilhados.

**No KURIO.** O ponto de entrada fornece QueryClient e Router. [main.tsx](../../src/main.tsx)

### 3. O que é estado derivado?

**Resposta.** É um valor calculado a partir de dados existentes.

**Explicação.** Calcular no render evita duas versões que precisariam ser sincronizadas.

**No KURIO.** A galeria deriva a imagem selecionada pelo ID. [nft-gallery.tsx](../../src/pages/nft-detail/nft-gallery.tsx)

## TypeScript

### 4. Qual o papel do modo strict?

**Resposta.** Detectar usos incompatíveis e valores ausentes durante o desenvolvimento.

**Explicação.** O compilador exige verificação antes de usar um valor que pode estar indefinido.

**No KURIO.** O projeto habilita strict e verifica tipos sem emitir JavaScript. [tsconfig.json](../../tsconfig.json)

### 5. Por que usar uma união para estados do pedido?

**Resposta.** Para representar o conjunto previsto de estados.

**Explicação.** Ao verificar o status, o código pode selecionar o caminho correspondente.

**No KURIO.** Pedido pode estar pendente, confirmado ou recusado. [api.ts](../../src/types/api.ts) · [order-page.tsx](../../src/pages/checkout/order-page.tsx)

### 6. TypeScript valida a resposta recebida em execução?

**Resposta.** Os tipos são verificados na compilação. Validação em execução requer código.

**Explicação.** Uma anotação genérica informa o contrato esperado ao compilador.

**No KURIO.** Schemas Zod validam os corpos que chegam ao handler. [shared.ts](../../src/mocks/handlers/shared.ts)

## Componentização

### 7. Quando extrair um componente?

**Resposta.** Quando há conceito próprio ou repetição significativa.

**Explicação.** Um contrato de props concentra o comportamento e facilita mudar o visual.

**No KURIO.** A exibição de preço é compartilhada entre card e compra. [price-display.tsx](../../src/components/common/price-display.tsx)

### 8. O que é composição por children?

**Resposta.** É receber elementos para inserir em uma estrutura reutilizável.

**Explicação.** Quem monta a página escolhe o conteúdo e o componente fornece o contêiner.

**No KURIO.** EmptyState recebe ações como voltar ao início. [empty-state.tsx](../../src/components/common/empty-state.tsx) · [router.tsx](../../src/routes/router.tsx)

## Tailwind CSS

### 9. Como tokens ligam Tailwind ao tema?

**Resposta.** Variáveis CSS fornecem valores para utilitários.

**Explicação.** Uma variável centraliza decisões de cor e permite consistência entre estados.

**No KURIO.** As cores do botão usam tokens de ação e texto. [globals.css](../../src/styles/globals.css) · [button.tsx](../../src/components/ui/button.tsx)

### 10. Como aplicar mobile first?

**Resposta.** Parta de estilos que cabem na largura menor e adicione regras em breakpoints.

**Explicação.** Classes com prefixo passam a valer na largura configurada.

**No KURIO.** A galeria posiciona miniaturas na lateral a partir de lg. [nft-gallery.tsx](../../src/pages/nft-detail/nft-gallery.tsx)

### 11. O que significa adaptar shadcn/ui localmente?

**Resposta.** Os componentes ficam no próprio código e podem usar os tokens do produto.

**Explicação.** A equipe controla a marcação e as variantes no repositório.

**No KURIO.** Card e Button aplicam os utilitários do tema. [components.json](../../components.json) · [button.tsx](../../src/components/ui/button.tsx)

## Roteamento

### 12. Por que colocar filtros na URL?

**Resposta.** Para compartilhar, recarregar e navegar pelo histórico mantendo o estado.

**Explicação.** A query string representa a seleção visível de catálogo.

**No KURIO.** O Router valida filtros e passa a seleção para a Home. [catalog-search.ts](../../src/routes/catalog-search.ts) · [router.tsx](../../src/routes/router.tsx)

### 13. Qual a diferença entre parâmetro de caminho e de busca?

**Resposta.** Caminho identifica recurso. Busca configura uma consulta.

**Explicação.** O primeiro participa da rota. O segundo é lido da query string.

**No KURIO.** O detalhe usa nftId, e o catálogo usa q e page. [router.tsx](../../src/routes/router.tsx) · [catalog-search.ts](../../src/routes/catalog-search.ts)

### 14. Como proteger uma rota privada?

**Resposta.** Verifique a sessão antes de entrar e durante seu ciclo de vida.

**Explicação.** Uma sessão pode expirar depois que o componente já montou.

**No KURIO.** A rota privada redireciona para login com destino interno validado. [router.tsx](../../src/routes/router.tsx) · [auth-search.ts](../../src/routes/auth-search.ts)

## REST

### 15. O que representa o status 409?

**Resposta.** Um conflito com o estado corrente ou com uma operação anterior.

**Explicação.** O cliente precisa ajustar a tentativa conforme a causa específica.

**No KURIO.** Uma chave de pedido reutilizada com outro corpo gera conflito. [commerce.ts](../../src/mocks/handlers/commerce.ts)

### 16. Quando usar 201 ou 204?

**Resposta.** 201 indica criação e 204 indica sucesso sem corpo.

**Explicação.** O consumidor sabe se deve ler uma representação ou apenas verificar o sucesso.

**No KURIO.** Criar carteira retorna 201 e encerrar a sessão retorna 204. [account.ts](../../src/mocks/handlers/account.ts)

## Axios

### 17. Por que criar uma instância Axios?

**Resposta.** Para compartilhar URL base, timeout e serialização.

**Explicação.** Cada serviço descreve a operação sem repetir configurações de transporte.

**No KURIO.** Listagem e detalhe usam a mesma base padrão /api. [api.ts](../../src/services/api.ts) · [catalog.ts](../../src/services/catalog.ts)

### 18. Como cancelar uma consulta obsoleta?

**Resposta.** Passe um AbortSignal até a requisição.

**Explicação.** O cliente pode interromper a operação quando o observador muda de consulta.

**No KURIO.** A busca propaga o sinal da Query ao Axios. [use-catalog.ts](../../src/hooks/use-catalog.ts) · [catalog.ts](../../src/services/catalog.ts)

### 19. O que diferencia timeout de resposta HTTP de falha?

**Resposta.** No timeout pode faltar uma resposta HTTP utilizável.

**Explicação.** Timeout significa que o cliente perdeu a resposta dentro do prazo. A operação remota pode ter sido concluída.

**No KURIO.** No cenário de pedido, o handler já gravou antes de atrasar a resposta. [api.ts](../../src/services/api.ts) · [commerce.ts](../../src/mocks/handlers/commerce.ts)

## TanStack Query

### 20. O que deve entrar na query key?

**Resposta.** A identidade do recurso e as entradas que mudam o resultado.

**Explicação.** Uma chave completa separa páginas e usuários no cache.

**No KURIO.** O catálogo inclui filtros, ordenação e paginação nos parâmetros da chave. [use-catalog.ts](../../src/hooks/use-catalog.ts)

### 21. O que significa invalidar uma query?

**Resposta.** Marcar o dado como desatualizado para reconciliar com a fonte.

**Explicação.** Leituras ativas podem buscar uma nova versão conforme a política de refetch.

**No KURIO.** Uma mudança de NFT invalida as consultas afetadas. [reconcile-realtime.ts](../../src/lib/reconcile-realtime.ts)

### 22. Como funciona rollback otimista?

**Resposta.** Guarde o snapshot e restaure-o se a gravação falhar.

**Explicação.** A experiência é imediata e ainda pode voltar ao estado anterior.

**No KURIO.** Favoritos cancelam leituras, atualizam o cache e revertem em erro. [use-favorites.ts](../../src/hooks/use-favorites.ts)

## MSW

### 23. Onde o MSW intercepta?

**Resposta.** Na fronteira de rede do navegador, com handlers da simulação.

**Explicação.** O serviço continua emitindo a requisição real que usaria com uma API.

**No KURIO.** O bootstrap inicia o worker antes de montar o Router. [main.tsx](../../src/main.tsx) · [browser.ts](../../src/mocks/browser.ts)

### 24. Por que resetar as fixtures em testes?

**Resposta.** Para começar sempre de dados e contadores conhecidos.

**Explicação.** Isso reduz dependência da ordem dos testes e facilita reproduzir falhas.

**No KURIO.** O seletor de cenário restaura a base e o teste navega com o cenário escolhido. [index.ts](../../src/mocks/scenarios/index.ts) · [fixtures.ts](../../tests/e2e/fixtures.ts)

## Autenticação

### 25. Qual a diferença entre autenticar e autorizar?

**Resposta.** Autenticar determina a identidade e autorizar verifica acesso ao recurso.

**Explicação.** A sessão pode ser válida e ainda assim pertencer a outra conta.

**No KURIO.** A leitura de pedidos usa a conta atual para selecionar o pedido. [shared.ts](../../src/mocks/handlers/shared.ts) · [commerce.ts](../../src/mocks/handlers/commerce.ts)

### 26. O que deve acontecer ao trocar de conta?

**Resposta.** Cancelar e remover dados privados do ciclo encerrado.

**Explicação.** Isso evita que resultados tardios atualizem dados da próxima sessão.

**No KURIO.** A política de sessão aborta o sinal antigo e retira o prefixo privado do cache. [session.ts](../../src/lib/session.ts)

### 27. Por que a sessão do KURIO é apenas demonstrativa?

**Resposta.** O usuário controla o armazenamento e o código no próprio navegador.

**Explicação.** As verificações reproduzem o comportamento do produto em uma base editável.

**No KURIO.** O mock persiste a base local e usa verificadores de senhas fictícias. [database.ts](../../src/mocks/database.ts) · [shared.ts](../../src/mocks/handlers/shared.ts)

## Formulários

### 28. Como React Hook Form e Zod se complementam?

**Resposta.** Um gerencia o formulário e o outro valida seu formato.

**Explicação.** O resolver traduz os erros do schema em erros do formulário.

**No KURIO.** Login e cadastro compartilham a mesma composição de campos. [auth-form.tsx](../../src/components/auth/auth-form.tsx)

### 29. Por que validar no formulário e no handler?

**Resposta.** O formulário dá feedback cedo. O handler protege o contrato.

**Explicação.** A operação de rede pode ser chamada por outro consumidor.

**No KURIO.** O perfil aplica o schema na tela e na camada simulada. [profile-page.tsx](../../src/pages/account/profile-page.tsx) · [account.ts](../../src/mocks/handlers/account.ts) · [account-schema.ts](../../src/lib/account-schema.ts)

## Carrinho

### 30. Por que identificar uma linha por NFT e edição?

**Resposta.** O mesmo NFT pode ter preço e estoque diferentes por edição.

**Explicação.** Somar apenas por NFT misturaria linhas independentes.

**No KURIO.** O mock forma os IDs pelo par e mescla por disponibilidade. [cart.ts](../../src/mocks/cart.ts)

### 31. Por que valores ETH viajam como strings?

**Resposta.** Para preservar casas decimais no transporte e no cálculo.

**Explicação.** O tipo number usa representação binária e pode perder precisão decimal.

**No KURIO.** O mock calcula a cotação com Decimal.js e devolve strings. [cart.ts](../../src/mocks/cart.ts) · [api.ts](../../src/types/api.ts)

### 32. Por que usar a cotação da API no resumo?

**Resposta.** Ela representa o preço e as regras que serão revalidados na compra.

**Explicação.** Taxa, cupom, quantidade e estoque podem mudar entre telas.

**No KURIO.** O checkout exige revisar o mesmo ID mostrado no resumo. [checkout-page.tsx](../../src/pages/checkout/checkout-page.tsx)

## Idempotência

### 33. O que torna uma tentativa idempotente?

**Resposta.** A mesma chave com o mesmo corpo recupera a operação anterior.

**Explicação.** Em caso de timeout, repetir a tentativa evita criar outra compra.

**No KURIO.** O handler procura pela chave no escopo da conta antes de criar o pedido. [commerce.ts](../../src/mocks/handlers/commerce.ts)

### 34. Como manter uma tentativa após refresh?

**Resposta.** Persista os dados necessários para reenviar a mesma operação.

**Explicação.** Guarde chave, corpo e ID conhecido no escopo apropriado.

**No KURIO.** O checkout persiste a tentativa no sessionStorage por usuário. [order-attempt.ts](../../src/pages/checkout/order-attempt.ts)

### 35. Quando limpar o carrinho?

**Resposta.** Ao confirmar, remova somente os itens e quantidades comprados.

**Explicação.** Pendência e recusa preservam a possibilidade de tentar novamente.

**No KURIO.** A resolução do pedido cria o recibo e ajusta o carrinho ao confirmar. [orders.ts](../../src/mocks/orders.ts)

## Socket.IO

### 36. WebSocket e Socket.IO são equivalentes?

**Resposta.** WebSocket transporta mensagens. Socket.IO acrescenta seu protocolo e comportamento de conexão.

**Explicação.** Os dois lados precisam entender o handshake e os eventos do protocolo.

**No KURIO.** O cliente usa WebSocket e o mock interpreta frames de texto Engine.IO e Socket.IO. [socket.ts](../../src/services/socket.ts) · [socket.ts](../../src/mocks/handlers/socket.ts)

### 37. Como descartar um evento antigo?

**Resposta.** Compare a versão do recurso com a maior já observada.

**Explicação.** Versões iguais indicam duplicata e versões menores podem regredir o estado.

**No KURIO.** O controle mantém versões de NFTs e pedidos separadas. [live-versions.ts](../../src/lib/live-versions.ts)

### 38. Por que consultar REST depois da reconexão?

**Resposta.** Para obter o estado atual dos recursos ativos.

**Explicação.** O cliente pode ter perdido mensagens enquanto estava desconectado.

**No KURIO.** A conexão reconcilia catálogo, carrinho, cotação e pedidos relevantes. [realtime-connection.tsx](../../src/components/layout/realtime-connection.tsx) · [reconcile-realtime.ts](../../src/lib/reconcile-realtime.ts)

## Testes

### 39. O que caracteriza um teste E2E?

**Resposta.** Exercitar o fluxo observando a aplicação pela interface.

**Explicação.** Asserções de rede podem complementar o resultado visível.

**No KURIO.** A compra verifica a tela de recibo e o pedido retornado pela API. [commerce.spec.ts](../../tests/e2e/commerce.spec.ts)

### 40. Como deixar um teste determinístico?

**Resposta.** Controle dados iniciais e fontes de variação que interferem no resultado.

**Explicação.** Prefira aguardar um estado observável a inserir pausas fixas.

**No KURIO.** A fixture usa relógio fixo e reset por teste. [fixtures.ts](../../tests/e2e/fixtures.ts)

### 41. O que é uma baseline visual?

**Resposta.** Uma captura de referência aprovada para comparação.

**Explicação.** Navegador, tamanho de tela e fixtures influenciam os pixels.

**No KURIO.** A suíte configura quatro páginas e dois projetos. As capturas aprovadas seguem pendentes. [screens.spec.ts](../../tests/visual/screens.spec.ts) · [playwright.config.ts](../../playwright.config.ts)

## Performance

### 42. O que o LCP mede?

**Resposta.** O tempo para exibir o maior conteúdo elegível da área visível.

**Explicação.** Descoberta tardia, download e renderização afetam o resultado.

**No KURIO.** A obra principal da galeria recebe prioridade de busca alta. [nft-gallery.tsx](../../src/pages/nft-detail/nft-gallery.tsx)

### 43. Para que declarar dimensões da imagem?

**Resposta.** Para informar a proporção antes do download.

**Explicação.** O layout pode reservar espaço e reduzir deslocamentos inesperados.

**No KURIO.** As dimensões representam os WebP e o CSS controla o recorte. [hero-banner.tsx](../../src/pages/home/hero-banner.tsx)

### 44. Por que reportar a mediana de três rodadas?

**Resposta.** Para reduzir a influência de variações ocasionais.

**Explicação.** Ordene os valores para cada métrica e escolha o valor do meio.

**No KURIO.** A auditoria calcula a mediana por página e perfil. [audit-lighthouse.js](../../scripts/audit-lighthouse.js)

## Arquitetura

### 45. Por que separar página, hook e serviço?

**Resposta.** Cada camada responde por composição, estado remoto ou transporte.

**Explicação.** A página pode focar na experiência e reaproveitar consultas e operações.

**No KURIO.** A Home usa o hook de catálogo, que chama a camada Axios. [home-page.tsx](../../src/pages/home-page.tsx) · [use-catalog.ts](../../src/hooks/use-catalog.ts) · [catalog.ts](../../src/services/catalog.ts)

### 46. Qual camada deve guardar regras da simulação?

**Resposta.** Handlers e módulos de domínio dos mocks.

**Explicação.** A UI usa os mesmos contratos e falhas que usaria com uma API.

**No KURIO.** As regras de cupom e estoque ficam no mock de comércio. [commerce.ts](../../src/mocks/handlers/commerce.ts)

## Dez exercícios progressivos

1. **Inicial** — adicione um teste de formatação que cubra um valor em ETH com 18 casas. Defina como observar a precisão.
2. **Inicial** — adapte o estado vazio do catálogo para orientar o visitante com os filtros ativos. Confira o foco após limpar os filtros.
3. **Inicial** — adicione uma verificação de teclado para abrir e fechar o drawer de filtros. Observe onde o foco retorna.
4. **Básico** — exercite filtros combinados com uma página fora do intervalo. Registre o estado escolhido para a URL e para a tela.
5. **Básico** — escreva um teste para a tentativa de salvar um avatar com tipo e assinatura incompatíveis. Verifique o erro no campo.
6. **Intermediário** — cubra cadastro e edição de carteira secundária em mobile, com refresh. Inclua falha de validação e verifique que a principal continua intacta.
7. **Intermediário** — provoque expiração da sessão durante o checkout. Faça um teste que preserve itens e destino, e verifique a exigência de nova revisão.
8. **Avançado** — provoque atraso em uma leitura concorrente com um evento mais recente. Confirme que catálogo, detalhe e cotação permanecem consistentes.
9. **Avançado** — teste reenvio de uma chave de idempotência com outro corpo e verifique a ausência de uma segunda compra.
10. **Avançado** — meça o custo inicial dos chunks do build demo e compare um experimento de divisão de rotas com a referência. Registre resultados e impactos na navegação.
