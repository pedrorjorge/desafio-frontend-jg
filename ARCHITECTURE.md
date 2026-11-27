# Arquitetura do KURIO

## Visão geral e responsabilidades

React monta a SPA depois que o MSW inicia no modo de demonstração. O TanStack Router escolhe a página e controla acesso e parâmetros. Os hooks usam TanStack Query para consultar e mutar recursos. Os serviços acessam REST pelo Axios e a conexão pelo Socket.IO Client. Tipos compartilhados definem os contratos, e schemas Zod verificam entradas. A simulação mantém regras de negócio e persistência nos handlers e na base de mocks.

A fase de interação fica no estado local, como edição selecionada, galeria, formulário, rede e estado de conexão fictícia. O Router mantém seleção navegável, como filtros e página do catálogo. O QueryClient mantém dados remotos, sessão e invalidações. O armazenamento do mock persiste a base, enquanto a UI guarda apenas a tentativa de pedido por usuário para sobreviver ao refresh.

## Fundação visual

O [enunciado](docs/reference/challenge.md) define os fluxos e requisitos. A [referência visual](docs/reference/design.webp) orienta a composição. O arquivo de referência tem extensão `.webp`, mas contém um PNG de 8000 × 7453. Ele reúne frames desktop e mobile, sem camadas exportáveis, famílias tipográficas, tokens ou medidas do Figma. A faixa de tablet e as telas mobile sem frame próprio usam adaptações dessa composição.

| Decisão     | Aplicação                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paleta      | Fundo `#140D0A`, painel `#241612`, superfície elevada `#38220F` e ação `#D28A4C` são amostras aproximadas. Texto, foco, bordas, hover e erro foram ajustados para legibilidade.                                                                 |
| Tipografia  | `Courier New` com fallback monoespaçado aproxima a aparência dos títulos. O texto usa a fonte de sistema com fallback sans-serif. A escolha evita downloads nesta etapa.                                                                        |
| Dimensões   | O container tem largura máxima de `75rem` e margens internas fluidas. Os controles têm altura mínima de `2.75rem`. Os raios de controle e painel são `0.375rem` e `0.75rem`.                                                                    |
| Navegação   | A barra inferior é fixa abaixo de `md` e o layout reserva sua altura, incluindo a área segura do dispositivo. A partir de `md` (48rem, normalmente 768 px), a navegação fica no cabeçalho e o destaque usa duas colunas.                        |
| Interação   | Foco com contorno visível, hover por variante e controles desativados com atributo nativo. O skeleton tem forma estática por padrão e habilita o shimmer apenas com `prefers-reduced-motion: no-preference`.                                    |
| Componentes | Card e Button seguem a composição local do shadcn/ui com classes adaptadas aos tokens do KURIO. A folha global prepara o tratamento visual dos campos nativos. Formulários usam controles nativos, e diálogos e drawers usam o elemento dialog. |

Os tokens ficam em [globals.css](src/styles/globals.css).

## Assets e substituições

- As artes dos NFTs da referência aparecem dentro do raster. O repositório não contém exportações individuais. O destaque usa [Raposa Âmbar](src/assets/amber-fox.webp), ilustração original gerada para a demonstração e convertida em WebP local. Ela não depende de banco de imagens, CDN, fonte remota ou recorte dos frames.
- A marca no cabeçalho e no rodapé é composta com texto e a fonte de título. A navegação usa rótulos textuais, que permanecem compreensíveis por teclado e leitor de tela.

## Integração simulada

O Axios é o cliente REST. O MSW é inicializado antes de montar as rotas quando `VITE_ENABLE_MOCKS=true`. Os handlers usam contratos tipados e validam entradas com Zod. A base persistida compartilha catálogo, carrinho, sessões, cotações e pedidos. As regras de autorização são parte da simulação, com escopo por conta e visitante. Os detalhes e limites estão documentados nos [contratos](docs/api.md) e [cenários](docs/scenarios.md).

