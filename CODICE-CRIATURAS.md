# Códice das Criaturas

Nova aba no Códice existente, organizada pelos nove castelos: 36 mobs/elites e nove bosses, com as artes em pixel art usadas nas batalhas.

## Descoberta e registro
- Uma criatura é descoberta quando derrotada na campanha ou no farm automático. Os bosses dos castelos são descobertos na campanha.
- Castelos anteriormente conquistados concedem as cinco descobertas correspondentes, sem exigir repetição de fases que só podem ser concluídas uma vez.
- Descobrir não ativa bônus: é necessário registrar cada entrada e ativar a coleção completa.
- Cada coleção requer quatro mobs/elites e seu boss. O registro não consome recursos.
- O servidor valida descobertas, registros e ativações por conta; repetição de cliques não multiplica bônus.

## Recompensa
Cada coleção completa e ativada concede +0,5% de ouro na Masmorra Automática, total máximo +4,5%. A soma é aplicada uma única vez ao crédito de ouro, depois do multiplicador de conquista de castelos. Não altera dano, vida, defesa, recompensas da campanha, Torre, selos ou baús.

## Verificação
`testar-codex-criaturas.cjs`: autenticação, registros bloqueados antes de descobrir, migração de 45 entradas, exigência de cinco registros, isolamento de contas, persistência SQLite, idempotência, descoberta no farm e crédito real de ouro.
`testar-campanha-atb.cjs`: a campanha descobre os 45 inimigos derrotados; demais regras permanecem válidas.
Layout conferido no navegador com dados fictícios. A conta do jogador não foi completada nem resetada.
