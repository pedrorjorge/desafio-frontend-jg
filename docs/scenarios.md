# Cenários de simulação

## Ativação

Para desenvolvimento, copie `.env.example` para `.env.local` e ajuste `VITE_ENABLE_MOCKS=true`. Use `npm run dev`. Para demonstração, use `npm run build:demo` e `npm run preview`. O modo demo habilita o MSW em `.env.demo`. Ambos os scripts geram a cópia oficial do Service Worker a partir da versão instalada do MSW. Use uma origem segura, como HTTPS ou `localhost`.

Abra o console do navegador depois que a aplicação carregar. `window.kurioMocks` só existe com os mocks ativos. A propriedade `http` é a instância Axios usada pela aplicação. As operações de negócio feitas por ela passam pelo MSW.

```js
const mocks = window.kurioMocks;
await mocks.select("default");
const { data } = await mocks.http.get("/nfts", { params: { page: 2 } });
console.log(data.items, data.totalPages);
```

`await mocks.select(nome)` escolhe o cenário e restaura fixtures, sessões, IDs, relógio, pedidos e contadores. `await mocks.reset()` restaura o cenário atual. Espere operações em curso antes de resetar. Cenário e identidade de visitante sobrevivem ao refresh via `sessionStorage`, enquanto a base usa `localStorage` da origem. Use contextos de navegador isolados para executar cenários em paralelo. O reset é da base compartilhada daquela origem.

## Catálogo e falhas de rede

