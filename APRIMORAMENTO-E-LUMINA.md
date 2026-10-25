# Oficina de aprimoramento

Acesso: Forjas → Aprimorar equipamento. Lista paginada com classe, raridade, busca por nome/#ID e ordenação por raridade ou nível. A arma selecionada aparece sobre uma bigorna dourada. Carregar Brasas enche a barra em 650 ms e libera a tentativa; não reserva nem consome material. Aprimorar usa o endpoint existente com ID, versão e identificador idempotente. O servidor verifica Ouro, Brasas e estado do herói. A falha mantém o nível e aplica a chance acumulada existente. O sucesso mostra brilho e seta com o novo nível. Máximo +10. Mudar arma/filtro limpa a carga. Durante a requisição, filtros e seleção são bloqueados.

A janela de equipar continua sem aprimoramento, favoritos e saldo de Brasas.

A antiga ajudante agora é Lúmina, fada em pixel art com flutuação suave. Fusão ganhou um emblema de dois cristais convergindo para um. As funções de gerenciamento de heróis continuam as mesmas.

Arte: assets/forge-ui-atlas.png. Gerada pela ferramenta imagegen integrada, com três colunas iguais e fundo transparente. Usada por CSS, sem recortes destrutivos do arquivo.

Prompt utilizado: Pixel art game UI sprite atlas, horizontal 3:1, three equal columns, transparent background, no text or borders. First: original adorable floating fairy pet Lumina with aqua hair, cyan/violet butterfly wings, blue/gold dress and golden wand. Second: ornate golden anvil with blue runes on dark stone pedestal, empty broad top for weapon display. Third: two violet/blue crystals converging through golden arcs into a central gold crystal to symbolize fusion. Sharp clustered pixels, consistent premium fantasy palette, each sprite contained within its own column.

Validação: compilações; testar-equipamentos.cjs com regras e API em contas temporárias; navegador com busca, seleção, carga de Brasas, bloqueio antes da carga e liberação do botão após a barra. Nenhum Ouro ou Brasa da conta real foi gasto na conferência visual.
