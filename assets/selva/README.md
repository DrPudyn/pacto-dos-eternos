# Selva e Torre do Infinito — primeira entrega

A versão compartilhada tem dois cartões novos: SELVA e TORRE DO INFINITO.

SELVA: caça normal com pixel art de vegetação, chão, água, ruínas, sapos, lobos, ursos e serpentes. Usa a mesma partida e recompensas da Dungeon. Alterna quatro ambientações da selva a cada 120 segundos; os layouts novos da torre são independentes.

TORRE: escolha exatamente 15 heróis com energia. O servidor copia os atributos e a energia atual, sem consumir a energia da coleção. Não existem troca de heróis, reparo ou Porter dentro da tentativa. Cada andar tem um grupo finito de monstros e dificuldade crescente. A cada cinco andares aparece um Guardião Ancestral ou uma Hidra de Jade com variação visual. Energia restante passa para o andar seguinte; quem esgota sai da tentativa. Ao concluir o andar, há uma transição suave. Ao esgotar a equipe ou encerrar, mostra andares concluídos, mortes, bosses e tempo. O recorde é persistido e aparece no leaderboard; desempates usam bosses e monstros. Voltar pausa a tentativa e abrir o cartão permite retomá-la. Nenhuma recompensa em moedas é concedida pela torre nesta entrega.

Escopo visual inicial: selva, ruínas, bosque e margens dentro do mesmo bioma; gelo, vulcão e outros biomas completos ficam para a próxima expansão.

Arte: imagegen integrado, atlas original preservado em atlas-original.png. Conversão das células em preparar-atlas.py; atlas final em minihero-offline/build/jungle-atlas.png e shared-build/jungle-atlas.png.
Prompt: 8x8 atlas for top-down pixel-art jungle RPG; terrain grass/dirt/moss/water/temple; trees, ferns, log, boulder, idol, tropical leaves, glowing flowers and vine; four-right/four-left animation frames per creature row: frog, wolf, bear, serpent, guardian, hydra; transparent creature backgrounds, no labels or UI.

Verificação: node verificar-torre.cjs; node testar-compartilhado.cjs. Fluxo pela interface conferido com perfil temporário de 15 heróis, boss no quinto andar, resultado final e leaderboard. Dados reais não usados no QA.
