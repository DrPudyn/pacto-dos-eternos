# Artes do Salão dos Pactos

Geradas com a ferramenta integrada `image_gen`, sem dependência de geração por jogador. Arquivos finais: `assets/pact-book.png`, `assets/pact-seal.png` e `assets/salao-dos-pactos-v1.png`. O prompt do cenário está em `assets/salao-dos-pactos-prompt.txt`.

## Prompt do selo

Asset isolado para jogo Salão dos Pactos, pixel art de fantasia com pixels nítidos e paleta limitada, fundo realmente transparente. Um único medalhão/selo arcano quadrado com cantos chanfrados, vista frontal simétrica, em bronze envelhecido e azul noturno, centro com emblema de um livro aberto envolvendo estrela dourada de quatro pontas, pequenos cristais âmbar nas laterais, aro de runas abstratas sem texto legível. Silhueta compacta, detalhes grossos legíveis quando reduzido para 96 pixels. Objeto totalmente dentro do enquadramento com margem transparente. Não é carta nem envelope, sem moldura retangular de carta, sem personagens, sem palavras, sem sombra externa, sem cenário, sem watermark. Elegante e original, tema medieval acolhedor, sem render3D ou pintura borrada.

## Prompt do grimório

Asset isolado de jogo pixel art, fundo realmente transparente. Um único grimório de contratos fechado do Salão dos Pactos, livro mágico grosso de couro azul noturno, cantos de latão envelhecido e fecho dourado, emblema original na capa de livro aberto com estrela de quatro pontas âmbar. Vista frontal levemente em perspectiva mostrando lombada e páginas creme, silhueta legível ao reduzir para 160 pixels. Pixel art nítida, blocos de cor e detalhes grossos, fantasia medieval calorosa, paleta azul e ouro, proporções quadradas compactas, sem personagens, sem texto legível, sem cenário, sem cartas ou envelope, sem watermark. Enquadramento inteiro com pequena margem transparente, sem brilho que invada toda a imagem.

## Integração e verificação

`pact-visuals.cjs` redireciona o registro das imagens antigas para os novos assets e substitui a entrada da revelação, sem alterar a compra nem os heróis sorteados. `pact-client.js` mostra somente os heróis confirmados pelo jogo. O grimório desperta os selos; cada selo se dissipa e dá lugar ao herói. A interface oferece revelar todos, pular, continuar e abrir a coleção. Fechar a animação não remove heróis já adquiridos. Temporizadores são descartados ao fechar; movimento reduzido é respeitado.

`pact.css` substitui versos, molduras, brilho holográfico e envelope ativos, aplica o cenário e centraliza a composição da forja no botão da loja. Arquivos antigos permanecem no backup de origem, mas os registros e estilos ativos usam o novo visual.

Build e sintaxe validados. Testes de contas/compras compartilhadas e preços passaram. No navegador, foram verificadas invocações reais de 15 heróis em contas de QA isoladas, revelação em sequência, pular animação, conclusão, molduras por raridade, ícones e loja. Sem erros no console durante a conferência.

Ajuste da apresentação: molduras originais de raridade restauradas completas, sem recorte CSS. Personagens ampliados e agrupados em linhas centralizadas; livro e selos permanecem. Conferido no navegador com 15 heróis.

