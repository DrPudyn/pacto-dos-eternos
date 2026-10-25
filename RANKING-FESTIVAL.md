# Ranking Festival — integração

O jogo usa Node HTTP, regras de combate compartilhadas em VM, perfis com sessão HttpOnly e saldos inteiros em milionésimos de Ouro. As seis raridades existentes são Comum, Incomum, Raro, Épico, Lendário e Mítico. Invocações e fusões são confirmadas por `shared-engine.cjs`; skills e Maestria têm métodos próprios de compra. Reparos automáticos não cobram Ouro.

O ranking anterior consultava totais históricos. A Torre já cria expedições repetíveis com 15 heróis, sem alterar a energia original, e publica andares concluídos no servidor. O Festival usa os eventos dessas expedições, não o recorde histórico. O combate possui quatro famílias de dificuldade (`slime`, `blueslime`, `orc`, `minotaur`) e bosses; aparências novas não mudam a dificuldade. Caçador de Bosses: cada boss natural derrotado vale uma unidade; monstros comuns não contam e não existe limite diário. Bosses invocados pelo dono não pontuam.

Gastos elegíveis: invocações pagas, ajudantes, melhorias de skills, contratação/aprimoramento de forjas, fusões, caixas e aprimoramento de armas. Transferências do mercado entre jogadores ficam de fora: o Ouro continua circulando e vai ao vendedor. Reparos automáticos não cobram Ouro.

Contabilidade: 20% de cada gasto elegível, arredondado para baixo em Ouro inteiro, vai ao pote; os 80% restantes contam como Ouro queimado. Isso usa o preço normal das compras, sem cobrança extra. A contribuição semanal é `floor(contribuição*70/100)`; o restante vai ao pote mensal. A parcela semanal divide-se entre três categorias com resíduos rotativos determinísticos; os 30% mensais vão à Torre do Infinito. Cada posição recebe `floor(pool*percentual/100)`. Posições sem vencedor e resíduos de arredondamento também são queimados ao fechar a temporada. O total de Ouro queimado soma os 80% dos gastos registrados e os prêmios não distribuídos. Invocações pagas anteriores sem registro individual não podem ser reconstruídas com precisão.

Semanas usam segunda-feira 00:00 no fuso America/Sao_Paulo; meses usam calendário local. Intervalos são [início,fim). O mensal contém somente a Torre do Infinito; os resultados semanais não geram classificação mensal adicional. Não há pontuação retroativa: contas existentes entram com a coleção atual como baseline. Anúncios ainda pertencem ao vendedor até a compra; fusões removem os pais antes de calcular o Power novo. Importação autorizada redefine a baseline e não gera ganho competitivo.

Persistência transacional SQLite sem dependências externas (`node:sqlite`), com um snapshot completo do estado na mesma transação de saldos, pontuações, reserva e histórico. O JSON é mantido como espelho para backup e ferramentas locais. Mutações HTTP são serializadas. Fechamentos e eventos têm identificadores estáveis. Contas desclassificadas não recebem prêmios. Falha de persistência recarrega o último estado confirmado.

Atualização visual por polling controlado de 5 segundos enquanto a tela está aberta, reutilizando autenticação e navegação. Avatares são renderizados em camadas de pixel art a partir de configurações limitadas e validadas, sem geração por IA por jogador. Temporadas fecham no servidor mesmo sem alguém abrir o Ranking.

## Validação e operação

`node testar-festival.cjs` cobre as quatro classificações, fontes elegíveis/excluídas, concorrência, limites, fuso, viradas, desempates, arredondamento, posições vazias, queima, pagamento único, rollback, recuperação de COMMIT, avatares e reinício. Também verifica jogador fora do Top 10 e falha técnica sem consumir a reserva. `verificar-torre.cjs` confirma eventos únicos de mortes e andares reais, além da preservação da coleção original.

Regressões executadas: `testar-skills.cjs`, `testar-ferreiros.cjs`, `testar-compartilhado.cjs`, `testar-codex.cjs`, `testar-evolucoes-forjas.cjs`, `testar-forjas-conjuntas.cjs`, `verificar-torre.cjs`, `verificar-torre-background.cjs` e `verificar-precos.cjs`. Build: `node preparar-offline.cjs`; sintaxe dos módulos alterados e do bundle validada com `node --check`. Não há configuração de lint no projeto.

Conferência no navegador em ambiente isolado: botão Ranking, pódio com três contas, categoria mensal vazia, aba Premiações e avatar salvo/recarregado. Os dados de QA não entram no banco principal. A imagem `ranking-festival-pronto.png` documenta essa conferência com contas de teste.

Publicação local em 18/10/2026: backup em `backups/antes-ranking-festival-20261018-152937/`; migração manteve quatro contas e 1.312 heróis. Rotas e assets retornaram HTTP 200; eventos de combate reais já foram persistidos no Festival. O servidor precisa permanecer ligado para executar combates e fechamentos automáticos. Após uma interrupção, temporadas vencidas são encerradas na retomada.

## Arte adicional

`assets/festival-background.png` foi criado com a ferramenta integrada de geração de imagens, sem serviço de geração por jogador. Direção visual: festival medieval em pixel art, castelo de pedra escura, grande troféu dourado central, bandeiras, lanternas, público nas laterais e espaço livre para o pódio e os avatares. A composição fica atrás dos componentes funcionais; nomes, valores e líderes vêm exclusivamente do servidor.

Atualização das regras: migração v2 zera somente a caça da semana aberta, registra o início da contagem de bosses e move a reserva mensal do antigo Campeão para a Torre, sem perder Ouro. O reset é executado uma única vez. Histórico fechado é preservado. Textos de apoio, controles e valores usam fonte sem serifa legível; títulos e arte mantêm o estilo pixel.
