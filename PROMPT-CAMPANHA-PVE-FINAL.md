# Pacto dos Eternos — Implementação da campanha PvE

Implemente uma campanha PvE no meu jogo existente, Pacto dos Eternos, com progressão por regiões, generais e um Rei Demônio como inimigo final.

Quero uma implementação funcional integrada ao jogo atual, não apenas uma demonstração visual ou um documento de ideias.

O principal diferencial deve ser a qualidade visual: pixel art de fantasia muito bem trabalhada, cenários vivos e identidade consistente com a ilha flutuante da tela principal.

Analise primeiro o código e os sistemas existentes. Preserve o progresso dos jogadores e aproveite os sistemas de heróis, energia, armas, skills, forjas, ajudante, recompensas e salvamento.

## 1. Objetivo da campanha

Hoje o jogo gira principalmente em torno de conseguir ouro, invocar bons heróis, melhorar skills, comprar equipamentos e aprimorá-los.

A campanha deve dar propósito a essas melhorias: montar uma equipe capaz de avançar por territórios dominados pelos generais do Rei Demônio, libertar essas regiões e chegar à fortaleza final.

Crie uma narrativa original, com nomes próprios coerentes com o jogo. Evite longos diálogos: use pequenas introduções de região, apresentações dos generais e mensagens de vitória.

A história pode partir desta ideia:

Um Rei Demônio está corrompendo o mundo por meio de rituais realizados por seus generais. O Refúgio dos Eternos é um dos últimos lugares protegidos. O jogador reúne heróis por meio dos Pactos e conduz expedições para interromper os rituais e retomar os territórios.

## 2. Estrutura da progressão

A campanha terá 10 regiões, com 10 fases em cada região, totalizando 100 fases.

Nas regiões 1 a 9, a fase 10 termina em um confronto contra um general. Na região 10, a fase 10 termina no confronto contra o Rei Demônio.

Uma vitória libera a fase seguinte. Derrotar o general libera a próxima região. O progresso deve ficar salvo por jogador no servidor.

Crie uma configuração de dados organizada para regiões, fases, inimigos, modificadores, recompensas, artes e bosses. Evite espalhar regras e valores por diferentes arquivos.

Prepare a arquitetura para as 100 fases, mas implemente primeiro apenas a primeira região completa. A expansão das outras nove regiões depende da minha aprovação visual, conforme a seção 19.

Se houver limitações de geração de arte, deixe explícito quais cenários são definitivos e quais são provisórios.

## 3. Entrada pelo portal

O portal da Masmorra na ilha principal deve levar ao novo mapa da campanha.

Preserve o acesso às funcionalidades atuais que ainda forem necessárias. Inspecione o fluxo existente antes de substituir qualquer tela.

O botão Voltar deve sempre retornar ao local correto:

- Batalha → região.
- Região → mapa da campanha.
- Mapa da campanha → ilha principal.

Não permita que o jogador retorne acidentalmente à antiga página que reunia todas as opções do shop.

## 4. Mapa da campanha

Crie um mapa panorâmico horizontal em pixel art, com profundidade e alto cuidado artístico.

O mapa deve mostrar a jornada: territórios próximos ao refúgio à esquerda, regiões progressivamente mais perigosas ao centro e a fortaleza do Rei Demônio no horizonte final.

As dez regiões precisam ser visualmente reconhecíveis. Mostre caminhos, pontos de interesse, fortalezas e sinais da corrupção.

Evite uma simples fileira de botões sobre uma imagem. Os pontos de interação devem parecer parte do mundo.

Exiba claramente:

- Região atual.
- Regiões concluídas.
- Próxima região desbloqueável.
- Regiões bloqueadas.
- Progresso de fases e estrelas.
- General ou Rei Demônio associado à região.

A região bloqueada pode ficar envolta em névoa, mas sua silhueta deve despertar curiosidade.

Ao avançar, use uma transição suave de câmera ou navegação por regiões. O mapa pode ser panorâmico, mas não deve causar rolagem vertical da página.

