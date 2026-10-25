# Dimensão Sombria — castelos

Cada uma das nove ilhas após a base contém um labirinto da Masmorra Livre. A busca de caminhos, ataques e renderização são os mesmos do modo livre. Os monstros são finitos e não renascem. Após a limpeza aparece um guardião; no último castelo, o confronto é com Azhrael.

Não há mapa interno de dez fases nem estrelas. A faixa superior mostra apenas a contagem regressiva: de 3 minutos no primeiro castelo até 5 no último. Ao chegar a zero a tentativa é perdida, sem recompensa. A energia continua sendo consumida. Sair da tela mantém o combate no servidor; a Masmorra Livre continua disponível em paralelo para os demais heróis.

Uma vitória libera apenas o próximo castelo. Cada guardião concede três selos e três baús; o ouro foi triplicado e cresce pela rota. Cada castelo só pode ser conquistado uma vez. Uma derrota permite tentar novamente, com tempo e monstros reiniciados.

A campanha anterior é arquivada em campaignLegacyV1. O novo trajeto usa campaign.version=2; inventário, Códice e saldo não são reiniciados.

Validação: node testar-campanha.cjs e node testar-campanha-api.cjs. A conferência visual usa qa-castelos-visual.cjs, porta 17842, banco temporário e encerramento automático em cinco minutos.

Progressão de combate: vida dos monstros cresce em cerca de 42% por castelo; vida dos chefes em cerca de 48%. Defesa dos chefes reduz o dano recebido de 0% até 40%, em passos de 5 pontos. A mesma função campaign-defense.js é aplicada no servidor e na previsão visual. Ouro de monstros e chefe é guardado até a vitória, somado ao bônus único de conquista; derrotas não pagam eliminações.

## Combate tático e bestiário (22/10/2026)
- 45 artes: três criaturas, um elite e um guardião por castelo. Galeria: shared-build/bestiario.html.
- Inimigos patrulham, perseguem, recuam brevemente, protegem aliados ou anunciam investidas. Chefes alternam ataque anunciado e abertura de três segundos.
- Dois objetivos por mapa concedem proteção enquanto vivos. Não renascem. Elites e objetivos ocupam vagas da população finita existente.
- Estratégias: agressiva (+15% em aberturas), cautelosa (esquiva mais rápida), caçadora (suportes/objetivos).
- Postura se recupera; esgotá-la interrompe o herói por 1,2s. Não há morte permanente.
- Classes priorizam alvos diferentes; arqueiro tem deslocamento adicional, lanceiro ignora metade da defesa, maga e espadachim preservam/expandem área mínima.
- Clique numa criatura prioriza o alvo por oito segundos. Desgaste, cronômetro, conquista única e recompensa validada no servidor foram mantidos.
- Animações das novas criaturas são procedurais sobre sprites; não há novos quadros desenhados de caminhada.
- Validação: testar-taticas.cjs, testar-castelos.cjs, testar-campanha-api.cjs e inspeção da partida isolada na porta 17842.

## Ajuste aprovado dos sprites e da postura
Todos os castelos usam sprites de grade lógica 24x24, normalizados para PNG 96x96 com nearest-neighbor. Cada criatura tem quatro quadros: repouso, dois passos e ataque. O boss alterna quadros também quando parado. Fontes geradas com ferramenta integrada, preservadas em assets/campaign-bestiary/pixel-region-*-source.png; manifest e scripts de recorte permitem reproduzir o empacotamento.

A postura básica recebida por golpe passou de 35 para 70; elite 120 e boss 200, com multiplicador de 7% por região após a primeira. Resistência de classe permanece. Recuperação: 2/s somente após 2,5s sem impacto. Stun: 1,2s com proteção contra interrupções em sequência; estrelas sobre a cabeça indicam o estado.

Boss reserva área interna de distância Manhattan menor que 3 células. Melee ataca a borda a 3 células; alcance à distância também é contado a partir da borda. O caminho escolhe posições externas e distribui os heróis pelas posições livres, preservando a visão do corpo do boss.

Validação específica em testar-hitbox-postura.cjs: espadachim solo sofreu 6 stuns em 80s; 10.630 quadros de ataque do grupo ao boss ocorreram fora da área interna. Campanha e API preservam resultados/recompensas únicos.

## Campanha em turnos ativos — quatro heróis
Novas tentativas usam mode=atb e estado atb-v1. Batalhas antigas mantêm o motor anterior até terminar, sem converter ou resetar conquistas. Limite de 4 heróis nas novas expedições; dois encontros de criaturas e um de boss. Cada unidade possui vida, ataque, defesa, barra de ação, cura com 2 usos, buff temporário e cooldown. Vida zerada derruba só durante a tentativa. Energia é desgaste separado. Modo automático alternável; comandos entram na próxima ação, sem lançar gratuitamente.

135 habilidades de inimigos nomeadas em campaign-atb.js. Bosses têm mecânicas específicas de raízes, defesa, enfraquecimento, absorção, silêncio, fúria, dissipação e ruptura. Enfurecimento aumenta o dano em 65% no trecho final do limite de tempo. Animações usam quadros dos sprites aprovados e efeitos de pixels desenhados em canvas: golpes, projéteis, espinhos, explosões, cura e buffs. Não foram substituídas as artes aprovadas.

Ouro da Masmorra Livre por maior castelo conquistado: 1 → 1,3 → 1,7 → 2,2 → 2,9 → 3,8 → 5 → 6,6 → 8,7 → 11,5. O multiplicador aumenta o crédito real de ouro em bc, compartilhado entre servidor e previsão do cliente; não multiplica baús, selos ou premiação de campanha. Conquistas antigas também contam. O farm continua com os heróis que não estão reservados na campanha.

Validação atual: testar-campanha-atb.cjs, testar-atb-api.cjs, testar-farm-campanha.cjs; testar-taticas.cjs preserva compatibilidade do motor antigo. Equipe máxima válida (raridade mítica, stats 180, skills nível 3, equipamento +20%) supera o último castelo; equipes menores perdem mais cedo. Balanceamento inicial sujeito a ajustes de experiência real.

## Direção de arte das arenas e interface integrada
Nove cenários próprios em assets/battle-arenas/, com fontes geradas e prompts preservados. O runtime usa battle-arena-{1..9}.png em grade lógica 640x360. A composição prioriza chão livre, elementos do tema nas bordas e leitura dos sprites no plano de combate.

A arena agora ocupa toda a área disponível; canvas ajusta a proporção por ResizeObserver sem faixas laterais. Pés dos heróis são alinhados pelo limite real de alpha dos frames, com sombras de contato. A barra de três habilidades de cada herói fica sobre o rodapé do cenário, com retratos, ícones em pixel art, recarga e usos. Fontes locais BattleBody/Pixelify Sans e BattleTitle/Jersey 10 substituem Arial na apresentação do combate.

Painel do inimigo selecionado mostra ataque, cura e buff com ícones e nomes; cada mob também mostra os três símbolos junto à barra. Seleção usa marca no chão, sem retângulo ao redor do corpo. Buffs têm raios ascendentes e auras; cura tem brilhos e anéis; ataques alternam cortes, flechas, lanças, espinhos, nuvens de esporos, projéteis e explosões. Efeitos renderizados em camada de pixels com escala inteira para preservar o estilo. As cores seguem classe/elemento/região.