| Cenário                  | Como reproduzir                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`                | Liste `/nfts` com `page=1` e `page=2`. As 12 fixtures têm categorias, preços e edições diferentes.                                                                                             |
| `slow`                   | Faça uma requisição. O handler espera 1,5 segundo.                                                                                                                                             |
| `out-of-order`           | Dispare dois GET de catálogo sem aguardar o primeiro. O primeiro espera 900 ms e o segundo, 50 ms.                                                                                             |
| `empty`                  | Liste `/nfts`. O catálogo retorna 200 com a lista vazia.                                                                                                                                       |
| `timeout`                | Faça qualquer requisição. O atraso de 11 segundos ultrapassa o timeout de 10 segundos do Axios.                                                                                                |
| `offline`                | Faça qualquer requisição. MSW devolve erro de rede sem status HTTP.                                                                                                                            |
| `http-400` ou `http-500` | Faça qualquer requisição e verifique o status e o corpo tipado.                                                                                                                                |
| `conflict`               | Envie um cadastro e observe 409 com erro no e-mail.                                                                                                                                            |
| `expired-session`        | Faça login e depois consulte `/auth/session`. A sessão já é considerada expirada e a API retorna `401 SESSION_EXPIRED`. No cenário padrão, avance o relógio para expirar uma sessão existente. |

## Falha de favoritos

Selecione `favorite-error`, recarregue a página e entre como Ana. Tente favoritar outro NFT ou remover Raposa Âmbar. O ícone muda imediatamente e volta à seleção anterior quando a gravação retorna 500. O catálogo e a leitura de favoritos continuam funcionando. Volte a `default` e autentique novamente para testar o sucesso.

## Preço e estoque com o carrinho aberto

1. Selecione `default`, adicione Raposa Âmbar, edição Padrão, e abra o carrinho.
2. Execute `await window.kurioMocks.http.patch("/__mock/nfts/exemplo/editions/standard", { price: "0.09" })`. Use **Atualizar cotação** ou aguarde a próxima leitura periódica. O item indica alteração de preço e o resumo busca outra versão.
3. Envie a mesma operação com `{ available: 0 }`. A API recusa uma nova cotação por falta de estoque. Remova a linha para liberar o carrinho. Com estoque acima de zero, a interface também permite ajustar para o limite disponível.
4. Para testar falha, selecione `offline` e recarregue. Volte a `default` para tentar novamente. A seleção de cenário também restaura os itens da base.

Para reproduzir conflito de mesclagem, entre como Ana no cenário padrão e adicione cinco unidades de Raposa Âmbar, edição Padrão. Saia e adicione quatro como visitante. Entre novamente como Ana e abra o carrinho. A linha deve exibir seis unidades e um aviso de que seis de nove foram mantidas. Sair e entrar novamente não repete a adição.

## Conta, cupom e pedido

Para recusar apenas a conexão da carteira, selecione `wallet-declined`, recarregue, entre como Ana, adicione um item e abra o checkout. **Conectar carteira** mostra a recusa do MSW e mantém a revisão bloqueada. No cenário padrão, **Desconectar carteira** também bloqueia a revisão e apaga a confirmação dos valores.

| Conta fictícia       | Senha fictícia   |
| -------------------- | ---------------- |
| `ana@example.test`   | `DemoAna!2026`   |
| `bruno@example.test` | `DemoBruno!2026` |

Use `KURIO10` para desconto, `VENCIDO` para cupom expirado e `INVALIDO` ou `INEXISTENTE` para cupom inválido. Para simular alteração de preço ou esgotamento depois da cotação, envie `PATCH /__mock/nfts/exemplo/editions/standard` com `{ price: "0.09" }` ou `{ available: 0 }`. Esse endpoint existe apenas no mock.

```js
await mocks.select("order-timeout");
const { http } = mocks;
await http.post("/auth/login", {
  email: "ana@example.test",
  password: "DemoAna!2026",
});
await http.post("/cart/items", {
  nftId: "exemplo",
  editionId: "standard",
  quantity: 1,
});
const { data: quote } = await http.post("/quotes");
const payload = {
  quoteId: quote.id,
  walletId: "wallet-ana-primary",
  network: "ethereum",
  collector: { name: "Ana Demo", email: "ana@example.test" },
};
const config = {
  headers: { "Idempotency-Key": "demo-attempt-1" },
  timeout: 250,
};
try {
  await http.post("/orders", payload, config);
} catch (error) {
  console.log(error.message);
}
await mocks.advanceClock(2000);
const { data: order } = await http.post("/orders", payload, config);
console.log(order.id, order.status, order.receipt);
```

O primeiro envio grava o pedido e simula atraso na resposta. O segundo recupera o mesmo ID. É possível fazer refresh entre os envios, desde que se reaproveite o corpo e a chave. Para recusa, selecione `order-declined` no início. Para confirmação com resposta imediata da criação, use `default`. Observe o pedido pendente e consulte `GET /orders/:orderId` após avançar o relógio.

## Tempo real

O [roteiro de eventos](events.md#reproduzir-no-navegador) cobre alteração no checkout, interrupção, recuperação, duplicatas e versões antigas.

## Prova Socket.IO no navegador

1. Ative os mocks em dev. Abra o console e execute `await window.kurioMocks.select("default")`.
2. Execute `await window.kurioMocks.probe()`. A função usa Axios para consultar o NFT, conecta o cliente Socket.IO para receber o primeiro evento, altera o preço via REST e abre uma segunda conexão. Ela compara a nova versão do evento com a leitura REST.
3. Repita com `npm run build:demo` e `npm run preview`. Em ambos os casos, a prova deve retornar dois eventos para `exemplo`, com versão crescente.

A combinação proposta fixa MSW em 2.13.3 e usa Socket.IO Client 4.8.x. Com essa versão do MSW, `ws.link` recebe apenas a URL. A integração usa o WebSocket interceptado na rota de transporte `/kurio-realtime/` e o subconjunto Engine.IO v4 e Socket.IO v5 necessário para a prova, incluindo handshake, ping/pong e eventos de texto no namespace raiz. Polling, namespaces personalizados, binários e acknowledgements ficam fora desse recorte. Uma verificação em Node confirmou a interceptação REST pelo MSW e a troca de frames WebSocket após alteração de preço. A validação com `socket.io-client` no navegador e no build permanece pendente porque o registro npm não pôde ser acessado neste ambiente. [API WebSocket do MSW](https://mswjs.io/docs/api/ws) · [Engine.IO](https://socket.io/docs/v4/engine-io-protocol/) · [Socket.IO](https://socket.io/docs/v4/socket-io-protocol/)

## Limites de segurança e persistência

Use somente dados fictícios. A base é editável em DevTools e não deve ser tratada como um limite de autorização confiável. Senhas fictícias submetidas são verificadas com PBKDF2 SHA-256 e salt. A base guarda o verificador e o salt, sem armazenar a senha. As credenciais de demonstração acima são públicas.

O mock usa Web Locks para serializar atualizações quando disponíveis. Se o armazenamento local falhar, a página mantém uma cópia em memória e pode perder alterações ao recarregar. Quando Web Locks estiver indisponível, a fila de escrita é válida apenas para a aba. Abas abertas com `opener` podem herdar `sessionStorage`. Use contextos separados para verificar isolamento entre contas.
