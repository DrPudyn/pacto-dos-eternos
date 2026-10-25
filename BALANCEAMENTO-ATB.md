# Revisão do balanceamento — 22/10/2026

- Removido multiplicador de dano genérico baseado na soma de níveis das passivas.
- Precisão respeita chance de 20/22/24/26% de ataque sem custo de energia; canalização da arma também participa.
- Fúria reinicia a sequência ao trocar de alvo. Dano contra monstros/bosses e Execução respeitam o nível específico; Execução da arma mantém seu próprio valor.
- Passos rápidos continua sendo movimento, sem aumentar ATB. Ferreiro continua reparando energia em repouso, sem virar cura de vida. Descrições esclarecidas.
- Cura do espadachim e arqueiro alinhada às descrições de 22% e 28%.
- Armas: ataque base × (1 + 0,4L + 0,04L²). Lendária: +8% no +0, +32% no +5, +54,08% no +8, +72% no +10. Custos/chances inalterados. Aplica-se também ao farm e torre.
- Castelos 7 e 8: ataque inimigo +15%, vida do boss +10%.
- Rei: abaixo de 60% da vida causa +10% de dano; abaixo de 25%, +22% e chance de ataque coletivo sobe de 45% para 70%. Fúria por tempo permanece.

## Simulação automática, 40 sementes por configuração
Quatro classes, atributos médios por raridade, passivas selecionadas no nível 3; armas da mesma raridade com passivas compatíveis (monstros/crítico/boss). Sem reproduzir todos os possíveis conjuntos, códices ou comando manual.

| Equipe/arma | Castelo 6 | Castelo 7 | Castelo 8 | Rei |
|---|---:|---:|---:|---:|
| Épica +10 |40|37|20|0|
| Lendária +0 |40|40|34|0|
| Lendária +5 |40|40|40|0|
| Lendária +8 |40|40|40|3|
| Lendária +10 |40|40|40|14|
| Mítica +10 |40|40|40|40|

Estes resultados não garantem taxas reais dos jogadores: rolagem de atributos, passivas, composição e decisões mudam o resultado. Não há bloqueio artificial por raridade. Uma lendária muito bem rolada pode superar o modelo médio.

Verificações: testar-balanceamento-atb.cjs, testar-campanha-atb.cjs, testar-skills.cjs e testar-atb-api.cjs. Nenhum reset solicitado ou executado na conta do jogador.
