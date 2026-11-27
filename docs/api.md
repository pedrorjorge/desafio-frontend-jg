# Contratos REST

A instância Axios usa `VITE_API_BASE_URL` ou `/api` e timeout de 10 segundos. As rotas neste documento são relativas a essa base. Os tipos compartilhados estão em [src/types/api.ts](../src/types/api.ts). Envie corpos JSON. Respostas 204 têm corpo vazio.

## Catálogo

| Método e rota      | Entrada              | Sucesso                                         |
| ------------------ | -------------------- | ----------------------------------------------- |
| `GET /nfts`        | Parâmetros abaixo    | 200 com `CatalogPage`                           |
| `GET /nfts/:nftId` | Identificador do NFT | 200 com `NftDetail`, edições, coleção e galeria |

| Parâmetro               | Valores                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `q`                     | Busca textual por nome ou descrição, sem distinção de maiúsculas e acentos                                                         |
| `category`              | Repita a chave para combinar categorias, por exemplo `category=retratos&category=paisagens`                                        |
| `minPrice`, `maxPrice`  | Strings decimais em ETH, inclusive. O mínimo deve ser menor ou igual ao máximo                                                     |
| `available`, `featured` | Texto `true` ou `false`. O filtro de disponibilidade e os limites de preço incidem sobre a mesma edição                            |
| `sort`                  | `featured` (padrão), `price-asc`, `price-desc` ou `name`. Ordenação de preço usa o menor preço das edições que atendem aos filtros |
| `page`, `pageSize`      | Página inicial 1 e tamanho padrão 6. Tamanho permitido de 1 a 48                                                                   |

`CatalogPage` contém `items`, `page`, `pageSize`, `total` e `totalPages`. Uma página além do fim retorna lista vazia. O item da listagem inclui `listingPrice`, o menor preço entre as edições que atendem aos parâmetros da consulta. Cada edição tem ID dentro do NFT, nome, preço e quantidade disponível. O NFT carrega sua própria versão.

O detalhe acrescenta `collection: { id, name, description }` e `gallery` ao objeto base. Cada entrada da galeria contém `id`, `label`, `src`, `alt` e `framing` (`full` ou `detail`). A galeria tem pelo menos uma imagem. O item base segue disponível nos eventos do mock. A página de detalhe consulta NFTs relacionados pelo filtro de categoria da listagem e exclui o NFT aberto.

## Conta e sessão

| Método e rota              | Corpo                                                             | Sucesso                        |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| `POST /auth/register`      | `name`, `email`, `password`                                       | 201 com `Session`              |
| `POST /auth/login`         | `email`, `password`                                               | 200 com `Session`              |
| `GET /auth/session`        | Vazio                                                             | 200 com `Session`              |
| `POST /auth/logout`        | Vazio                                                             | 204                            |
| `GET /profile`             | Vazio                                                             | 200 com `Profile`              |
| `PATCH /profile`           | `name`, `email`, `avatarUrl`, `username`, `ens`, `walletNickname` | 200 com `Profile`              |
| `PUT /profile/password`    | `currentPassword`, `newPassword`                                  | 204                            |
| `GET /wallets`             | Vazio                                                             | 200 com `Wallet[]`             |
| `POST /wallets`            | `WalletInput`                                                     | 201 com `Wallet`               |
| `PATCH /wallets/:walletId` | `WalletInput`                                                     | 200 com `Wallet`               |
| `GET /favorites`           | Vazio                                                             | 200 com `{ nftIds: string[] }` |
| `PUT /favorites/:nftId`    | Vazio                                                             | 200 com `{ nftIds: string[] }` |
| `DELETE /favorites/:nftId` | Vazio                                                             | 200 com `{ nftIds: string[] }` |

A sessão contém `id`, `user`, `expiresAt` e `expiresInMs`. O ID identifica o ciclo da sessão simulada no Socket.IO. A duração restante usa o relógio do mock e permite programar a revalidação sem comparar diretamente o relógio simulado com o do navegador. O mock associa a identidade da aba à sessão, que expira após uma hora no relógio simulado. Perfil, carteiras, favoritos e pedidos exigem sessão válida. O avatar aceita `null` ou uma data URL de PNG, JPEG ou WebP até 512 KiB de arquivo. O handler valida tamanho, formato e assinatura binária. As requisições da interface ligam a operação à conta esperada com `X-Kurio-Account`. O mock compara esse valor à sessão ativa, que continua sendo a autoridade de autorização.

O perfil guarda nome de exibição, usuário, e-mail, ENS e apelido de carteira. O ENS usa o formato `exemplo.eth`. `WalletInput` contém `slot`, `name` (apelido), `displayName`, `network`, `profileName`, `address`, `secondaryReference` (opcional no formulário, string vazia quando ausente), `walletType`, `referralCode`, `email` e `ens`. A rede é `ethereum` ou `polygon`. O tipo é `browser`, `mobile` ou `hardware`. Há uma carteira em cada espaço, `primary` e `secondary`, e o endereço fictício tem prefixo `0x` e 40 dígitos hexadecimais. Nenhuma operação conecta uma carteira real.

Favoritos são lidos como IDs e os métodos PUT e DELETE são idempotentes. Para favoritos visíveis, a aplicação usa o contrato público de detalhe para carregar arte e preço. No cenário `favorite-error`, a leitura funciona e a gravação retorna 500.

