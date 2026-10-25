# Espadachim: primeira prévia de estilo

Prévia independente, sem substituir as sprites do jogo. Folha de 6 colunas e 3 linhas: repouso, caminhada e ataque, olhando para baixo/direita. A página anima os quadros e permite pausar. Não é ainda a folha final multidirecional do combate.

Arte: `previa-espadachim/swordsman-tiny-concept.png`. Imagegen integrado, usando a folha atual do espadachim como referência. A versão anterior detalhada foi descartada.

Prompt: criar espadachim original no mesmo estilo minúsculo e de baixa resolução da referência. Personagem de aproximadamente 16x16 pixels, no máximo 12 cores planas, contorno preto escalonado, sem suavização nem detalhes de ilustração. Capuz azul-petróleo curto, detalhe dourado, rosto bege, torso azul-escuro, ombreiras cinzas, botas marrons e espada curta prateada. Seis quadros por linha e três linhas com repouso, caminhada e golpe; contato no quarto quadro. Fundo transparente. Pixels quadrados grandes por ampliação nearest-neighbor. Sem texto ou grade.

## Versão com armadura

A versão com capuz foi rejeitada. `swordsman-armored-concept.png` apresenta elmo de aço aberto, peitoral, ombreiras, tabardo azul e espada curta. Folha 6×12 com repouso e caminhada em quatro vistas diagonais e ataques nas quatro direções cardinais, seguindo o mapeamento do renderizador original. A prévia normaliza a altura de repouso pela caixa alfa da sprite original, renderiza em uma célula real de 32×32 e só então amplia por nearest-neighbor. A posição dos pés e a cadência usam os quadros de referência originais; ataque em seis quadros, contato no quarto. A folha de arte gerada não substitui ainda os arquivos do jogo.

Prompt imagegen integrado: usar as três folhas originais como referência; criar espadachim com armadura prateada e tabardo azul, sem capuz, com cerca de 8–10 pixels lógicos de altura corporal, dez cores planas, contorno preto e muito espaço transparente em células de 32×32. Seis colunas e doze linhas: quatro de repouso, quatro de caminhada, quatro de ataque. Direções e sequência das poses compatíveis com as referências. Revisão direcionada: linhas 3,4,7,8 devem mostrar costas do elmo e armadura, sem rosto ou visor frontal; preservar todas as outras células.

Complemento `swordsman-armored-up.png`: seis quadros de ataque para cima, vistos por trás. Prompt: mesmo cavaleiro minúsculo da folha de referência, seis células transparentes em uma linha, costas do elmo e da armadura sempre visíveis, tabardo azul, levantar espada, contato no quarto quadro acima do personagem, recuperação; sem rosto em nenhum quadro. Prévia usa o mapeamento de linhas específico da arte gerada e normaliza o complemento pela altura de repouso traseiro.