A prova Socket.IO mantém o cliente do protocolo e usa o WebSocket do MSW 2.13.3. O handler implementa apenas os frames de handshake, heartbeat, fechamento e mensagens de texto no namespace raiz. O endpoint de controle altera o banco por REST e a conexão de prova lê a versão persistida. Essa escolha usa a API de interceptação disponível na versão consultada. Os eventos de negócio usam esse mesmo transporte. A reconexão dispara consultas REST dos recursos ativos.

## Home e cache do catálogo

A Home usa duas consultas a `GET /nfts`. A primeira usa busca, filtros, ordenação e paginação validados pelo TanStack Router. A segunda usa parâmetros fixos de destaque e alimenta a arte do banner, a vitrine e as faixas promocionais. Os CTAs promocionais aplicam filtros reais. Os links do rodapé levam a rotas do projeto.

| Política     | Catálogo                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chave        | `["nfts", "catalog", queryParams]`, incluindo página, tamanho, ordem e filtros validados.                                                                      |
| Validade     | `staleTime` de 30 segundos. Refetch de consultas desatualizadas na montagem, no foco da janela ou na reconexão.                                                |
| Retenção     | `gcTime` de cinco minutos após perder o último observador. Cache em memória. A URL preserva a seleção após refresh.                                            |
| Cancelamento | O `AbortSignal` do TanStack Query vai até o Axios. Respostas pertencem à chave que as solicitou.                                                               |
| Retry        | Uma repetição automática com 750 ms de espera para erros de rede ou timeout do Axios, HTTP 408, 429 e 5xx. Cancelamentos e demais erros seguem para a UI.      |
| Atualização  | Dados existentes da mesma chave ficam visíveis durante o refetch. A primeira consulta sem cache exibe skeleton. A tela oferece refetch manual em caso de erro. |

A busca é aplicada por envio explícito, via Enter ou botão. A sidebar de desktop reaproveita o formulário do drawer nativo de mobile e tablet, que usa `showModal()` para foco modal e tratamento de Escape. As artes demonstrativas são locais e geradas para o projeto, incluindo [Coruja de Cobre](src/assets/copper-owl.webp) e [Vale de Bronze](src/assets/bronze-valley.webp). As fixtures repetem a seleção de artes em algumas edições. [Guia de TanStack Query](docs/study/07-tanstack-query.md)

## Detalhe do NFT

O endpoint de detalhe acrescenta coleção e galeria ao NFT base. As fixtures fornecem uma vista completa e um recorte ampliado da mesma arte local, pois a referência não inclui exportações separadas de cada vista. A galeria fica ao lado das informações a partir de tablet e as miniaturas passam à lateral no desktop. Os relacionados vêm da listagem da mesma categoria, excluindo o item aberto.

O detalhe usa chave própria por ID, com a política de cache e retry do catálogo. O painel deriva a quantidade exibida do estoque mais recente e reinicia a seleção de quantidade quando a edição muda. O detalhe integra favoritos e adição ao carrinho.

## Sessão e proteção de rotas

O TanStack Query mantém a sessão em `["auth", "session"]`. O login, cadastro e logout usam mutations serializadas e o cache é reidratado consultando `GET /auth/session`. Um observador revalida uma sessão ativa em até 30 segundos ou próximo ao vencimento, além do foco e da reconexão. Falha transitória preserva o resultado conhecido até o vencimento. O Router verifica a sessão ao entrar em checkout, perfil, carteiras, favoritos e pedidos. A proteção permanece ativa enquanto a rota está montada.

As queries privadas usam `privateQueryKey(userId, ...partes)`. Login em outra conta, logout confirmado e expiração cancelam e removem o prefixo privado. A transição também aborta o sinal de ciclo de vida usado pelas subscriptions privadas. Respostas tardias de uma identidade anterior são ignoradas pelo interceptor de sessão. O cache público segue ativo.

Entradas de autenticação no desktop abrem um diálogo nativo sobre a página atual quando acionadas no aplicativo. No mobile e no acesso direto a login ou cadastro, as rotas renderizam páginas dedicadas com os mesmos formulários. Se uma sessão expirar enquanto a área privada está montada, o desktop abre o diálogo e o mobile segue para login. O retorno preserva caminho, parâmetros e fragmento válidos. O carrinho visitante é migrado pela API simulada. A tentativa do checkout é guardada por usuário.

