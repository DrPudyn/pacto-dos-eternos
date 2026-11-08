# Tutorial e História — As Crônicas do Pacto

## Primeiro acesso e retomada
Contas novas abrem automaticamente um guia com 22 capítulos. A narrativa apresenta Azhrael, o pacto corrompido, o Refúgio e Lúmina, conectando o preparo dos Eternos à conquista dos nove castelos até o Rei Demônio.

O guia apresenta Invocações, quatro classes e raridades, atributos, energia, skills, equipamento, Mochila, farm, campanha ATB, Forjas, Lúmina, Fusão, aprimoramento, desmontagem, Códice, Torre, Bazar, Ranking, Baú e Configurações.

O jogador pode visitar áreas reais pelo botão **Ver esta área**, sem o tutorial executar compras, fusões ou batalhas por ele. O botão **Retomar tutorial** retorna ao guia; janelas modais como o Códice podem ser fechadas antes de retomá-lo.

**Continuar depois** salva a etapa. Em **Configurações → Tutorial e História** é possível continuar um guia pendente; após concluído, o botão passa a **Rever tutorial** e abre desde o começo. A revisão também permite navegar pelos capítulos já conhecidos.

## Conclusão e economia
- Contas novas começam sem Selos de Pacto nem baús de armas gratuitos. Heróis e equipamentos vêm de bosses, campanha, ouro na loja e progresso normal.
- A conclusão e o progresso são validados e salvos no servidor. Não é possível pular etapas pelo parâmetro inválido de etapa.
- Clique duplo, solicitações concorrentes e revisão não concedem brindes extras.
- Contas antigas preservam seus recursos, heróis e progresso (`legacyStarter` impede novos presentes em contas que já tinham bônus no cadastro).

## Implementação e verificação
Conteúdo: `tutorial-content.cjs`. Regras: `tutorial-rules.cjs`. Interface: `tutorial-client.js` e `tutorial.css`. Rotas autenticadas `/shared-api/tutorial/{state,advance,resume,defer,complete}`. Estado persistido em `user.tutorial`.

Verificações: `testar-tutorial.cjs`, `testar-baus-recompensas.cjs`, `testar-codex-criaturas.cjs` e `testar-atb-api.cjs`. Confirmados primeiro acesso automático, visitas às áreas, retomada pelas Configurações, conclusão sem brindes e revisão sem erro.

A conferência visual usou um banco vazio e um perfil fictício em `localhost:17850`, separado da conta real em `127.0.0.1:17841`. Nenhuma sessão, senha ou save de produção foi copiado para esse teste.
