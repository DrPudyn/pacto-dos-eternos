# Campanha PvE — primeira região para avaliação

## Acesso e escopo

Abra http://127.0.0.1:17841 e clique no portal **Masmorra**. Entre em **Fronteira das Cinzas** e escolha uma fase. O botão **Masmorra Livre** preserva o acesso ao combate anterior.

Esta entrega contém a primeira região jogável, com dez fases. O mapa apresenta os dez territórios da história, mas as outras nove regiões ainda não têm fases ou arenas implementadas. Sua produção aguarda a aprovação visual do primeiro capítulo, conforme o prompt aprovado.

## Regras implementadas

- Equipe de 1 a 15 heróis da própria coleção, usando a energia atual.
- Seleção automática por energia atual decrescente, desempate por ataque e ID.
- Reserva dos heróis durante a expedição: sem combate paralelo ou reparo. A Torre não pode ser iniciada junto com a campanha.
- Fórmulas existentes de dano, ataques, críticos, armas, skills, consumo de energia e bônus do códice reaproveitadas no servidor.
- Movimentação adaptada à arena aberta, com posições ao redor dos alvos para evitar sobreposição excessiva.
- Clicar no inimigo ou usar os botões de alvo muda a prioridade real. Um golpe já iniciado pode terminar antes da troca.
- XP de skills acompanha os mesmos incrementos do combate existente.
- Três ondas nas fases normais/elites. Varkhan tem duas etapas; a segunda possui 35% mais vida.
- Abaixo de 50% da vida, Varkhan reduz o dano recebido em 55% durante 5 s de cada ciclo de 12 s. O HUD e o escudo indicam a proteção.
- Vitória no prazo concede uma estrela; até 80% do prazo concede duas; até 60% concede três.
- Uma estrela libera a próxima fase. O melhor tempo e as estrelas persistem por perfil.
- Derrota por tempo, falta de energia ou abandono não concede recompensa. O desgaste permanece e os heróis retornam ao repouso.
- Ouro vai diretamente para o saldo; a vitória sobre o general também concede um Selo de Pacto e um baú de arma. As duas etapas juntas constituem um boss, não dois drops.
- A Torre continua com suas regras anteriores, sem esses drops.

## Balanceamento inicial

| Fase | Tipo | Prazo | Vida por inimigo | Inimigos por onda | Ouro repetível | Bônus da primeira vitória |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Normal | 90 s | 260 | 3 | 65 | 150 |
| 2 | Normal | 90 s | 375 | 3 | 83 | 190 |
| 3 | Normal | 90 s | 490 | 3 | 101 | 230 |
| 4 | Elite | 120 s | 605 | 4 | 119 | 270 |
| 5 | Normal | 90 s | 720 | 4 | 137 | 310 |
| 6 | Normal | 90 s | 835 | 4 | 155 | 350 |
| 7 | Normal | 90 s | 950 | 5 | 173 | 390 |
| 8 | Elite | 120 s | 1.065 | 5 | 191 | 430 |
| 9 | Normal | 90 s | 1.180 | 5 | 209 | 470 |
| 10 | General | 180 s | 12.000 / 16.200 | 1 por etapa | 227 | 510 |

Cada estrela nova paga 25 de ouro uma única vez. Exemplo: a primeira vitória na fase 1 com três estrelas concede 65 + 150 + 75 = **290 ouro**. Repetir o mesmo resultado concede somente 65.

Os valores são uma base para jogar e ajustar, não uma economia definitivamente calibrada. Testes com quinze heróis de ataque/velocidade 60 concluíram o capítulo; um time comum de ataque 25 já encontrou o limite de tempo nas fases avançadas, incentivando melhorias.

## Arte e movimento

Artes originais geradas com a ferramenta integrada de `imagegen`:

- `assets/campaign-world.png`: mapa panorâmico.
- `assets/campaign-frontier.png`: fronteira e campo de batalha.
- `assets/campaign-arena.png`: arena exclusiva do general.

Prompts de produção: [CAMPANHA-ART-PROMPTS.md](CAMPANHA-ART-PROMPTS.md).