## Carrinho, cupons e cotações

| Método e rota                | Corpo                                                | Sucesso                                                                 |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET /cart`                  | Vazio                                                | 200 com `Cart`                                                          |
| `POST /cart/items`           | `nftId`, `editionId`, `quantity`                     | 201 para nova linha ou 200 para acumular em linha existente, com `Cart` |
| `PATCH /cart/items/:itemId`  | `quantity`                                           | 200 com `Cart`                                                          |
| `DELETE /cart/items/:itemId` | Vazio                                                | 200 com `Cart`                                                          |
| `PUT /cart/coupon`           | `code`                                               | 200 com `Cart`                                                          |
| `DELETE /cart/coupon`        | Vazio                                                | 200 com `Cart`                                                          |
| `POST /quotes`               | Sem corpo. Cabeçalho opcional `X-Kurio-Cart-Version` | 201 com `Quote`                                                         |

Use o `id` da linha retornada, como `exemplo~standard`. Quantidades são inteiros positivos. O carrinho retorna `version`, `items`, `couponCode` e `mergeConflicts`. Cada linha traz imagem, preço atual, total calculado da linha e `priceChanged` em relação ao preço de inclusão. A versão muda quando as linhas, quantidades, preços, estoque ou cupom mudam.

No login ou cadastro, os itens do visitante são incorporados à conta uma vez. Para a mesma edição, o mock soma as quantidades e mantém até a disponibilidade atual. `mergeConflicts` registra NFT, edição e quantidades solicitadas e aceitas. O cupom da conta tem prioridade, e o carrinho visitante é consumido. O cabeçalho `X-Kurio-Account` pode indicar o ID esperado ou `visitor`. Uma requisição atrasada com escopo incompatível não grava no novo carrinho.

A cotação retorna `id`, `version` (a versão do carrinho), `items`, `couponCode`, `subtotal`, `discount`, `networkFee`, `total`, `expiresAt` e `expiresInMs`. Enviar `X-Kurio-Cart-Version` impede cotar uma versão diferente daquela que a interface está exibindo. Divergências retornam `409 STALE_QUOTE`. A validade é de cinco minutos. A taxa inicial é `0.001` ETH para carrinho com itens. O cálculo usa Decimal.js e arredondamento half-up para até 18 casas decimais. O transporte usa strings sem notação exponencial.

## Pagamento simulado

`POST /checkout/wallet-connection` valida sessão, propriedade da carteira e rede. Recebe `walletId` e `network`. Retorna 204 quando a conexão simulada é aceita, 403 para carteira fora da conta ou 409 no cenário `wallet-declined`. A conexão é efêmera no checkout. Desconectar ou alterar carteira ou rede limpa a conexão e exige nova revisão.

## Pedidos

| Método e rota                  | Entrada                                                                                               | Sucesso                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `POST /orders`                 | Cabeçalho `Idempotency-Key` e JSON com `quoteId`, `walletId`, `network`, `collector: { name, email }` | 201 com novo `Order` ou 200 com o mesmo pedido em reenvio |
| `GET /orders/pending`          | Sessão da conta                                                                                       | 200 com pedido pendente ou `null`                         |
| `GET /orders/:orderId`         | Identificador do pedido                                                                               | 200 com `Order`                                           |
| `GET /orders/:orderId/receipt` | Identificador do pedido                                                                               | 200 com `Receipt` para pedido confirmado                  |

As redes simuladas são `ethereum` e `polygon`. O mock revalida estoque, cupom e a composição da cotação no envio. Chave e corpo normalizado iguais para a mesma conta recuperam o pedido antes de uma nova validação de cotação. Chave igual com conteúdo diferente retorna conflito. A chave é obrigatória e tem até 120 caracteres.

O pedido começa `pending` e reserva estoque. Uma operação de comércio após 1,5 segundo consolida o estado `confirmed` ou `declined`. A recusa devolve estoque, e a confirmação desconta do carrinho apenas as unidades compradas. O recibo guarda os valores e os dados da compra original. As referências de transação e exploração são fictícias.

## Erros

O corpo de erro contém `code`, `message` e opcionalmente `fields`, indexado pelo nome do campo. Timeouts e falhas de conexão são erros de transporte e podem chegar ao Axios sem resposta HTTP.

| HTTP | Códigos e significado                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR` para JSON malformado, chave ausente ou erro de cenário                                                 |
| 401  | `SESSION_REQUIRED` para visitante, `SESSION_EXPIRED` para sessão vencida ou `INVALID_CREDENTIALS` no login                |
| 403  | `FORBIDDEN` para carteira usada no checkout que não pertence à conta ou conta ativa diferente da esperada pela requisição |
| 404  | `NOT_FOUND` para recurso inexistente ou pedido fora da conta                                                              |
| 409  | `CONFLICT`, `STOCK_CONFLICT`, `STALE_QUOTE` ou `IDEMPOTENCY_CONFLICT`                                                     |
| 422  | `VALIDATION_ERROR`, `INVALID_COUPON` ou `EXPIRED_COUPON`                                                                  |
| 500  | `UNAVAILABLE` no cenário de falha transitória                                                                             |

## Eventos em tempo real

As alterações persistidas podem emitir `nft.updated` e `order.updated`. Consulte os escopos, versões e roteiro de reprodução na [documentação de eventos](events.md).