No computador, prefira setas laterais e seleção direta de regiões. No celular, permita navegação por gesto quando adequado.

Não deixe a roda do mouse deslocar a tela inteira para cima ou para baixo.

Na primeira entrega, o mapa pode apresentar a visão geral e as silhuetas das regiões futuras, mas somente a primeira região terá conteúdo jogável. Não produza todas as artes finais antes da aprovação.

## 5. Direção de arte

A qualidade de referência é a ilha flutuante da tela principal do próprio jogo.

Use:

- Pixel art com pixels definidos.
- Paleta consistente.
- Sombras em blocos.
- Contornos coerentes.
- Arquitetura e símbolos originais.
- Iluminação que valorize os pontos importantes.
- Boa separação entre cenário, personagens e interface.

Não use acabamento fotográfico, pintura borrada, imagens esticadas, emojis como arte final ou excesso de efeitos que escondam os personagens.

Use a skill de geração de imagens, se disponível, para produzir artes originais adequadas ao jogo.

Uma imagem gerada não deve ser tratada como uma animação pronta. Prepare camadas e elementos separados quando necessário para animar o cenário de verdade.

Não dependa apenas de mover uma imagem inteira ou aplicar um filtro de brilho sobre todo o fundo.

## 6. Cenários das regiões

Use estas regiões como base, refinando nomes e identidade se necessário:

### Região 1 — Fronteira das Cinzas

Estradas de pedra, muralhas destruídas, campos queimados e uma fortaleza distante. Luz de entardecer dourada contrastando com fumaça e corrupção. Primeira arena de general: ponte ou pátio diante da fortaleza.

### Região 2 — Minas Acorrentadas

Minas profundas, trilhos, elevadores antigos, cristais e grandes estruturas de ferro. Iluminação por lanternas e minerais luminosos. General em uma câmara de extração monumental.

### Região 3 — Floresta Corrompida

Árvores antigas, raízes enormes, ruínas tomadas pela vegetação e névoa. Contraste entre natureza viva e focos de corrupção. General em um santuário engolido pelas raízes.

### Região 4 — Catacumbas do Silêncio

Galerias subterrâneas, sarcófagos, velas, estátuas e inscrições. Ambiente misterioso, com leitura clara dos personagens. General em uma cripta cerimonial.

### Região 5 — Deserto das Cinzas

Dunas, templos soterrados, ossadas gigantes e ruínas de uma civilização antiga. Partículas discretas e miragens leves. General em um templo parcialmente exposto.

### Região 6 — Fortaleza de Ferro

Muralhas industriais de fantasia, mecanismos, fornalhas e portões colossais. Fogo e metal, com identidade diferente das minas. General em uma sala de guerra fortificada.

### Região 7 — Abismo dos Ecos

Pontes sobre um vazio profundo, rochas suspensas, cristais e portais instáveis. Forte sensação de profundidade. General em uma plataforma ritual sobre o abismo.

### Região 8 — Catedral Profanada

Arquitetura monumental, vitrais partidos, altares e luz atravessando poeira. Contraste entre a antiga beleza e a corrupção. General diante de um grande altar.

### Região 9 — Portões da Ruína

Território de guerra diante da fortaleza demoníaca. Máquinas de cerco, crateras, rios de energia e portões gigantescos. Último general protegendo a entrada.

### Região 10 — Trono do Rei Demônio

Fortaleza final grandiosa, arquitetura própria e céu dominado pela corrupção. A arena final deve ser exclusiva. O salão do trono muda visualmente entre as etapas do combate.

## 7. Quantidade e variação das artes

Não é necessário criar cem fundos completamente independentes.

Estruture:

- Um cenário principal de batalha por região.
- Variações para fases normais e elites.
- Uma arena exclusiva por general.
- Uma arena exclusiva para o Rei Demônio.

As variações podem alterar clima, iluminação, estruturas, elementos de primeiro plano e intensidade da corrupção.

Evite repetir exatamente a mesma composição em todas as regiões.

Mantenha a área central e inferior do combate limpa o suficiente para até 15 heróis e os inimigos.

