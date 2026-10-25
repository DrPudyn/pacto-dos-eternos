# Arte de equipamentos — versão 2

Artes geradas com image_gen para substituir os ícones procedurais: `weapon-atlas-v2.png` (24 armas) e `pact-backpack.png` (mochila).

Direção: fantasia em pixel art, paleta azul e latão do Salão dos Pactos, pixels definidos, silhuetas legíveis e fundo transparente. Quatro famílias com seis desenhos próprios cada; não são trocas de cor. Ferro/madeira comuns, aço e natureza incomuns, guardião azul raro, runas violetas épicas, sol dourado lendário e dragão/rubi mítico.

Prompt atlas: sprite sheet transparente de 6 colunas por 4 linhas, armas inteiras e separadas, sem textos ou interface; primeira linha seis espadas, segunda seis lanças, terceira seis arcos, quarta seis cajados. Espadas evoluem de ferro rústico para sabre verde, guardião alado, lâmina rúnica, sol dourado e obsidiana dracônica. Lanças de ferro para ponta-folha, tridente azul, glaive lunar, alabarda solar e presas dracônicas. Arcos de madeira para carvalho vivo, asas prateadas, crescente violeta, penas solares e chifres rubros. Cajados de quartzo para esmeralda, safira flutuante, lua violeta, sol de âmbar e cristal carmesim. Edição subsequente solicitou margens maiores e separação técnica dos itens.

Prompt mochila: mochila de couro azul, ferragens de latão, bolsos costurados, pergaminho lateral, rubi pendurado e emblema original de livro aberto abraçando estrela de quatro pontas. Ícone em pixel art, vista frontal em três quartos, isolado e transparente.

Integração: `analisar-atlas.py` lê o canal alfa sem modificar a imagem e produz metadados de enquadramento e contorno em `weapon-atlas-v2.frames.json`. `mhGearAtlas` em equipment-client.js corresponde a esses metadados. O navegador usa posicionamento de background e recorte CSS para isolar cada sprite, sem fragmentos dos vizinhos. A mesma arte atende miniaturas, detalhe, equipamento e resultados de caixas.

Fluxo: mochila principal é consulta de arte, descrição e atributos; equipamento, favoritos e aprimoramento continuam no seletor aberto pela ficha do herói. Arsenal usa o fundo já existente do Salão dos Pactos, placas de classe e molduras em azul e dourado. Custos, chances e dados dos jogadores não foram alterados.
