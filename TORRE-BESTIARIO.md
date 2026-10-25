# Bestiário da Torre do Infinito

A Torre usa os 36 mobs/elites e os nove bosses dos castelos, com seus sprites de quatro quadros. Todas as criaturas podem aparecer desde a primeira tentativa, sem verificar castelos conquistados.

- Cada mob recebe uma identidade visual de criatura durante a criação do andar.
- Um boss é sorteado entre os nove guardiões a cada cinco andares, substituindo a aparência antiga do Giant.
- O sorteio deriva da semente da tentativa, andar e identificador do monstro, sem consumir a sequência aleatória do combate. A identidade é persistida no estado do monstro e é preservada ao sair, retornar ou reiniciar o servidor.
- Tentativas existentes recebem identidades estáveis na restauração, sem resetar andar, vida ou energia.
- A vida/dificuldade continua escalonando pelos andares, conforme as regras já existentes da Torre. Esta alteração reutiliza as artes; não transfere as habilidades ATB dos bosses da campanha para o combate da Torre.
- Ouro dos monstros e boss é explicitamente zero, inclusive ao restaurar o estado. Não há concessão de caixas de armas, equipamentos ou Selos de Pacto.
- XP de habilidades, recorde e pontuação continuam seguindo suas regras existentes. O Códice de criaturas mantém a descoberta pela campanha/farm, sem liberar bosses por encontros na Torre.

## Verificações
- `testar-torre-bestiario.cjs`: cobertura dos 36 mobs/nove bosses, assets, restauração, conversão de tentativas antigas, andares com boss e ouro zero.
- `verificar-torre.cjs`: seis andares completos, derrota de boss, contadores de ouro/baús/selos/equipamentos preservados, energia da coleção preservada, recorde e retomada.
- `verificar-torre-background.cjs`: progressão em segundo plano e persistência.
- Conferência visual em cópia isolada, sem alterar a tentativa ou recursos da conta do jogador.