Concentre os detalhes mais elaborados nas laterais, no fundo e em estruturas que não prejudiquem a leitura da batalha.

## 8. Animações do ambiente

Quero cenários vivos, com movimento em pixel art.

Quando fizer sentido para cada região, implemente:

- Nuvens se movendo lentamente.
- Névoa em camadas.
- Chamas oscilando.
- Lava escorrendo.
- Água com movimento.
- Bandeiras balançando levemente.
- Cristais com brilho localizado.
- Portais com movimento interno.
- Brasas e partículas discretas.
- Raios de luz e reflexos pontuais.
- Elementos do ritual reagindo ao tempo restante.

Use camadas independentes, spritesheets, canvas ou outra técnica apropriada ao projeto.

Mantenha a arquitetura estrutural imóvel. Evite movimentar todos os elementos ao mesmo tempo. Não reintroduza as correntes animadas que foram removidas da ilha principal.

As animações devem ser leves:

- Pausar quando a tela estiver oculta.
- Respeitar a preferência por movimento reduzido.
- Evitar atualizar toda a interface a cada frame.
- Ajustar efeitos à capacidade do dispositivo.

## 9. Sistema de combate sem morte dos heróis

Aproveite o sistema atual: os heróis não precisam receber dano nem morrer.

O desafio será interromper um ritual antes que ele se complete.

Os heróis atacam automaticamente e consomem a energia atual conforme as regras existentes.

Quando um herói ficar sem energia, ele para de atacar naquela tentativa.

Se todos ficarem sem energia ou o tempo acabar antes da vitória, a tentativa termina em derrota.

A derrota:

- Não remove heróis.
- Não destrói armas.
- Não tira ouro.
- Não concede a recompensa de conclusão.
- Mantém apenas o desgaste de energia previsto pelo combate.

Os heróis retornam e podem ser reparados nas forjas pelo sistema atual.

Não altere silenciosamente a fórmula de consumo de energia. Inspecione as regras existentes e ajuste o balanceamento da campanha em torno delas.

## 10. Tempo e ritual

Use como ponto de partida para balanceamento:

- Fase normal: 90 segundos.
- Fase de elite: 120 segundos.
- General: 180 segundos.
- Rei Demônio: duração definida por testes das três etapas.

Esses valores são iniciais, não regras imutáveis.

Apresente o tempo como uma barra chamada “Ritual da Ruína”.

Conforme o tempo passa:

- A barra avança.
- O ritual no cenário fica mais intenso.
- Nos segundos finais, há um aviso visual claro, sem flashes agressivos.

Mostre tempo restante e progresso dos inimigos. A vitória deve ser registrada no momento correto, mesmo próxima do limite.

## 11. Ondas e mecânicas

Fases normais podem ter três ondas. Fases de elite combinam ondas e um inimigo especial. Generais têm duas etapas. O Rei Demônio tem três etapas.

A dificuldade não deve ser apenas aumentar a vida dos monstros.

Introduza gradualmente:

- Região 1: ondas simples, ensinando o funcionamento da campanha.
- Região 2: escudos quebrados por uma quantidade de acertos, valorizando velocidade.
- Região 3: totens que curam inimigos enquanto permanecem ativos.
- Região 4: um inimigo especial que interrompe temporariamente as skills.
- Região 5: encontros mais longos, valorizando energia disponível e eficiência.
- Região 6: general alterna entre armadura fechada e períodos de exposição.
- Região 7: invocadores geram reforços até serem derrotados.
- Região 8: dois alvos precisam ser derrotados dentro de uma pequena janela de tempo. A interface deve indicar claramente essa condição.
- Região 9: combinações de mecânicas já ensinadas.
- Região 10: Rei Demônio combina essas ideias em três etapas com sinais claros.

Não crie exigências ocultas nem torne uma vocação específica obrigatória para avançar. Diferentes composições devem continuar viáveis.

O primeiro general também deve ter duas etapas e uma mudança de comportamento claramente indicada, mantendo a complexidade adequada ao capítulo introdutório.