A sessão é simulada e vinculada ao visitante no navegador. Ela usa credenciais fictícias e verificadores de senha com salt. A base local é editável e não constitui uma fronteira de segurança de produção. [Contratos](docs/api.md) e [guia de autenticação](docs/study/08-authentication.md)

## Perfil, carteiras e favoritos

Os formulários de perfil e carteiras seguem os campos visíveis nos frames de conta. Em telas estreitas, a navegação lateral passa para cima dos formulários e os campos usam uma coluna. O avatar usa uma data URL local de até 512 KiB, validada pelo formulário e pelo handler, sem envio a serviços externos. As duas carteiras representam espaços simulados com endereços fictícios e metadados da interface.

O cliente vincula consultas e alterações privadas ao ID e ao sinal da sessão. O mock confere o ID esperado contra a sessão ativa, e a troca de conta remove também as mutations privadas do cache. A lista de favoritos é compartilhada entre catálogo, detalhe e conta pela mesma query. Uma gravação por vez cancela a leitura, guarda o snapshot e atualiza os IDs de forma otimista. Falhas restauram o snapshot. O encerramento invalida a consulta para reconciliar com o mock, desde que a sessão ainda esteja ativa.

## Carrinho e cotação

O carrinho é persistido por visitante ou conta. A autenticação consome a entrada visitante e soma as linhas por NFT e edição. Para cada linha mesclada, mantém até o estoque atual e registra as quantidades solicitadas e aceitas em caso de conflito. O cupom da conta tem prioridade. Mutações e leituras ficam vinculadas ao escopo de sessão.

A interface exibe os totais da API. A cotação tem ID, versão do carrinho e validade de cinco minutos. O cliente consulta o carrinho a cada 15 segundos enquanto a página está ativa, além de foco, reconexão e atualização manual. Alterar o snapshot muda a chave da cotação. As chaves `cartKey` e `quotePrefix` permitem invalidar as consultas afetadas quando chegam eventos do Socket.IO. A ação avança para a rota protegida de checkout. Checkout e status usam cotação revisada, tentativa idempotente e recuperação pelo ID do pedido.

## Pedido, idempotência e recuperação

O checkout vincula a conexão fictícia à combinação carteira e rede. A conexão aceita é temporária e a revisão registra o ID da cotação. Desconectar, trocar a seleção ou receber nova cotação exige outra revisão. A submissão guarda chave e corpo em `sessionStorage`, com escopo de usuário. O mock procura a mesma chave por conta antes de validar uma nova compra. Corpo diferente com a mesma chave retorna conflito. O pedido é persistido antes do atraso de timeout. O recibo usa seu snapshot, e apenas a confirmação remove as unidades compradas.

## Persistência, falhas e publicação

O mock guarda a base em `localStorage` e serializa escritas com Web Locks quando disponíveis. Sessão, visitante e cenário dependem do contexto do navegador. Sem armazenamento, a base pode funcionar em memória. Os controles de teste são exclusivos da demonstração e toda informação incluída nela é fictícia. Pedidos e catálogo usam retry limitado para falhas transitórias e snapshots obsoletos. Sessão, conta e carrinho expõem recuperação explícita e dispensam retry automático da leitura. Mutations de compra usam retomada idempotente.

A configuração Vercel publica `dist/` do modo demo. O worker é gerado a partir do MSW instalado. O fallback entrega o HTML da SPA para rotas de navegação e preserva os caminhos de API, assets, worker e transporte. O navegador intercepta API e WebSocket. O deploy e a execução completa em navegador seguem pendentes. [Guia de publicação](docs/study/14-deployment.md) · [Checklist](docs/challenge-checklist.md)

## Tempo real

O mock compara versões após persistir uma transação e publica frames WebSocket compatíveis com Socket.IO na mesma página. O serviço adia a importação do cliente até a inicialização do MSW, pois o transporte captura o construtor WebSocket. O layout vincula a conexão ao ciclo da sessão. O ID da sessão é validado no namespace e nos eventos privados.

