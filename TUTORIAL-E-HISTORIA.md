# Tutorial e História — As Crônicas do Pacto

## Primeiro acesso e retomada
Contas novas abrem automaticamente um guia com 22 capítulos. A narrativa apresenta Azhrael, o pacto corrompido, o Refúgio e Lúmina, conectando o preparo dos Eternos à conquista dos nove castelos até o Rei Demônio.

O guia apresenta Invocações, quatro classes e raridades, atributos, energia, skills, equipamento, Mochila, farm, campanha ATB, Forjas, Lúmina, Fusão, aprimoramento, desmontagem, Códice, Torre, Bazar, Ranking, Baú e Configurações.

O jogador pode visitar áreas reais pelo botão **Ver esta área**, sem o tutorial executar compras, fusões ou batalhas por ele. O botão **Retomar tutorial** retorna ao guia; janelas modais como o Códice podem ser fechadas antes de retomá-lo.

**Continuar depois** salva a etapa. Em **Configurações → Tutorial e História** é possível continuar um guia pendente; após concluído, o botão passa a **Rever tutorial** e abre desde o começo. A revisão também permite navegar pelos capítulos já conhecidos.

## Recompensa e economia
- Nas contas novas, os 15 Selos de Pacto e 15 baús de armas iniciais são entregues ao concluir o tutorial, em vez de imediatamente no cadastro.
- A conclusão e o progresso são validados e salvos no servidor. Não é possível pular diretamente para a recompensa pela interface ou pelo parâmetro de etapa.
- Clique duplo, solicitações concorrentes, reinício e revisão não repetem a entrega.
- O presente não exige ouro e pode ser aberto no Baú: selos invocam heróis, e os baús geram armas da classe escolhida.
- Contas antigas preservam seus recursos, heróis e progresso. O bônus inicial já entregue é reconhecido e não é entregue novamente.

## Implementação e verificação
Conteúdo: `tutorial-content.cjs`. Regras: `tutorial-rules.cjs`. Interface: `tutorial-client.js` e `tutorial.css`. Rotas autenticadas `/shared-api/tutorial/{state,advance,resume,defer,complete}`. Estado persistido em `user.tutorial`.

Verificações: `testar-tutorial.cjs`, `testar-baus-recompensas.cjs`, `testar-codex-criaturas.cjs` e `testar-atb-api.cjs`. Confirmados primeiro acesso automático, visitas às áreas, retomada pelas Configurações, conclusão com presentes 15+15 no Baú e revisão sem duplicação.

A conferência visual usou um banco vazio e um perfil fictício em `localhost:17850`, separado da conta real em `127.0.0.1:17841`. Nenhuma sessão, senha ou save de produção foi copiado para esse teste.