## 12. Alvo prioritário

Adicione uma interação simples durante o combate:

Clicar em um inimigo ou totem marca esse alvo como prioridade para o time, respeitando as regras de alcance e ataque existentes.

Mostre um marcador claro. Ao derrotar o alvo, o time volta ao comportamento automático. Permita remover a marcação.

Isso deve funcionar com mouse e toque.

A seleção de alvo deve ter efeito real na lógica de combate. Não implemente apenas o marcador visual.

## 13. Preparação da equipe

Antes de iniciar a fase, mostre:

- Até 15 heróis selecionados.
- Energia atual de cada um.
- Ataque e energia total da equipe.
- Condição especial da fase.
- Tempo disponível.
- Recompensa de primeira vitória.
- Recompensa de repetição.

Preserve o comportamento já solicitado para “Escolher os 15 mais fortes”: priorizar energia ATUAL, da maior para a menor; em caso de empate, priorizar maior ataque; continuar preenchendo os próximos slots nessa ordem.

Não usar durabilidade máxima como critério principal.

Não permita que o mesmo herói seja usado simultaneamente em atividades incompatíveis. Integre corretamente com Dungeon, Torre e forjas.

## 14. Estrelas

Cada fase pode ter três estrelas:

- 1 estrela: concluir dentro do prazo.
- 2 estrelas: concluir usando até 80% do tempo disponível.
- 3 estrelas: concluir usando até 60% do tempo disponível.

Uma estrela já libera a próxima fase.

Guarde o melhor resultado por jogador:

- Maior quantidade de estrelas.
- Melhor tempo válido.

Melhorar as estrelas pode conceder um pequeno prêmio único, mas não deve gerar recompensa infinita por repetir a mesma conquista.

## 15. Recompensas e economia

O ouro aumenta conforme o jogador avança.

Separe:

- Recompensa de primeira vitória.
- Recompensa de repetição.
- Recompensa única por melhora de estrelas, se adotada.

Inspecione os custos e ganhos atuais antes de definir valores. Crie uma curva coerente com a economia existente.

Não faça uma fase curta inicial render mais ouro por minuto do que regiões posteriores sem uma razão clara. Também não provoque um salto que torne todos os custos atuais irrelevantes.

Preserve a regra atual de drops:

- Boss da Dungeon concede 1 Selo de Pacto e 1 invocação de arma/caixa de armamento.
- Torre do Infinito não concede esses drops.
- Não adicionar equipamento direto como drop de boss neste momento.

Defina claramente quais inimigos contam como boss. Não conceda o drop de boss para cada onda ou inimigo de elite.

Evite duplicar recompensas se o jogador clicar duas vezes, atualizar a página ou reconectar.

## 16. Regiões libertadas

Após derrotar um general, mostre uma pequena transformação visual no mapa:

- A corrupção recua.
- A névoa se dissipa parcialmente.
- Uma bandeira ou símbolo do Refúgio aparece.
- O caminho para a próxima região é revelado.

Essa mudança deve persistir no progresso do jogador.

Não é necessário transformar todo o cenário de batalha em uma segunda arte completa. Use variações e camadas bem planejadas.

## 17. Interface e legibilidade

Use fonte clara nos textos de explicação, números, estatísticas e botões pequenos. Não repita o problema de letras minúsculas e difíceis de ler na tela das forjas.

A estética pixel art deve estar principalmente na arte, nos títulos e nos detalhes visuais, sem sacrificar a leitura.

Garanta:

- Contraste adequado.
- Textos sem cortes.
- Botões acessíveis.
- Escala correta no navegador.
- Layout funcional em notebook e monitor.
- Adaptação para telas menores.
- Nenhuma janela importante fora da área visível.
- Nenhuma rolagem vertical acidental causada pela roda do mouse nas telas fixas.

As barras de combate e os efeitos não podem cobrir os heróis ou impedir a seleção de alvos.

## 18. Salvamento e segurança do progresso

Preserve todos os saves existentes. Não resetar contas, moedas, inventários ou códices.