O combate usa canvas com sprites animadas do jogo, projéteis, números de dano, marcadores de raridade, energia e vida. Chamas, brilho localizado, névoa, nuvens discretas, ritual e deformação das faixas das bandeiras são desenhados independentemente da arquitetura. Elites recebem variação de iluminação e cinzas; fases avançadas têm iluminação mais fria. A segunda etapa do general acrescenta uma marca ritual.

Os efeitos decorativos respeitam redução de movimento e param de desenhar com a aba oculta. O mapa usa navegação por seleção dos territórios; não há rolagem vertical. A região libertada recebe iluminação mais limpa, identificação persistente e destaque do caminho para as minas.

## Limitações explícitas desta entrega

- O corpo de Varkhan reaproveita temporariamente a spritesheet animada do Golem da Forja já existente. Nome, arena, regras e apresentação pertencem à campanha. Uma spritesheet exclusiva pode ser produzida após a avaliação.
- As fases 1–9 compartilham a arte-base da fronteira com variações de iluminação/efeitos; não são nove ilustrações independentes.
- As regiões 2–10 são destinos narrativos no mapa, sem conteúdo jogável nesta etapa.
- A interface foi conferida no navegador de desktop. Existem estilos para telas menores, mas a experiência móvel ainda merece uma rodada específica em dispositivo real.
- O combate continua no servidor ao sair da tela. Uma interrupção de servidor superior a 30 s encerra a tentativa sem prêmio; não concede vitórias por um salto de relógio. O estado e a energia mais recentes confirmados ficam preservados.
- Trocas de equipe, skills, mercado de heróis e alterações de equipamentos ficam bloqueadas durante a tentativa para proteger as reservas. A mochila pode ser consultada ao sair da tela.

## Persistência e testes

O progresso é um campo adicional `campaign` por usuário; nenhum reset é necessário. Tentativas têm UUID e identificador de requisição. Fases, resultados, estrelas e pagamentos são calculados no servidor. Solicitações repetidas não duplicam o pagamento. O armazenamento SQLite existente continua confirmando o estado inteiro atomicamente, com espelho JSON.

Testes com dados isolados:

- `node testar-campanha.cjs`: dez fases, energia, XP, alvo, replay, estrelas, vitória, derrota por energia, prazo e interrupção longa.
- `node testar-campanha-api.cjs`: autenticação, isolamento de contas, bloqueios, retomada após reinício do serviço/SQLite e idempotência.
- `node testar-equipamentos.cjs` e `node testar-codex-armas.cjs`: regressões de equipamentos e códice.
- `node verificar-torre.cjs`: regressão da Torre.

As verificações de navegador usam `qa-equipamentos.cjs` com `MINIHERO_QA_CAMPAIGN=1`. A variável `MINIHERO_QA_CAMPAIGN_BOSS=1` libera fases somente no banco temporário do teste. Essas variáveis não alteram o servidor real.

## Mapa aprovado integrado — Dimensão Sombria

O portal da Masmorra agora abre o mapa animado aprovado, usando a arte `realm-demon-preview-v3.png`, céu separado e efeitos recortados por líquido. A ilha amigável retorna ao Refúgio; a próxima recebe o capítulo jogável existente. Nomes, disponibilidade e progresso vêm de `campaign/state`. Nenhum botão de simulação aparece no jogo. As dez fases do primeiro capítulo continuam sendo o conteúdo implementado; os demais territórios ficam bloqueados. A Masmorra Livre tem acesso próprio no rodapé.

O cliente de campanha monta o documento local do mapa em um painel isolado, sem mudar a proteção `frame-ancestors` do servidor. Mensagens validam origem, janela emissora e disponibilidade da região; desmontar a tela cancela carregamento e remove o listener. `preparar-offline.cjs` inclui as artes e arquivos do mapa em toda compilação. A prévia independente permanece disponível.

Validação: compilação, testar-campanha.cjs, portal → mapa → informações → fases → mapa → base; atalho Masmorra Livre verificado no navegador.
