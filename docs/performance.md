# Auditoria de performance

O [script de auditoria](../scripts/audit-lighthouse.js) gera o build otimizado de demonstração, serve o conteúdo pelo Vite Preview em `127.0.0.1:4175` e audita `/` e `/nfts/exemplo`. A execução força MSW ligado e usa o cenário padrão em um perfil novo do Chrome a cada navegação. Deixe a porta 4175 livre e execute o lote sem outros testes em paralelo.

O Lighthouse 12.8.2 usa os perfis nativos mobile e desktop, com limitação simulada, em Chrome headless. São três execuções sequenciais por combinação. O script exige que o relatório registre uma resposta de sucesso da API e a transferência da obra da fixture para aceitar a rodada. Os HTML e JSON individuais preservam os diagnósticos. O resumo JSON registra configuração efetiva, navegador, versões, ambiente, mediana de LCP, CLS e TBT e medianas das categorias comparadas às metas.

| Categoria      | Meta |
| -------------- | ---: |
| Performance    | ≥ 90 |
| Accessibility  | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO            | ≥ 90 |

## Estado das medições

A tentativa local ocorreu em Linux x86-64 no WSL2, kernel 5.15.167.4, com Node 24.21.0, npm 11.19.0 e Google Chrome 148.0.7778.96 instalado. O npm falhou com `EAI_AGAIN` ao resolver o registro. O build de demonstração parou no typecheck por falta do executável `tsc` do projeto. Uma verificação isolada do Vite Preview também encontrou `EPERM` ao abrir a porta 4175 no sandbox. Nenhuma auditoria chegou a iniciar. A versão do Lighthouse acima é a configurada, e as metas seguem sem verificação. Os relatórios serão gerados quando o build e o Lighthouse estiverem disponíveis.

## Inspeção do código

- Os três WebP quadrados de 1254 × 1254 somam 500.538 bytes no código-fonte. Cards, miniaturas e blocos promocionais usam a mesma arte original. Variantes menores merecem avaliação a partir dos bytes transferidos, do tamanho renderizado e da resolução de tela. Uma variante aumenta as opções de download e pode reduzir o reaproveitamento do cache entre as telas.
- Hero e galeria principal mantêm prioridade alta. Como o endereço chega pela API, o navegador só descobre a obra após a resposta. Inspecione a cadeia de requisições do LCP antes de considerar antecipar dados ou imagens. Cards, miniaturas e promoções permitem carregamento tardio. As dimensões intrínsecas agora refletem os arquivos e as proporções CSS preservam o recorte da interface.
- O tema usa fontes locais do sistema, sem transferência de fontes web. Os skeletons reservam espaço para o conteúdo. O relatório de deslocamentos ajuda a verificar se a troca de skeleton pela interface mantém a posição dos elementos.
- O Router importa páginas estaticamente e o bootstrap carrega os mocks via importação dinâmica. O tamanho dos chunks de produção e o tempo de execução de JavaScript ainda precisam ser medidos. Avalie separar páginas privadas caso elas representem custo inicial relevante. Use o profiler do React para investigar renderizações recorrentes antes de introduzir memoização.

Ao obter um lote válido, compare as quatro combinações e revise os relatórios individuais para explicar as medianas abaixo da meta. Use os diagnósticos de rede, imagem e thread principal para ligar cada hipótese a uma evidência.