Adicione uma migração compatível para o progresso da campanha.

As regras relevantes devem ser validadas no servidor:

- Desbloqueio de fases.
- Composição permitida.
- Resultado válido.
- Recompensas.
- Primeira vitória.
- Estrelas.
- Drops de boss.

Use identificador de tentativa e processamento idempotente para impedir pagamento duplicado.

Não confiar apenas em dados enviados pela interface para conceder ouro ou itens.

Defina o comportamento de desconexão de forma consistente. Uma atualização da página não pode duplicar prêmios nem apagar progresso já confirmado.

## 19. Ordem de implementação e aprovação visual

Trabalhe dentro do projeto atual.

Primeiro: inspecione arquitetura, combate, energia, saves e economia.

Depois: crie o sistema de dados da campanha, persistência e regras, preparado para dez regiões e cem fases.

Em seguida: implemente a primeira região completa, com dez fases e o seguinte fluxo funcional:

portal → mapa → escolha da fase → equipe → combate → resultado → próxima fase → general → região libertada.

### Qualidade visual obrigatória

Use a ilha flutuante da tela principal do próprio jogo como referência de qualidade, riqueza de detalhes, iluminação e identidade visual.

Produza o cenário animado da primeira região, suas variações e a arena exclusiva do primeiro general com o máximo de cuidado.

Essa primeira região deve estabelecer o padrão visual e funcional de toda a campanha.

Não considere uma imagem estática com partículas genéricas suficiente para cumprir a proposta de cenário vivo. Implemente movimentos ambientais coerentes, em camadas, mantendo os personagens e a interface legíveis.

### Ponto de aprovação

Quando a primeira região estiver completa:

- Teste o fluxo no navegador com um perfil isolado.
- Mostre o cenário, suas animações, uma fase normal e a arena do general.
- Entregue capturas e um link local para eu experimentar.
- Informe o que está definitivo e o que ainda é provisório.
- Aguarde minha aprovação visual antes de produzir as artes e implementar o conteúdo das outras nove regiões.

Essa pausa deve ocorrer somente depois de a primeira região estar funcional e pronta para avaliação. Não pare apenas para apresentar um plano ou pedir aprovação de decisões técnicas rotineiras.

### Após minha aprovação

Expanda para as dez regiões e cem fases, seguindo o padrão aprovado.

Cada região deve ter identidade própria. Não transforme os cenários em cópias recoloridas.

Mantenha o jogo executável durante o trabalho.

Se uma ferramenta de geração de imagens não estiver disponível, comunique essa limitação e continue as partes independentes. Não apresente artes provisórias como resultado final.

## 20. Verificação e entrega

Teste com um perfil isolado, sem alterar meu save real.

Verifique no conteúdo implementado:

- Primeira fase acessível.
- Fases bloqueadas não podem ser iniciadas.
- Vitória libera a próxima fase.
- Derrota não concede prêmio de conclusão.
- Energia atual é respeitada.
- Herói sem energia para de atacar.
- Cronômetro encerra a tentativa corretamente.
- Alvo prioritário muda os ataques.
- Mecânicas especiais têm efeito real.
- Estrelas e melhores tempos persistem.
- Recompensas não duplicam.
- Drops de boss seguem as regras.
- Torre continua sem esses drops.
- Navegação Voltar funciona.
- Interface cabe no navegador.
- Cenários e animações aparecem corretamente.
- Redução de movimento e pausa em segundo plano funcionam.

Abra o jogo no navegador e confira visualmente o fluxo. Não considere apenas uma compilação bem-sucedida como prova de conclusão.

Na entrega da primeira região para aprovação, e novamente na entrega final após a expansão, apresente:

- Resumo do que foi implementado.
- Valores iniciais de balanceamento.
- Limitações ou partes provisórias, se existirem.
- Link local para abrir o jogo.
- Capturas das telas principais.

Prioridade final: uma campanha bonita, legível e funcional, com pixel art animada de alto cuidado, progressão compreensível e desafios que deem propósito à evolução do exército.
