# Códice das Armas

Aba lateral com espada no livro existente. Seis conjuntos de quatro armas: espada, lança, arco e cajado. Cada raridade tem suas próprias sprites do atlas atual.

| Conjunto | Bônus permanente |
| --- | --- |
| Comum | +0,5% de Ouro dos mobs |
| Incomum | +0,5% de velocidade de reparo |
| Raro | +0,5% de dano |
| Épico | 0,5% menos consumo de energia |
| Lendário | +0,25 ponto percentual de chance de crítico |
| Mítico | +1% de dano |

Registro e ativação manuais, sem consumir equipamentos. Descobertas de armas possuídas já existentes são incluídas. Registros permanecem após desmontagem; cópias, passivas e níveis +0 a +10 não criam registros extras. Cada conjunto concede o bônus uma vez. O servidor exige quatro registros válidos, inclusive ao calcular os bônus, impedindo ativação incompleta.

Os bônus somam aos outros Códices. Na Torre, ficam fixos ao iniciar a expedição. Nenhuma mudança nas chances de caixas, preços ou atributos das armas.

Validação: `node testar-codex-armas.cjs`, `node testar-equipamentos.cjs`, `node verificar-torre.cjs`; registro das quatro armas comuns e ativação no navegador com dados isolados. Livro sem rolagem, ajustado ao tamanho disponível.
