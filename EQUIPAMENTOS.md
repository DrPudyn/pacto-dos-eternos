# Equipamentos — Pacto dos Eternos

Implementação no jogo compartilhado: mochila na página inicial, slot de arma na ficha dos heróis, caixas por classe e desmontagem na Loja. Perfis existentes preservam seu inventário. Novos perfis recebem 15 baús de armas; cada boss da Dungeon derrotado concede mais 1 baú. Bosses da Torre não dão baús nem pergaminhos.

## Caixas

1.000 Ouro por caixa. Lotes de 1, 5, 10 ou 15; uma arma +0 da classe escolhida por caixa. Capacidade: 1.000 armas. Raridades: comum 82,87%; incomum 10,36%; rara 5,18%; épica 1,04%; lendária 0,51%; mítica 0,04%.

## Aprimoramento

Brasa do Pacto é o material obtido ao desmontar. Custos por tentativa para arma comum:

| Melhoria | Ouro | Brasas | Sucesso inicial |
|---|---:|---:|---:|
| 0 → 1 | 150 | 5 | 95% |
| 1 → 2 | 250 | 8 | 90% |
| 2 → 3 | 400 | 12 | 85% |
| 3 → 4 | 650 | 18 | 80% |
| 4 → 5 | 1.000 | 26 | 75% |
| 5 → 6 | 1.500 | 38 | 65% |
| 6 → 7 | 2.200 | 55 | 55% |
| 7 → 8 | 3.200 | 80 | 45% |
| 8 → 9 | 4.500 | 115 | 35% |
| 9 → 10 | 6.500 | 160 | 25% |

Multiplicadores de Ouro e material por raridade: 1 / 1,2 / 1,5 / 2 / 3 / 4. Arredondamento para cima em cada tentativa. Falha consome ambos os recursos, mantém nível e arma e aumenta a chance dessa arma em 5 pontos percentuais, até 100%. Sucesso zera esse contador.

Desmontagem base: 5 / 12 / 35 / 100 / 300 / 900 Brasas. Soma-se piso(80% das Brasas gastas nas melhorias bem-sucedidas). Tentativas malsucedidas e Ouro não voltam. Armas equipadas ou favoritas ficam protegidas. A interface mostra e pede confirmação da seleção antes de remover.

## Bônus

Ataque no +0: 2 / 3 / 4 / 6 / 8 / 10%. Cada nível adiciona 10% do bônus inicial, chegando ao dobro no +10. Incide sobre ATK base do herói. Comum/incomum não têm passivo; rara em diante sorteia um passivo compatível com a classe: velocidade, crítico, dano contra monstros/bosses, economia de energia ou execução. Intensidades: 1 / 2 / 3 / 4%; crítico usa metade em pontos percentuais. Passivos não crescem com os níveis.

Uma arma por herói, classe obrigatoriamente compatível. Herói trabalhando precisa descansar antes de trocar, retirar ou aprimorar sua arma. Venda ou fusão do herói devolve a arma à mochila do proprietário. A Torre copia os equipamentos no começo da expedição; alterações posteriores não modificam a cópia.

10% do Ouro gasto em caixas e melhorias entra no Festival, sem cobrança adicional. Débito, inventário e contribuição são salvos juntos no SQLite. Request IDs persistidos impedem duplicação após reenvio; versões de armas impedem aprimoramentos simultâneos sobre o mesmo estado. Compra e resultados são decididos no servidor com aleatoriedade criptográfica.

## Validação

`node testar-equipamentos.cjs`: regras, combate real, retorno de 80%, propriedade, proteção, compra 15, débito único, Festival, concorrência e persistência. Testes usam pasta temporária. `node verificar-torre.cjs`, `node testar-skills.cjs`, `node testar-forjas-conjuntas.cjs`: regressões da progressão e combate existentes.

Conferência de interface em servidor temporário separado: lote 15, equipar, aprimorar, recarregar, ficha com ataque efetivo e desmontagem em lote. O teste de skills usa saldo explícito na fixture, pois novos perfis reais começam com zero Ouro e 15 pergaminhos.

## Interface visual v2

Mochila em pixel art ao lado do Códice, somente para consultar arte, descrição e atributos. Equipar, retirar, favoritar e aprimorar ficam no seletor aberto pela ficha do herói. Foram criadas 24 skins diferentes (quatro classes × seis raridades), usadas também no slot e nos resultados das caixas. Arsenal tem cenário do Salão dos Pactos, molduras de latão e placas ilustradas de classe. Preços e chances preservados.

## Revelação e dimensionamento

Resultado de caixas ocupa uma cena inteira, com baús individuais, Revelar todos e giro para cartas de raridade; o painel antigo foi retirado do fluxo ativo. O lote de 15 ajusta colunas e tamanho dos cards à altura disponível. Teclado, foco e temporizadores são limpos ao fechar; animação reduzida respeita a preferência do sistema.

Equipamento e desmontagem usam painel limitado ao viewport, sem herdar transformações da página, com colunas que podem encolher e layout empilhado em telas estreitas. A arma na ficha usa fonte Arial nítida e ícone maior. Novos botões da Loja têm faixas azul e dourada.

Conferido no navegador em conta temporária: painel de equipamento sem overflow horizontal/vertical a 1150×835; desmontagem sem corte lateral; lote 15, revelação individual seguida de revelar todos, 15 cartas e botões finais dentro da tela, sem janela antiga ou scroll nos resultados; nome da arma em Arial 16px. Saves reais não alterados pelos testes.

## Baús de recompensa

`player.weaponSummons` guarda as invocações gratuitas de armas. Novos perfis começam com 15; legado sem campo começa em 0, sem apagar progresso ou conceder novamente o bônus ao entrar. A mesma confirmação de combate da Dungeon que contabiliza os pergaminhos soma os bosses novos nesse saldo, uma vez por derrota. A Torre usa fluxo separado e não altera esses saldos.

`equipment/redeem` abre 1/5/10/15 baús, com classe escolhida e mesmas probabilidades das caixas pagas. Exige saldo de baús e espaço para o lote inteiro antes de consumir qualquer baú. Ouro não é debitado nem gerado no Festival; recibos persistidos evitam duplicação por reenvio. A compra paga em equipment/open continua separada. O Baú mostra Ouro, Pergaminhos e Baús de Armas em três seções; o resgate abre a animação de revelação já existente.

Validação: testar-baus-recompensas.cjs cobre bônus inicial, boss real da Dungeon, reconsulta, restauração, resgate gratuito sem Ouro, autenticação, concorrência, espaço na mochila e persistência. verificar-torre.cjs confirma bosses mortos sem ganho de baús/pergaminhos. Conferido no navegador: iniciante com 0 Ouro e 15+15, escolha de Maga e abertura gratuita de 15, saldo de pergaminhos preservado, invocação de herói funcionando.

## Selos de Pacto — Abrir todos

O cartão de invocação de heróis no Baú agora se chama Selo de Pacto e tem somente Abrir todos. A quantidade é calculada pelo servidor: mínimo entre selos disponíveis e vagas até 500 heróis. Saldo restante é preservado quando falta espaço. A chamada antiga de 1/5/10 continua aceita para abas antigas. Testado: lote inicial de 15, cliques concorrentes sem duplicação, 499 heróis com cinco selos invoca somente um e mantém quatro; botão único e animação conferidos no navegador.
