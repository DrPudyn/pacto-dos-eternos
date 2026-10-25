# Além do Portal — prévia visual independente

Abrir: http://127.0.0.1:17841/shared-build/realm-preview.html

Esta prévia não substitui a campanha existente e não acessa contas, inventários ou saves. O progresso demonstrado existe somente na memória desta página e é reiniciado ao atualizar.

## Interação

- Não há placas com os nomes dos lugares sobre o mapa.
- Apontar ou focar um local liberado destaca seu contorno.
- Clicar em um local liberado abre nome, descrição e general. Os cadeados não abrem informações nem aceitam acesso por teclado.
- Todas as ilhas permanecem em cores completas. Inicialmente apenas a Fronteira está acessível; as demais exibem cadeado.
- “Simular conquista na prévia” desbloqueia somente o próximo território do caminho.
- “Recomeçar prévia” volta ao estado inicial.

## Arte e camadas

Geração pela skill `imagegen`, usando a ferramenta integrada, com a ilha principal como referência visual.

- `assets/realm-demon-concept-v1.png`: composição original com céu e cenário distante.
- `assets/realm-demon-preview.png`: recorte com transparência, preservando ilhas, construções, pontes e cristais.
- `assets/realm-sky.png`: céu reaproveitado da ilha inicial.

As ilhas flutuam sobre o céu separado. Canvas anima anéis dos portais, fluxos contínuos de água azul, lava e líquidos mágicos roxo e vermelho, pontos de luz de tochas e faixas de tecido. Camadas independentes de névoa movem-se lentamente. A preferência por movimento reduzido desativa a flutuação e mantém os efeitos decorativos estáticos; o desenho para com a página oculta.

Os recortes de interação usam polígonos e uma máscara alfa da arte para que o destaque não pinte retângulos no céu.

## Prompts utilizados

### Composição

Create an original preview of the DEMON KING'S WORLD campaign selection screen for Pacto dos Eternos. The attached refuge island is a STYLE AND CAMERA REFERENCE ONLY: match its lavish crisp pixel-art drawing, isometric three-quarter floating-island architecture, scale of buildings, blue slate masonry, gold highlights, carefully clustered pixels, and excellent depth. Do not make a parchment world map or a bird's-eye continent. No game HUD, no text, numbers, labels, buttons, floating signs or locks. Wide 16:9. A sprawling interconnected floating dark fantasy archipelago fills most of the frame. Ten readable architectural destinations along a winding stone route with bridges, from an entrance courtyard in the lower left to the largest demon citadel in the upper right. Include frontier gate, molten mine, corrupted forest shrine, cyan necropolis, ancient sand temple, iron fortress, abyss portal, violet cathedral, siege gate and demon king citadel. Keep buildings individually distinguishable, with road separation and varying elevation. Midnight violet sky, distant mountains, clouds beneath islands, blue crystalline rock undersides, lava channels and purple crystals. Stable architecture ready for independent animation. Match the original refuge's pixel-art visual family, not smooth painting or photography. No characters or diagram graphics.

### Extração do fundo

Keep the complete foreground archipelago exactly: all ten landmark buildings, connecting roads and bridges, attached trees, lamps, lava, chains and rocky crystalline undersides. Preserve the 16:9 canvas, positions, scale, colors and pixel details. Remove only the starry sky, distant background islands, mountains and surrounding clouds, replacing them with actual transparency. Keep the coherent foreground intact. No new objects, labels, locks or UI. Transparent PNG cutout for independent floating animation over a separate sky. Do not redesign or rearrange the scene.

## Preparação

Executar `node preparar-previa-reino.cjs` para copiar HTML, CSS, JS e artes para os diretórios de assets servidos pelo jogo. Não é necessário modificar as rotas da campanha nem o banco.

## Revisão: caminho único

Uma sequência de nove pontes liga dez territórios. A rota começa na Fronteira, atravessa Floresta, Minas, Deserto, Fortaleza, Abismo, Catacumbas, Portões e Catedral, terminando no Trono. Sem atalhos de progressão. Os fluxos usam faixas descendentes com repetição independente, recortadas na silhueta de cada cascata; não há pausa ao reiniciar o ciclo.

Arte revisada com imagegen integrado, preservando a original. Prompt final: corrigir apenas as pontes para formar Fronteira → Floresta → Minas → Deserto → Fortaleza → Abismo → Catacumbas → Portões → Catedral → Trono; remover ramificações, preservar transparência, enquadramento, construções e estilo pixel art.

Arte final: `assets/realm-demon-preview-v2.png`. Original preservada em `assets/realm-demon-preview.png`.

A ilha inicial agora é a Base dos Eternos: seu clique retorna a `/`. A Floresta é o primeiro território da campanha e começa liberada. Título central: Dimensão Sombria. Sem seta de retorno no cabeçalho.

## Correção das quedas e cores

Efeitos agora usam máscaras por queda, combinando o polígono da cascata com os pixels luminosos do líquido. Não há faixa sobre a ponte. Removidos preenchimentos retangulares, brilho e partículas externas que prejudicavam a silhueta em seta. Floresta: rosa-vinho. Minas: lava em todas as quedas. Castelo final: vermelho em ambas. Base: pontas completas dentro do enquadramento.

Arte v3 produzida com imagegen integrado a partir da v2. Prompt: preservar ilhas, nove pontes, coordenadas e transparência; recolorir apenas líquidos da floresta para rosa-vinho, minas para lava e castelo final para vermelho; completar pontas das quedas da base com margem transparente, sem cortes.
