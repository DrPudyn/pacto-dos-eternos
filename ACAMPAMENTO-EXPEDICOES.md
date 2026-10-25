# Acampamento de Expedições

Substitui o atalho de texto “Masmorra Livre” no rodapé da Dimensão Sombria por uma ilha clicável, posicionada na área livre abaixo dos castelos.

- Barracas azuis e douradas, dois aventureiros, suprimentos, baú, fogueira e portal azul.
- Fogueira com chamas e brasas em movimento; partículas orbitam o portal. O modo de movimento reduzido mantém efeitos estáticos.
- Mouse ou foco por teclado destacam a ilha e mostram a descrição, número de heróis trabalhando e multiplicador de ouro.
- A contagem usa os heróis da conta, atualiza a cada quatro segundos a partir do estado já recebido e não gera consultas adicionais ao servidor.
- A navegação usa a mesma ação `realm:free-dungeon` e a transição de tela existente. Nenhuma regra de farm, recompensa ou conta é alterada.

## Arte
Ferramenta utilizada: geração de imagens integrada (skill imagegen), com transparência. Arquivo final: `assets/refuge-expedition-camp-v1.png`.
Prompt final preservado em `assets/expedition-camp-prompt.txt`. A arte é copiada para os dois diretórios do jogo pela preparação normal.

## Conferência final
Verificado no navegador na conta JUKA: a ilha aparece no mapa, o painel informa 15 heróis e o multiplicador ×8,7 conforme o estado recebido; o clique abre a Masmorra Livre e permite voltar ao Refúgio. Captura: `acampamento-expedicoes-verificado.png`. A conta não foi resetada nem teve recursos alterados por ferramentas de edição.