O cache mantém a maior versão observada e rejeita respostas atrasadas. Cotação e carrinho são reconciliados nessa ordem lógica, invalidando a cotação, consultando o carrinho e então cotando a versão corrente. O checkout exige confirmar o novo ID da cotação após mudanças. Pedidos são apresentados a partir do REST, com estados terminais preservados. [Eventos e limitações](docs/events.md)

## Revisão das telas contra a referência

A comparação foi feita entre o raster de referência e o código das nove telas. Os frames orientaram a hierarquia e a composição. Os arquivos disponíveis permitem amostrar a paleta e observar proporções. Fonte, espaçamento e dimensões do Figma permanecem aproximados. As artes locais documentadas acima continuam em uso.

| Tela                    | Ajuste ou desvio registrado                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                    | Banner e destaques com arte local, grade reduzida para uma coluna abaixo de 22rem e filtros em drawer antes da sidebar desktop. Faixas promocionais escurecidas atrás do texto. Busca permanece junto do catálogo e as promoções levam a filtros reais. |
| Detalhe                 | Imagem quadrada com miniaturas abaixo em telas estreitas e à esquerda no desktop. O skeleton usa as mesmas células e o painel de informações reserva espaço. A vista ampliada usa o recorte documentado da arte local.                                  |
| Carrinho                | Linhas e resumo lado a lado em telas amplas e empilhados nas menores. A quantidade passa para uma linha própria em larguras abaixo de 23rem. O erro de aplicação do cupom é associado ao campo.                                                         |
| Checkout                | Dados do coletor rotulados, resumo com miniaturas e disposição empilhada em telas estreitas. A revisão anuncia a troca efetiva de cotação. Os controles disponíveis usam dados simulados.                                                               |
| Confirmação             | Recibo central com borda de destaque, miniaturas decorativas quando disponíveis e quebra de identificadores extensos. O título anuncia a mudança de status do pedido. No mobile, o mesmo painel se adapta à largura disponível.                         |
| Login                   | Diálogo com título, foco inicial e rolagem interna no desktop. Página dedicada no mobile e no acesso direto.                                                                                                                                            |
| Cadastro                | O mesmo padrão de diálogo e página do login, com mensagens associadas aos campos. Ações sociais presentes na referência ficam fora do fluxo.                                                                                                            |
| Perfil                  | Barra lateral no desktop e navegação acima do conteúdo em telas menores. O campo de avatar descreve tipos e tamanho aceitos.                                                                                                                            |
| Carteiras               | As duas carteiras mantêm seções distintas. Os campos usam uma coluna em telas estreitas e duas quando há espaço.                                                                                                                                        |
| Estrutura compartilhada | Cabeçalho superior e rodapé com os caminhos em escopo. Barra inferior com estados ativos e espaço reservado, que passa para o fluxo normal quando a altura disponível é de até 26rem.                                                                   |

O layout reposiciona o foco no conteúdo ao mudar de rota. Mudanças apenas de busca ou filtros preservam o foco. Diálogo e drawer usam `showModal()` e devolvem o foco ao acionador quando ele continua visível. O drawer foca o título do catálogo ao fechar por mudança para a largura desktop. O shimmer roda apenas quando há preferência por movimento. Formas decorativas do skeleton ficam ocultas da árvore de acessibilidade e um único anúncio descreve cada bloco em carregamento.

### Evidência e pendências

As regras de breakpoint foram revisadas no código para os alvos de **390, 768 e 1440 px** e para reflow em largura reduzida. O contraste de 13 pares de tokens foi calculado a partir dos valores CSS. Entre os pares verificados, texto sobre o fundo ficou em 16,56:1, texto do botão principal em 6,75:1 e borda de campo sobre painel em 3,14:1. O npm continuou indisponível neste ambiente por falha de DNS. A execução no navegador, as medidas de overflow, a comparação renderizada, a navegação por teclado e zoom real permanecem pendentes. Para fechar a verificação, medir `scrollWidth` nas nove telas em cada viewport, exercitar Tab e Escape nos diálogos e no drawer, repetir com zoom a 200% e simular movimento reduzido e carregamento lento.
